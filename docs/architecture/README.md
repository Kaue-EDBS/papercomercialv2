# Arquitetura Paper Comercial V2

## Objetivo

Reconstruir a camada de dados e engenharia do Paper Comercial com arquitetura auditavel, reproduzivel e desacoplada de prompts, memoria de chat e ajustes manuais nao versionados.

## Fontes da verdade

```text
                           FIGMA
                    UX / UI / referencia
                           |
                           v
CHATGPT <--------------> GITHUB <--------------> LOVABLE
orquestracao             fonte oficial           runtime + PRIMARY DB
QA / auditoria           codigo + DDL + docs           |
                                                       | replica 1-way
                                                       v
                                                   SUPABASE
                                             REPLICA / auditoria
```

| Camada | Papel oficial | Nao deve ser |
|---|---|---|
| GitHub | Codigo, DDL, contratos, regras, testes, documentacao, historico | Banco operacional |
| Lovable Cloud | Runtime e banco operacional PRIMARY | Fonte permanente de regra/documentacao |
| Supabase externo | REPLICA independente e ambiente de auditoria/consulta | Origem automatica de escrita para producao |
| Figma | UX/UI e referencia visual | Fonte de regra de negocio estrutural |
| ChatGPT | Orquestracao, implementacao assistida, QA e auditoria | Fonte permanente de verdade |

## Ambientes identificados em 2026-09-15

- Lovable: projeto `Paper Comercial OFICIAL` (`8380d53b-a14d-4993-9447-d7c404347336`) — PRIMARY.
- Supabase externo: projeto `vevmnoxbjdkibdwfygfn`, regiao `sa-east-1` — REPLICA.
- Repositorio: `Kaue-EDBS/papercomercialv2` — fonte oficial das alteracoes permanentes.

O `supabase/config.toml` legado aponta para outro identificador tecnico associado ao stack historico. Ele nao deve ser reinterpretado como a REPLICA externa definida nesta V2 sem decisao explicita.

## Estado de reset inicial

Antes do reset V2, PRIMARY e REPLICA possuíam os mesmos objetos de negocio no schema `public`, todos sem dados:

- `densidade_demografica_cep5` — 0 linhas;
- `dim_escola` — 0 linhas;
- `dim_municipio` — 0 linhas;
- `escola_protheus` — 0 linhas;
- `v_escola_por_protheus` — view;
- `densidade_demografica_cep5_id_seq` — sequence associada.

O reset V2 remove apenas esta camada de negocio e preserva schemas gerenciados pela plataforma, incluindo `auth`, `storage`, `realtime`, extensoes e equivalentes.

## Banco V2

A V2 usa `public` para objetos consumidos pela aplicacao e namespaces logicos por prefixo:

- `dim_`: dimensoes canonicas;
- `fato_`: fatos por periodo/grao;
- `agg_`: agregacoes preparadas para leitura;
- `etl_`: metadados de carga;
- `audit_`: qualidade, paridade e rastreabilidade;
- `stg_`: staging temporaria/controlada quando necessaria.

A fundacao inicial contem somente:

- `etl_cargas`;
- `audit_data_quality`;
- `audit_replication_runs`.

Nenhuma tabela de negocio deve ser recriada ate existir contrato, DDL e criterio objetivo de QA.

## Principios obrigatorios

1. Uma escrita operacional: negocio e promovido primeiro no PRIMARY.
2. REPLICA recebe copia unidirecional; nunca repara o PRIMARY automaticamente.
3. Toda carga deve ser idempotente.
4. Contrato e DDL precedem a carga.
5. Chaves estaveis precedem nomes em joins.
6. Toda carga deve ter origem, identificador, timestamp e contagens.
7. Falha critica bloqueia promocao.
8. Segredos ficam somente server-side.
9. Tabelas internas usam RLS e nao sao expostas por conveniencia.
10. Frontend nao cria regra estrutural de dados.
11. Toda alteracao permanente e GitHub-first + commit.
12. Contagem + checksum sao obrigatorios para declarar paridade PRIMARY x REPLICA quando houver dados replicados.

## Reconstrucao por dominio

A ordem recomendada para reintroduzir as bases do Paper Comercial e:

1. fundacao e governanca;
2. identidade geografica e escolar canonica;
3. cadastro operacional/comercial de escolas;
4. Censo Escolar;
5. demografia/CEP;
6. adocao historica;
7. Melhor Oferta;
8. Zero Estoque;
9. regras de concorrencia/area de influencia;
10. agregacoes e interfaces de consumo.

Cada dominio deve ser tratado como uma migration/contrato independente e testado antes de iniciar o seguinte.
