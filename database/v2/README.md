# Banco — CIT / Paper Comercial V2

> Estado auditado em **15/09/2026**. Este diretório é a fonte oficial de DDL da V2.

## Documentação de referência

- [Mapa completo de engenharia](../../docs/architecture/mapa-cit-paper-v2.md).
- [Contrato geográfico](../../docs/data-contracts/geografia-dtb-2025-cep5.md).
- [Snapshot de evidências](../../docs/testing/cit-paper-snapshot-2026-09-15.json).
- [Consultas somente leitura](../validation/geografia_snapshot_readonly.sql).

## Migrations canônicas

| Arquivo | Escopo | Atenção |
|---|---|---|
| `0000_reset_legacy.sql` | Reset da camada de negócio antiga | Registro histórico executável; **não reaplicar sobre os dados atuais**. |
| `0001_foundation.sql` | `etl_cargas`, `audit_data_quality`, `audit_replication_runs` | Fundação técnica existente nos dois ambientes. |
| `0002_geografia_dtb_2025_cep5.sql` | Município, distrito, subdistrito e CEP5 | Primeiro domínio de dados carregado e homologado. |
| `0003+` | Ainda não definido | Exige novo escopo e contrato; não recuperar migrations legadas. |

Os arquivos em `database/validation/` são consultas de auditoria e **não são migrations**. Um arquivo SQL no GitHub não prova que foi aplicado; cada aplicação exige confirmação e QA do ambiente correto.

## Estrutura e volumes

| Tabela | Colunas | PRIMARY | REPLICA |
|---|---:|---:|---:|
| `etl_cargas` | 16 | 2 | 2 |
| `audit_data_quality` | 8 | 2 | 2 |
| `audit_replication_runs` | 16 | 1 | 0 |
| `dim_municipio` | 14 | 5.571 | 5.571 |
| `dim_distrito` | 9 | 10.751 | 10.751 |
| `dim_subdistrito` | 10 | 646 | 646 |
| `dim_cep5` | 8 | 24.905 | 24.905 |

As quatro dimensões somam **41.873 registros por banco**. As estruturas das sete tabelas comparadas coincidem, mas a trilha de replicação não está integralmente espelhada.

## Fontes e chaves

Fontes aprovadas: `COD_MUNICIPAL.zip` — DTB 2025 original — e `CEP5.xlsx`, aba `Resultados`.

Chaves físicas:

- município: `cod_municipal`, texto de sete dígitos;
- distrito: `cod_distrito`, texto de nove dígitos;
- subdistrito: `cod_subdistrito`, texto de onze dígitos;
- CEP5: **PK composta `(cod_municipal, cep5)`**, com CEP5 textual de cinco dígitos.

UF, região intermediária e região imediata estão em `dim_municipio`; não são tabelas físicas separadas. CEP5 é associação operacional própria, não distrito/subdistrito.

A fonte CEP5 contém 24.896 prefixos distintos, nove compartilhados entre municípios, três aliases tratados e 5.570 municípios cobertos. Existem **4.495 CEP5 distintos iniciados por zero**; a descrição antiga de 248 estava incorreta. Os zeros já estavam preservados nos dados. O município `5101837` continua válido na DTB, sem CEP5 nessa fonte.

## Homologação do conteúdo

As cargas `geografia_dtb_2025` e `geografia_cep5` estão concluídas nos dois ambientes. A releitura dos originais coincidiu com os CSVs normalizados e com os hashes calculados nos dois bancos.

Protocolo de auditoria: `sha256-json-array-lines-v1`. Ordem de colunas e hashes completos no snapshot JSON. Consulta reprodutível em `database/validation/geografia_snapshot_readonly.sql`.

Os MD5 históricos registrados nas cargas anteriores foram preservados. Não comparar algoritmos ou serializações diferentes. `carga_id` e `atualizado_em` não fazem parte do checksum territorial e devem ser auditados separadamente.

**Paridade comprovada: conteúdo geográfico.** Não declarar igualdade integral de bancos ou de toda a auditoria. Há um run CEP5 no PRIMARY e nenhum na REPLICA; os eventos individuais DTB não constam de `audit_replication_runs`. Uma eventual complementação precisa ser identificada como reconciliação posterior, sem fabricar eventos históricos.

## O que a homologação não significa

As cópias e comparações foram operações pontuais. Ainda não há pipeline permanente V2 homologado de ingestão, validação municipal/CEP5, staging, revisão humana, replicação ou reconciliação.

Não há implementação de Edge Functions V2 na árvore Git auditada. A REPLICA retornou zero funções implantadas. O catálogo administrativo completo do PRIMARY gerenciado não foi verificado independentemente.

Os helpers `tmp_*` de aplicação foram removidos do escopo consultado. Não existe subscription PostgreSQL nem `cron.job` nos dois bancos inspecionados. Isso não substitui uma investigação de eventuais agendadores externos.

## Segurança e isolamento

RLS ativo nas sete tabelas; nenhum privilégio efetivo de tabela para `anon`/`authenticated` no snapshot. O acesso futuro exige contrato de exposição e autorização, sem desativar RLS como atalho.

Schemas de plataforma, usuários Auth e demais metadados foram preservados. A extensão HTTP permanece no PRIMARY; sua necessidade deve ser revista em escopo próprio, não removida automaticamente por uma tarefa documental.

Fluxo autorizado: **PRIMARY Paper → REPLICA Paper**. Nenhum outro projeto é fonte, transporte ou fallback sem pedido explícito. A REPLICA não equivale a um backup versionado com restauração testada.

## Evolução

Fonte e necessidade → auditoria → contrato → DDL no GitHub → commit → aplicação controlada → QA → replicação quando implementada/aplicável → contagem e checksum → documentação.

O próximo trabalho deve preservar as cargas existentes, distinguir infraestrutura de automação e implementar somente o escopo aprovado pelo usuário.
