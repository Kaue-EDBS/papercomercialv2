# Replicação Paper Comercial V2 — PRIMARY -> REPLICA

## Direção

```text
Lovable Cloud PRIMARY  --->  Supabase REPLICA (`vevmnoxbjdkibdwfygfn`)
```

Nunca há escrita automática REPLICA -> PRIMARY.

## IDs Supabase

- `vevmnoxbjdkibdwfygfn`: REPLICA externa confirmada.
- `chwsmkdkgdgocnbcyvmq`: ID presente no `supabase/config.toml`; provável backend técnico associado ao Lovable/PRIMARY, mas sem confirmação administrativa pela conexão Supabase externa atual.

O `config.toml` **não deve ser alterado para apontar para a REPLICA**.

## Estado

A fundação contém `audit_replication_runs`. O pipeline genérico ainda não foi implementado no Paper Comercial V2.

Nenhuma tabela de negócio está atualmente cadastrada para replicação.

Quando houver o primeiro dataset aprovado, o pipeline deve seguir o padrão do PEM: allowlist explícita, leitura paginada, lotes idempotentes, checksum determinístico, auditoria e reconciliação; reparo sempre PRIMARY -> REPLICA.

## Segurança

Credenciais somente server-side; nenhuma `service_role` no frontend/GitHub; RLS e menor privilégio; receiver autenticado quando for implementado.
