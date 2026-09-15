# Banco Paper Comercial V2

Este diretorio e a fonte oficial de DDL da reconstrucao V2.

## Regra

Nenhuma tabela de negocio deve ser criada no PRIMARY ou na REPLICA sem existir primeiro aqui e, quando aplicavel, possuir contrato em `docs/data-contracts/`.

## Migrations V2

- `0000_reset_legacy.sql` — remove a camada de negocio legada auditada em 2026-09-15, preservando schemas gerenciados pela plataforma.
- `0001_foundation.sql` — cria `etl_cargas`, `audit_data_quality` e `audit_replication_runs`.
- `0002+` — reservadas aos dominios reconstruidos, um por vez, com contrato e QA.

## Historico legado

O diretorio `supabase/migrations/` pertence ao desenho anterior. Ele permanece no repositorio como evidencia historica e **nao deve ser reaplicado automaticamente** na V2.

## Aplicacao

1. revisar/commitir SQL no GitHub;
2. aplicar no Lovable Cloud PRIMARY;
3. validar estrutura;
4. aplicar o mesmo desenho no Supabase REPLICA;
5. validar paridade estrutural;
6. quando houver dados, validar contagem + checksum;
7. atualizar documentacao/handoff.
