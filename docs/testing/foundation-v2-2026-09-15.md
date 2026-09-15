# Validação da fundação V2 — 2026-09-15

## Escopo

Este documento registra o reset controlado da camada de negócio legada e a instalação da fundação técnica V2 do Paper Comercial.

## Ambientes

- PRIMARY: Lovable `Paper Comercial OFICIAL` (`8380d53b-a14d-4993-9447-d7c404347336`).
- REPLICA: Supabase `vevmnoxbjdkibdwfygfn`, região `sa-east-1`.

## Estado antes do reset

PRIMARY e REPLICA apresentavam os mesmos objetos em `public`:

- `densidade_demografica_cep5` — 0 linhas;
- `dim_escola` — 0 linhas;
- `dim_municipio` — 0 linhas;
- `escola_protheus` — 0 linhas;
- `v_escola_por_protheus` — view;
- `densidade_demografica_cep5_id_seq` — sequence associada.

No PRIMARY, não havia rotinas `public` nem policies específicas nesses objetos.

## Reset aplicado

SQL versionado: `database/v2/0000_reset_legacy.sql`.

Foram removidos apenas os objetos de negócio acima. Schemas gerenciados pela plataforma foram preservados, incluindo `auth`, `storage`, `realtime`, extensões e equivalentes.

## Fundação aplicada

SQL versionado: `database/v2/0001_foundation.sql`.

Objetos finais esperados em `public`:

- `etl_cargas`;
- `audit_data_quality`;
- `audit_replication_runs`.

## Evidência pós-aplicação

### PRIMARY

Objetos `public` encontrados após a aplicação:

```text
etl_cargas
audit_data_quality
audit_replication_runs
```

Todas as três tabelas:

- 0 linhas;
- RLS habilitado;
- sem grants para `anon` ou `authenticated`.

### REPLICA

Objetos `public` encontrados após a aplicação:

```text
etl_cargas
audit_data_quality
audit_replication_runs
```

Todas as três tabelas:

- 0 linhas;
- RLS habilitado;
- sem grants para `anon` ou `authenticated`.

Migrations registradas na REPLICA para esta etapa:

- `paper_v2_reset_legacy`;
- `paper_v2_foundation`.

O histórico anterior de migrations da REPLICA foi preservado como metadado da plataforma; ele não recria objetos legados porque a camada `public` foi efetivamente resetada.

## Advisors da REPLICA

### Segurança

Somente `INFO` `rls_enabled_no_policy` nas três tabelas técnicas. Isso é intencional: as tabelas são internas, têm RLS habilitado e não possuem acesso direto de `anon/authenticated`.

### Performance

Somente `INFO` de índices ainda não utilizados. Esperado porque as tabelas acabaram de ser criadas e estão vazias.

## Resultado

**FUNDAÇÃO V2 VALIDADA**.

PRIMARY e REPLICA estão estruturalmente alinhados na camada técnica inicial e prontos para a reconstrução dos domínios de negócio um a um, via contrato + DDL + QA + replicação.