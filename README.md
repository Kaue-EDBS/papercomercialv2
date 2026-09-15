# Paper Comercial V2 — Fundação Limpa

> Documento principal de continuidade. Última consolidação: **2026-09-15**.

## Estado atual

O projeto está em **clean slate funcional**. A fundação técnica V2 está instalada, mas **nenhuma regra de negócio está ativa** na branch atual.

Concluído:

- GitHub-first e governança V2;
- limpeza da camada de negócio do PRIMARY e da REPLICA;
- `etl_cargas`, `audit_data_quality` e `audit_replication_runs` nos dois bancos;
- RLS nas tabelas técnicas e sem acesso direto de `anon/authenticated`;
- remoção da branch atual de páginas, hooks, cálculos, exports, planos Lovable e migrations legadas que materializavam regras anteriores;
- frontend substituído por uma tela neutra de fundação;
- tipos Supabase reduzidos ao schema técnico atual;
- Project Knowledge do Lovable verificado: **vazio**;
- Figma do time `CIT` registrado como workspace visual oficial; `SIGMA` é somente nome antigo/incorreto.

## Regra principal

**O histórico Git não é uma especificação funcional vigente.** Regras removidas continuam recuperáveis tecnicamente pelo histórico, mas não devem ser reutilizadas, copiadas ou inferidas por um agente futuro sem pedido explícito do usuário.

Qualquer regra de negócio nova deve passar por:

```text
necessidade/fonte
 -> definição explícita
 -> contrato/documentação
 -> implementação GitHub + commit
 -> testes/QA
 -> aplicação no PRIMARY
 -> replicação quando aplicável
 -> contagem + checksum
```

## Topologia

| camada | papel |
|---|---|
| GitHub `Kaue-EDBS/papercomercialv2` | fonte oficial de código, DDL, contratos, decisões e histórico |
| Lovable `Paper Comercial OFICIAL` | runtime + banco operacional PRIMARY |
| Supabase `vevmnoxbjdkibdwfygfn` | REPLICA externa confirmada |
| Figma time `CIT` | referência visual |
| ChatGPT | orquestração, implementação assistida, auditoria e QA |

Fluxo autorizado de dados: **PRIMARY -> REPLICA**. Nunca REPLICA -> PRIMARY automaticamente.

## Sobre os dois IDs Supabase

### `vevmnoxbjdkibdwfygfn`

Confirmado pela conexão Supabase disponível como projeto externo saudável, região `sa-east-1`. Papel V2: **REPLICA**.

### `chwsmkdkgdgocnbcyvmq`

É o `project_id` existente em `supabase/config.toml`. A conexão Supabase externa atual não possui permissão para consultar esse projeto, enquanto o Lovable PRIMARY usa integração Supabase e o arquivo foi gerado no repositório conectado. A evidência é **fortemente consistente** com esse ID sendo o backend técnico gerenciado/associado ao Lovable PRIMARY.

Isso ainda não é confirmação administrativa do projeto no painel Supabase. Por segurança:

- **não alterar `supabase/config.toml` para o ID da REPLICA**;
- tratar `chwsm...` como identificador técnico do lado PRIMARY/Lovable até prova em contrário;
- tratar `vevm...` como REPLICA externa confirmada.

## Banco atual

Em PRIMARY e REPLICA, a camada `public` de negócio foi limpa. Permanecem na fundação:

```text
etl_cargas
audit_data_quality
audit_replication_runs
```

Schemas gerenciados pela plataforma foram preservados.

DDL oficial:

- `database/v2/0000_reset_legacy.sql`
- `database/v2/0001_foundation.sql`

## Código atual

A branch atual preserva somente infraestrutura necessária à reconstrução: bootstrap React/Vite, componentes UI genéricos, integração Supabase do runtime, estilos e fundação de dados. Código que continha comportamento comercial foi removido.

Os arquivos antigos em `.lovable/plan/` e `supabase/migrations/` também foram removidos da branch atual. O histórico Git continua existindo, mas é **não vigente**.

## Figma

Workspace oficial: time `CIT` (`1681665672034047133`). O link fornecido aponta para o time, não para um arquivo `/design/...`, portanto o `fileKey` ainda não está registrado. A autenticação atual possui acesso `View`; edição depende de permissão apropriada.

`SIGMA` = nome antigo/incorreto. Nome conceitual do projeto: **Paper Comercial V2**.

## O que um próximo chat NÃO deve fazer

- não recuperar regras antigas do Git;
- não presumir chaves de escola, município, cliente ou produto;
- não presumir ordem de reconstrução dos domínios;
- não recriar migrations removidas;
- não usar mensagens no Lovable para implementar mudanças permanentes;
- não apontar `supabase/config.toml` para a REPLICA;
- não criar dataset de negócio sem contrato e QA;
- não declarar paridade sem contagem + checksum.

## Ponto de retomada

A próxima etapa não está pré-definida por regra legada. O usuário escolhe o primeiro domínio/dataset a reconstruir. Ao receber a fonte, começar por auditoria, grão, chave, contrato e critérios de qualidade antes de escrever DDL ou lógica comercial.

Documentação:

- [`AGENTS.md`](AGENTS.md)
- [`docs/architecture/README.md`](docs/architecture/README.md)
- [`docs/governance/sources-of-truth.md`](docs/governance/sources-of-truth.md)
- [`docs/governance/change-workflow.md`](docs/governance/change-workflow.md)
- [`docs/data-contracts/_template.md`](docs/data-contracts/_template.md)
- [`docs/replication/lovable-to-supabase.md`](docs/replication/lovable-to-supabase.md)
- [`docs/testing/foundation-v2-2026-09-15.md`](docs/testing/foundation-v2-2026-09-15.md)
- [`docs/testing/business-rules-reset-2026-09-15.md`](docs/testing/business-rules-reset-2026-09-15.md)
