# Banco Paper Comercial V2

`database/v2/` é a única fonte oficial de DDL da V2.

## Estado atual

- `0000_reset_legacy.sql` — evidência reproduzível do reset realizado em 2026-09-15.
- `0001_foundation.sql` — cria `etl_cargas`, `audit_data_quality` e `audit_replication_runs`.
- `0002_geografia_dtb_2025_cep5.sql` — primeiro domínio V2: geografia canônica DTB 2025 + dimensão operacional CEP5.
- `0003+` — ainda não definidos. Não atribuir domínio, chave ou regra sem nova decisão/contrato.

## Domínio 0002 — Geografia + CEP5

Contrato: `docs/data-contracts/geografia-dtb-2025-cep5.md`.

A estrutura administrativa replica a geografia homologada no PEM:

- `dim_municipio`;
- `dim_distrito`;
- `dim_subdistrito`.

O Paper Comercial acrescenta:

- `dim_cep5`.

`COD_MUNICIPAL` é a chave canônica administrativa. Como CEP5 não é globalmente único, a identidade territorial fina é a combinação `(cod_municipal, cep5)`.

O CEP5 será a granularidade operacional preferencial para futuros contratos de concorrência e demografia quando o contexto municipal estiver disponível. A criação desta dimensão não define, por si só, fórmulas de concorrência, raio, ranking ou agregação demográfica.

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
