# Paper Comercial V2 — Engenharia e Continuidade

> **Documento principal de handoff da reconstrução V2**
>
> Última consolidação: **2026-09-15**.
>
> Antes de alterar banco, arquitetura ou regras estruturais, leia este README, `AGENTS.md` e `docs/architecture/README.md`.

O Paper Comercial é a aplicação comercial da Editora do Brasil para apoiar diagnóstico de escolas, concorrência, prospecção, renovação, oferta e decisão comercial. A reconstrução V2 aplica ao projeto a mesma disciplina de engenharia consolidada no PEM: GitHub-first, PRIMARY + REPLICA, contratos antes da carga, auditoria e paridade objetiva.

## 1. Estado atual em uma página

Em **15/09/2026**, a fundação V2 foi aplicada e validada em PRIMARY e REPLICA.

Concluído:

- governança GitHub-first;
- Lovable Cloud definido como **PRIMARY**;
- Supabase `vevmnoxbjdkibdwfygfn` definido como **REPLICA**;
- inventário da camada legada;
- reset controlado dos objetos de negócio antigos em `public`;
- preservação de schemas gerenciados pela plataforma;
- criação de `etl_cargas`;
- criação de `audit_data_quality`;
- criação de `audit_replication_runs`;
- RLS habilitado nas três tabelas técnicas;
- ausência de grants diretos para `anon/authenticated`;
- validação estrutural em PRIMARY e REPLICA;
- advisors da REPLICA revisados;
- contrato-template e documentação de replicação criados.

Estado atual de `public` nos dois bancos:

```text
etl_cargas                0 linhas
audit_data_quality        0 linhas
audit_replication_runs    0 linhas
```

**Não existem mais tabelas de negócio legadas em `public`.**

Evidência completa: [`docs/testing/foundation-v2-2026-09-15.md`](docs/testing/foundation-v2-2026-09-15.md).

## 2. Regra máxima

Toda alteração permanente de código, schema, regra, documentação, interface ou configuração versionável deve ser feita **via GitHub + commit**.

Não usar mensagens/prompts enviados ao ambiente do Lovable como mecanismo de implementação. O Lovable é runtime/preview e hospeda o banco operacional PRIMARY; a branch conectada é o caminho oficial de sincronização do código.

## 3. Fontes da verdade

| Camada | Papel |
|---|---|
| GitHub | fonte oficial de código, DDL, contratos, regras, testes, documentação e histórico |
| Lovable Cloud | runtime e banco operacional **PRIMARY** |
| Supabase `vevmnoxbjdkibdwfygfn` | **REPLICA** externa independente |
| Figma | referência UX/UI quando aplicável |
| ChatGPT | orquestração, implementação assistida, QA e auditoria |

Direção de dados:

```text
Lovable Cloud PRIMARY  --->  Supabase REPLICA
```

Nunca existe reparo automático REPLICA -> PRIMARY.

## 4. Ambientes identificados

- Repositório: `Kaue-EDBS/papercomercialv2`.
- Lovable PRIMARY: projeto `Paper Comercial OFICIAL`, ID `8380d53b-a14d-4993-9447-d7c404347336`.
- Supabase REPLICA: projeto `vevmnoxbjdkibdwfygfn`, região `sa-east-1`.
- O `supabase/config.toml` legado aponta para `chwsmkdkgdgocnbcyvmq`; esse identificador pertence ao stack histórico e **não deve ser tratado como a REPLICA externa da V2** sem decisão explícita.

## 5. Estado encontrado antes do reset V2

Em 15/09/2026, PRIMARY e REPLICA apresentavam a mesma camada de negócio em `public`:

| objeto | tipo | linhas |
|---|---|---:|
| `densidade_demografica_cep5` | tabela | 0 |
| `dim_escola` | tabela | 0 |
| `dim_municipio` | tabela | 0 |
| `escola_protheus` | tabela | 0 |
| `v_escola_por_protheus` | view | — |
| `densidade_demografica_cep5_id_seq` | sequence | — |

Não havia rotinas `public` nem policies de RLS específicas nesses objetos no PRIMARY.

O reset removeu somente essa camada de negócio e preservou schemas gerenciados pela plataforma (`auth`, `storage`, `realtime`, extensões e equivalentes). Isso é intencional e replica o padrão de reset adotado no PEM.

SQL oficial do reset: `database/v2/0000_reset_legacy.sql`.

## 6. Fundação V2

A fundação técnica inicial é deliberadamente pequena e não recria datasets de negócio:

- `etl_cargas` — rastreia cada carga, origem, arquivo, status, volumes e timestamps;
- `audit_data_quality` — registra checks de qualidade por dataset/carga;
- `audit_replication_runs` — registra contagem, checksum e status de sincronizações PRIMARY x REPLICA.

DDL oficial: `database/v2/0001_foundation.sql`.

As três tabelas usam RLS e não concedem acesso direto a `anon` ou `authenticated`.

Na REPLICA, os advisors atuais retornam somente avisos informativos esperados:

- `rls_enabled_no_policy` — intencional, pois as tabelas são internas e não possuem policies públicas;
- `unused_index` — esperado, porque as tabelas acabaram de ser criadas e estão vazias.

## 7. O que NÃO deve ser recriado automaticamente

A existência de tabelas ou migrations antigas não autoriza recriá-las na V2. Antes de voltar qualquer domínio, é obrigatório criar contrato e DDL novo.

Isso vale especialmente para:

- identidade escolar (`dim_escola`);
- geografia (`dim_municipio`);
- relacionamento operacional (`escola_protheus`, `COD_PROTHEUS`, `CD_ESCOLA`);
- Censo Escolar;
- demografia/CEP;
- adoção histórica;
- Melhor Oferta;
- Zero Estoque;
- concorrência e área de influência;
- agregações do frontend.

## 8. Chaves candidatas — não congelar sem contrato

Diretrizes já conhecidas do domínio, mas que precisam ser formalizadas na V2 antes de virar schema:

- `COD_INEP`: candidato principal para identidade física da escola;
- `COD_PROTHEUS` / `CD_ESCOLA`: chaves operacionais/comerciais, não identidade física por padrão;
- chaves geográficas devem usar códigos oficiais estáveis;
- nomes de escola ou município nunca devem ser a única chave de relacionamento.

## 9. Regras comerciais legadas

A especificação funcional extensa que ocupava este README antes da reconstrução **não foi descartada**. Ela permanece integralmente no histórico Git; o commit `618c90214c2f78a517c832d8d593d5fdce1f9da5` ainda contém o README funcional anterior.

Esse material é referência para reconstruir o produto, mas **não é migration, contrato de dados nem autorização para recriar tabelas antigas**.

Entre os domínios históricos existentes no produto estão: prospecção/renovação, concorrência, market share, mensalidade, perfil socioeconômico, Melhor Oferta, Proposta Comercial e Zero Estoque. Cada regra será promovida para documentação V2 conforme o domínio for reconstruído.

## 10. Ordem recomendada da reconstrução

```text
1. Fundação + governança                     ✅
2. Identidade geográfica e escolar canônica  <- PRÓXIMO
3. Cadastro operacional/comercial de escolas
4. Censo Escolar
5. Demografia / CEP
6. Adoção histórica
7. Melhor Oferta
8. Zero Estoque
9. Concorrência / área de influência
10. Agregações e frontend
```

Não iniciar o próximo domínio sem fechar QA do anterior.

## 11. Fluxo obrigatório para cada dataset

```text
fonte
 -> auditoria do arquivo
 -> contrato de dados
 -> DDL no GitHub
 -> validações
 -> carga no PRIMARY
 -> QA
 -> replicação para REPLICA
 -> contagem + checksum
 -> auditoria de paridade
 -> liberação para consumo
```

## 12. Replicação

O desenho de replicação está documentado em [`docs/replication/lovable-to-supabase.md`](docs/replication/lovable-to-supabase.md).

A fundação de auditoria já existe, mas o pipeline genérico de replicação ainda será implementado quando o primeiro dataset de negócio estiver formalizado. Ele deve herdar o padrão validado no PEM: registry/allowlist, leitura paginada, receiver server-side, upsert por lotes, checksum canônico, auditoria e reconciliação PRIMARY -> REPLICA.

## 13. Diretórios oficiais

- `AGENTS.md` — regras obrigatórias para agentes/automações;
- `database/v2/` — DDL oficial da V2;
- `docs/architecture/` — arquitetura;
- `docs/governance/` — fontes da verdade e workflow;
- `docs/data-contracts/` — contratos por domínio/dataset;
- `docs/replication/` — arquitetura e operação da réplica;
- `docs/testing/` — evidências de QA/E2E;
- `supabase/migrations/` — **histórico legado**, não fonte da V2.

## 14. Sobre a “limpeza total”

A limpeza realizada é **total da camada de negócio da aplicação**, tanto no PRIMARY quanto na REPLICA.

Não foram apagados schemas internos/gerenciados da plataforma (`auth`, `storage`, `realtime`, metadados de migrations, extensões etc.), porque eles não são dados de negócio e sua remoção quebraria a infraestrutura Supabase/Lovable. O histórico anterior de migrations da REPLICA permanece como metadado da plataforma, mas os objetos de negócio que ele criou foram efetivamente removidos de `public`.

## 15. Não descalibrar

- Não reconstruir o banco a partir de migrations legadas.
- Não criar tabela diretamente no runtime sem commit prévio.
- Não transformar Supabase REPLICA em backend autoritativo.
- Não usar mensagens do Lovable para implementar código permanente.
- Não expor `service_role`/segredos no frontend ou GitHub.
- Não liberar dataset sem QA objetivo.
- Não declarar paridade sem contagem + checksum quando houver dados.
- Não assumir que uma chave antiga continua sendo a chave correta sem novo contrato.
- Não apagar schemas gerenciados pela plataforma como parte de resets de negócio.

## 16. Ponto de retomada

A fundação V2 está **concluída e validada**. O próximo trabalho é definir e reconstruir o primeiro domínio canônico: **identidade geográfica e escolar**.

Antes de criar a próxima migration (`0002`), auditar as fontes que alimentarão a identidade escolar/geográfica e fechar:

- grão;
- PK canônica;
- chaves de relacionamento;
- tratamento de duplicidades;
- relação `COD_INEP` x `COD_PROTHEUS`/`CD_ESCOLA`;
- geografia oficial;
- critérios de QA;
- escopo de replicação.

Documentação complementar:

- [`AGENTS.md`](AGENTS.md)
- [`docs/architecture/README.md`](docs/architecture/README.md)
- [`docs/governance/sources-of-truth.md`](docs/governance/sources-of-truth.md)
- [`docs/governance/change-workflow.md`](docs/governance/change-workflow.md)
- [`docs/data-contracts/_template.md`](docs/data-contracts/_template.md)
- [`docs/replication/lovable-to-supabase.md`](docs/replication/lovable-to-supabase.md)
- [`docs/testing/foundation-v2-2026-09-15.md`](docs/testing/foundation-v2-2026-09-15.md)
- [`database/v2/README.md`](database/v2/README.md)
