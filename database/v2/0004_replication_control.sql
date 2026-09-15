-- CIT/Paper: resumable replication control; never grants browser access.
begin;
create schema if not exists cit_private;
-- # replication_jobs: durable checkpoint and audit outbox for a source snapshot.
create table cit_private.replication_jobs (
 job_id uuid primary key,
 snapshot_sha256 text not null check(snapshot_sha256 ~ '^[a-f0-9]{64}$'),
 status text not null check(status in ('STAGING','PROMOTED','AUDITED')),
 created_at timestamptz not null default now(),
 completed_at timestamptz,
 result jsonb not null default '{}'::jsonb
);
create index replication_snapshot_idx on cit_private.replication_jobs(snapshot_sha256,status);
-- # replication_pages: exact page replay is idempotent; altered replay is rejected.
create table cit_private.replication_pages (
 job_id uuid references cit_private.replication_jobs(job_id) on delete cascade,
 table_name text not null,
 page_no integer not null check(page_no>=0),
 sha256 text not null,
 row_count integer not null check(row_count between 1 and 500),
 primary key(job_id,table_name,page_no)
);
-- # replication_items: private staging, never partially exposed as business data.
create table cit_private.replication_items (
 job_id uuid references cit_private.replication_jobs(job_id) on delete cascade,
 table_name text not null,
 row_key text not null,
 payload jsonb not null,
 primary key(job_id,table_name,row_key)
);
alter table cit_private.replication_jobs enable row level security;
alter table cit_private.replication_pages enable row level security;
alter table cit_private.replication_items enable row level security;
revoke all on all tables in schema cit_private from public,anon,authenticated;
comment on table cit_private.replication_jobs is 'Checkpoint and durable audit outbox. Written only by the explicit server-side replication worker.';
commit;
