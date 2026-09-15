# Banco Paper Comercial V2

`database/v2/` é a única fonte oficial de DDL da V2.

## Estado atual

- `0000_reset_legacy.sql` — evidência reproduzível do reset realizado em 2026-09-15.
- `0001_foundation.sql` — cria somente `etl_cargas`, `audit_data_quality` e `audit_replication_runs`.
- `0002+` — ainda não definidos. Não atribuir domínio, chave ou regra antes de nova decisão/contrato.

## Histórico antigo

Os arquivos antigos de `supabase/migrations/` foram removidos da **branch atual** durante o clean slate de regras de negócio. Eles continuam recuperáveis no histórico Git, mas são não vigentes e não devem ser reaplicados.

O histórico de migrations já registrado internamente nos bancos/plataformas é metadado operacional e não equivale a DDL oficial da V2.

## Aplicação

1. contrato/decisão;
2. DDL no GitHub;
3. commit;
4. aplicação no PRIMARY;
5. QA;
6. aplicação/replicação na REPLICA conforme arquitetura;
7. contagem + checksum para dados replicados;
8. documentação final.
