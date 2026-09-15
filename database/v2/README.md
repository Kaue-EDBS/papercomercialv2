# Banco Paper Comercial V2

`database/v2/` é a única fonte oficial de DDL da V2.

## Estado atual

- `0000_reset_legacy.sql` — evidência reproduzível do reset realizado em 2026-09-15.
- `0001_foundation.sql` — cria `etl_cargas`, `audit_data_quality` e `audit_replication_runs`.
- `0002_geografia_dtb_2025_cep5.sql` — primeiro domínio V2: geografia canônica DTB 2025 + dimensão operacional CEP5.
- `0003+` — ainda não definidos. Não atribuir domínio, chave ou regra sem nova decisão/contrato.

## Domínio 0002 — Geografia + CEP5

Contrato: `docs/data-contracts/geografia-dtb-2025-cep5.md`.

Fontes vigentes deste domínio no próprio Paper:

- `COD_MUNICIPAL.zip` — DTB 2025 original auditado;
- `CEP5.xlsx` — referência territorial CEP5 auditada.

Estrutura:

- `dim_municipio`;
- `dim_distrito`;
- `dim_subdistrito`;
- `dim_cep5`.

`COD_MUNICIPAL` é a chave canônica administrativa. Como CEP5 não é globalmente único, a identidade territorial fina é a combinação `(cod_municipal, cep5)`.

O CEP5 será a granularidade operacional preferencial para futuros contratos de concorrência e demografia quando o contexto municipal estiver disponível. A criação desta dimensão não define, por si só, fórmulas de concorrência, raio, ranking ou agregação demográfica.

### Estado da carga

DTB 2025 concluído:

- 5.571 municípios;
- 10.751 distritos;
- 646 subdistritos;
- PRIMARY x REPLICA com mesma contagem e checksum.

CEP5:

- fonte auditada;
- 24.905 associações válidas;
- schema criado;
- carga de dados ainda pendente de conclusão e reconciliação.

## Isolamento

O Paper Comercial V2 é autônomo.

Nenhum outro projeto, banco ou aplicação deve ser utilizado como fonte de dados, transporte, fallback, especificação ou referência operacional sem pedido explícito do usuário.

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
