# Contrato de dados — Setorizacao 2026 V2

- **Versao:** 1.0
- **Data:** 2026-09-29
- **Status:** Aprovado e carregado no PRIMARY (`chwsmkdkgdgocnbcyvmq`)
- **Fonte:** pacote `Banco_de_Dados_Setorizacao.zip` (README, `001_schema_normalizado_v2.sql`, `manifest_auditoria_v2.json`, `dim_municipio.json`, `dim_escola.json`, `escola_protheus.json`)
- **DDL versionada:** `database/v2/0010_setorizacao_v2.sql`

## Decisao de chave municipal

O pacote trazia uma tabela propria `dim_municipio` com 2.730 municipios. A dimensao
municipal canonica do CIT continua sendo `public.dim_municipio` (DTB 2025, 5.571
municipios, chave `cod_municipal`). Verificacao executada antes da carga: os 2.730
codigos do pacote casam 1:1 com `dim_municipio.cod_municipal` (2730/2730). Decisao do
responsavel em 2026-09-29: reaproveitar a dimensao existente, sem segunda fonte de
municipio. Os atributos comerciais `uf` (sigla) e `regiao` (macrorregiao) foram
adicionados como colunas nulaveis em `dim_municipio` e preenchidos apenas para os
2.730 municipios cobertos pelo pacote.

## Entidades

| Tabela | Chave | Descricao |
| --- | --- | --- |
| `public.dim_escola` | `escola_id` | Escola fisica. `INEP:<cod_inep>` quando ha INEP; caso contrario `PROTHEUS:<cod_protheus>`. INEP repetido no CRM e consolidado em uma unica entidade fisica. |
| `public.escola_protheus` | `cod_protheus` | Cadastro operacional/comercial. `cod_protheus` e a chave digitada pelo consultor. |
| `public.v_escola_por_protheus` | `cod_protheus` | Visao de leitura unindo cadastro, escola fisica e municipio. `security_invoker = true`. |

## Contagens auditadas (pos-carga)

| Metrica | Manifesto | Banco |
| --- | --- | --- |
| Cadastros Protheus | 34.510 | 34.510 |
| Escolas fisicas | 33.924 | 33.924 |
| Municipios cobertos | 2.730 | 2.730 |
| Linhas da visao | — | 34.510 |
| Escolas orfas de municipio | 0 | 0 |
| Cadastros orfaos de escola | 0 | 0 |
| Adocao inconsistente | 41 | 41 |
| CPF descartado (`cnpj_protheus` nulo) | 177 | 177 |
| Sem dados de alunos | 8.400 (metrica do manifesto) | 8.354 (`dados_alunos_disponiveis = false` no JSON de origem) |

Reconciliado em 2026-09-29: o manifesto conta **cadastros Protheus** (8.400 em
`escola_protheus` ligados a escola com `dados_alunos_disponiveis = false`), enquanto
8.354 e a contagem de **escolas fisicas** em `dim_escola`. A diferenca de 46 vem de
INEPs repetidos no CRM. Nao ha divergencia de carga.

## Dominios controlados

- `tipo_escola`: Comunitaria, Confessional, Filantropica, Particular, Privada.
- `cnpj_protheus_status`: `cnpj_valido`, `cpf_descartado`, `cnpj_invalido`.
- `tipo_contrato_brasil`: FIE, SISTEMA, VDD.
- `tipos_adocao` (array, minimo 1): Didatico e Apoio, Hibrido, Material Proprio, Sem informacao, Sistema de Ensino, Sistema de Ensino e Material Proprio, So literatura mapeada.
- Faixas de mensalidade (EI, EF1, EF2, EM): `1. ate R$399`, `2. R$400 a R$799`, `3. R$800 a R$1.399`, `4. R$1.400 a R$2.399`, `5. acima de R$2.400`.

Os rotulos acima estao gravados com acentuacao original nos constraints do banco.

## Acesso

RLS habilitada em `dim_escola` e `escola_protheus`, sem policy permissiva.
`anon` e `authenticated` nao possuem privilegio algum sobre as tabelas nem sobre a
visao. Somente `service_role` (backend controlado) le e escreve. A consulta por
`cod_protheus` sera exposta futuramente por camada de backend autenticada; nao ha
API de fornecimento de dados a terceiros.

## Procedimento de carga executado

1. Migration `0010` cria estrutura, indices, visao e privilegios.
2. Grant temporario de escrita ao papel de carga interno.
3. `COPY` dos tres CSVs derivados dos JSONs do pacote, em transacao unica.
4. Validacao de contagens e integridade referencial.
5. Revogacao do grant temporario.
