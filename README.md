# Paper Comercial V2 — Engenharia e Continuidade

> **Documento principal de handoff da reconstrução V2**
>
> Última consolidação: **2026-09-15**.
>
> Antes de alterar banco, arquitetura ou regras estruturais, leia este README, `AGENTS.md` e `docs/architecture/README.md`.

O Paper Comercial é a aplicação comercial da Editora do Brasil para apoiar diagnóstico de escolas, concorrência, prospecção, renovação, oferta e decisão comercial. A reconstrução V2 aplica ao projeto a mesma disciplina de engenharia consolidada no PEM: GitHub-first, PRIMARY + REPLICA, contratos antes da carga, auditoria e paridade objetiva.

## 1. Regra máxima

Toda alteração permanente de código, schema, regra, documentação, interface ou configuração versionável deve ser feita **via GitHub + commit**.

Não usar mensagens/prompts enviados ao ambiente do Lovable como mecanismo de implementação. O Lovable é runtime/preview e hospeda o banco operacional PRIMARY; a branch conectada é o caminho oficial de sincronização do código.

## 2. Fontes da verdade

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

## 3. Ambientes identificados

- Repositório: `Kaue-EDBS/papercomercialv2`.
- Lovable PRIMARY: projeto `Paper Comercial OFICIAL`, ID `8380d53b-a14d-4993-9447-d7c404347336`.
- Supabase REPLICA: projeto `vevmnoxbjdkibdwfygfn`, região `sa-east-1`.
- O `supabase/config.toml` legado aponta para `chwsmkdkgdgocnbcyvmq`; esse identificador pertence ao stack histórico e **não deve ser tratado como a REPLICA externa da V2** sem decisão explícita.

## 4. Estado encontrado antes do reset V2

Em 15/09/2026, PRIMARY e REPLICA apresentavam a mesma camada de negócio em `public`:

| objeto | tipo | linhas |
|---|---|---:|
| `densidade_demografica_cep5` | tabela | 0 |
| `dim_escola` | tabela | 0 |
| `dim_municipio` | tabela | 0 |
| `escola_protheus` | tabela | 0 |
| `v_escola_por_protheus` | view | — |
| `densidade_demografica_cep5_id_seq` | sequence | — |

Não havia rotinas `public` nem policies de RLS específicas nesses objetos no PRIMARY. O reset V2 foi desenhado para remover apenas essa camada de negócio, preservando schemas gerenciados pela plataforma (`auth`, `storage`, `realtime`, extensões etc.).

SQL oficial do reset: `database/v2/0000_reset_legacy.sql`.

## 5. Fundação V2

A fundação técnica inicial é deliberadamente pequena e não recria datasets de negócio:

- `etl_cargas` — rastreia cada carga, origem, arquivo, status, volumes e timestamps;
- `audit_data_quality` — registra checks de qualidade por dataset/carga;
- `audit_replication_runs` — registra contagem, checksum e status de sincronizações PRIMARY x REPLICA.

DDL oficial: `database/v2/0001_foundation.sql`.

As três tabelas usam RLS e não concedem acesso direto a `anon` ou `authenticated`.

## 6. O que NÃO deve ser recriado automaticamente

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

## 7. Chaves candidatas — não congelar sem contrato

Diretrizes já conhecidas do domínio, mas que precisam ser formalizadas na V2 antes de virar schema:

- `COD_INEP`: candidato principal para identidade física da escola;
- `COD_PROTHEUS` / `CD_ESCOLA`: chaves operacionais/comerciais, não identidade física por padrão;
- chaves geográficas devem usar códigos oficiais estáveis;
- nomes de escola ou município nunca devem ser a única chave de relacionamento.

## 8. Regras comerciais legadas

A especificação funcional extensa que ocupava este README antes da reconstrução **não foi descartada**. Ela permanece integralmente no histórico Git; o commit `618c90214c2f78a517c832d8d593d5fdce1f9da5` ainda contém o README funcional anterior.

Esse material é referência para reconstruir o produto, mas **não é migration, contrato de dados nem autorização para recriar tabelas antigas**.

Entre os domínios históricos existentes no produto estão: prospecção/renovação, concorrência, market share, mensalidade, perfil socioeconômico, Melhor Oferta, Proposta Comercial e Zero Estoque. Cada regra será promovida para documentação V2 conforme o domínio for reconstruído.

## 9. Ordem recomendada da reconstrução

```text
1. Fundação + governança
2. Identidade geográfica e escolar canônica
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

## 10. Fluxo obrigatório para cada dataset

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

## 11. Diretórios oficiais

- `AGENTS.md` — regras obrigatórias para agentes/automações;
- `database/v2/` — DDL oficial da V2;
- `docs/architecture/` — arquitetura;
- `docs/governance/` — fontes da verdade e workflow;
- `docs/data-contracts/` — contratos por domínio/dataset;
- `supabase/migrations/` — **histórico legado**, não fonte da V2.

## 12. Não descalibrar

- Não reconstruir o banco a partir de migrations legadas.
- Não criar tabela diretamente no runtime sem commit prévio.
- Não transformar Supabase REPLICA em backend autoritativo.
- Não usar mensagens do Lovable para implementar código permanente.
- Não expor `service_role`/segredos no frontend ou GitHub.
- Não liberar dataset sem QA objetivo.
- Não declarar paridade sem contagem + checksum quando houver dados.
- Não assumir que uma chave antiga continua sendo a chave correta sem novo contrato.

## 13. Ponto de retomada

Após a fundação V2 estar aplicada e validada em PRIMARY e REPLICA, o próximo trabalho é escolher o **primeiro domínio canônico** a reconstruir. A recomendação é iniciar por identidade/geografia escolar, pois ela condiciona Censo, adoção, concorrência, Melhor Oferta e Zero Estoque.

Documentação complementar:

- [`docs/architecture/README.md`](docs/architecture/README.md)
- [`docs/governance/sources-of-truth.md`](docs/governance/sources-of-truth.md)
- [`docs/governance/change-workflow.md`](docs/governance/change-workflow.md)
- [`database/v2/README.md`](database/v2/README.md)
