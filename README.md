# Paper Comercial V2 — Fundação Limpa e Ponto de Retomada

> **Documento principal de continuidade da reconstrução V2**  
> Última consolidação: **2026-09-15**.
>
> Antes de qualquer alteração, leia também `AGENTS.md`, `docs/architecture/README.md` e `docs/governance/change-workflow.md`.

## 1. Estado executivo

O Paper Comercial V2 está em **clean slate funcional**.

Isso significa que a engenharia-base está pronta, mas **nenhuma regra de negócio antiga é considerada vigente** na branch `main`.

Hoje o projeto possui:

- governança GitHub-first;
- Lovable Cloud como runtime e banco operacional PRIMARY;
- Supabase externo `vevmnoxbjdkibdwfygfn` como REPLICA confirmada;
- banco de negócio antigo removido de PRIMARY e REPLICA;
- fundação técnica V2 instalada nos dois bancos;
- frontend neutralizado;
- regras comerciais, fórmulas, heurísticas e fluxos antigos removidos da branch atual;
- planos históricos do Lovable removidos da branch atual;
- migrations antigas de negócio removidas da branch atual;
- tipos Supabase alinhados somente ao schema técnico atual;
- Project Knowledge do Lovable verificado como vazio;
- Figma do time `CIT` registrado como workspace visual oficial;
- documentação de arquitetura, governança, replicação e QA preservada.

**Próximo passo:** receber o primeiro dataset real e reconstruir o domínio correspondente do zero, com contrato, DDL, QA, carga no PRIMARY e replicação controlada.

---

## 2. Regra máxima de continuidade

**O histórico Git não é uma especificação funcional vigente.**

Arquivos, regras, fórmulas e fluxos removidos continuam tecnicamente recuperáveis pelo histórico Git, mas isso serve apenas como evidência histórica.

Um próximo agente/chat **não deve**:

- restaurar regra antiga por iniciativa própria;
- copiar fórmulas antigas porque “já existiam”;
- presumir que antigas chaves continuam corretas;
- reativar migrations antigas;
- reintroduzir páginas e fluxos antigos sem nova definição explícita;
- interpretar o código histórico como requisito atual.

Toda nova regra válida deve nascer novamente por decisão explícita e ser versionada.

Fluxo obrigatório:

```text
necessidade / fonte
 -> auditoria
 -> definição de grão
 -> definição de chave(s)
 -> contrato de dados
 -> DDL / implementação no GitHub
 -> commit
 -> testes / QA
 -> aplicação no PRIMARY
 -> replicação para REPLICA quando aplicável
 -> contagem + checksum
 -> documentação final
```

---

## 3. Fontes da verdade

| Camada | Papel oficial |
|---|---|
| GitHub `Kaue-EDBS/papercomercialv2` | fonte oficial de código, DDL, contratos, decisões, testes, documentação e histórico |
| Lovable `Paper Comercial OFICIAL` | runtime e banco operacional **PRIMARY** |
| Supabase `vevmnoxbjdkibdwfygfn` | **REPLICA externa** confirmada |
| Figma — time `CIT` | referência visual e UX/UI |
| ChatGPT | orquestração, implementação assistida, auditoria e QA |

Fluxo de dados autorizado:

```text
GitHub  --->  Lovable runtime / PRIMARY
                  |
                  | replicação 1-way
                  v
             Supabase REPLICA
```

Nunca existe reparo automático REPLICA -> PRIMARY.

---

## 4. Ambientes identificados

### GitHub

- Repositório: `Kaue-EDBS/papercomercialv2`
- Branch operacional: `main`

### Lovable / PRIMARY

- Projeto: `Paper Comercial OFICIAL`
- Project ID: `8380d53b-a14d-4993-9447-d7c404347336`
- Papel: runtime + banco operacional PRIMARY

### Supabase / REPLICA

- Project ref: `vevmnoxbjdkibdwfygfn`
- Região: `sa-east-1`
- Papel: REPLICA externa independente

### Figma

- Time: `CIT`
- Team ID: `1681665672034047133`
- Workspace fornecido: `https://www.figma.com/files/team/1681665672034047133/all-folders?fuid=1681302531915878482`
- `SIGMA` é apenas o nome antigo/incorreto usado anteriormente no Figma.
- Nome conceitual correto: **Paper Comercial V2**.
- O link atual aponta para o workspace/time, não para um arquivo `/design/...`; portanto o `fileKey` específico ainda não está registrado.
- A conexão Figma validada possui acesso `View`; alterações no arquivo dependem de permissão de edição.

---

## 5. Os dois IDs Supabase

Existem dois identificadores diferentes e eles **não devem ser confundidos**.

### `vevmnoxbjdkibdwfygfn`

Este projeto foi validado pela conexão Supabase disponível.

Papel definido na V2:

```text
REPLICA externa
```

### `chwsmkdkgdgocnbcyvmq`

É o ID atualmente presente em:

```text
supabase/config.toml
```

Conteúdo atual:

```toml
project_id = "chwsmkdkgdgocnbcyvmq"
```

A conexão Supabase externa usada nesta reconstrução **não possui permissão** para consultar diretamente esse projeto.

Ao mesmo tempo:

- o repositório está conectado ao Lovable;
- o runtime possui integração Supabase;
- esse ID já estava no `config.toml` gerado pelo stack existente.

A interpretação técnica mais segura é que `chwsm...` pertence ao lado técnico/gerenciado do Lovable PRIMARY.

**Isso é uma inferência técnica forte, não uma confirmação administrativa do painel Supabase.**

Portanto:

- não trocar `supabase/config.toml` para `vevm...`;
- não tratar `chwsm...` como REPLICA;
- manter `vevm...` como REPLICA externa confirmada;
- só alterar essa topologia se houver evidência administrativa explícita.

---

## 6. Reset do banco realizado

Antes da reconstrução V2, PRIMARY e REPLICA possuíam objetos de negócio antigos em `public`.

Foram removidos da camada de negócio:

- `densidade_demografica_cep5`;
- `dim_escola`;
- `dim_municipio`;
- `escola_protheus`;
- `v_escola_por_protheus`;
- sequence associada à antiga densidade demográfica.

No momento do reset, as quatro tabelas auditadas estavam com **0 linhas**.

Schemas gerenciados pela plataforma foram preservados, incluindo componentes como:

- `auth`;
- `storage`;
- `realtime`;
- extensões;
- metadados internos da plataforma.

Isso é intencional: o reset foi da **camada de negócio**, não da infraestrutura Supabase/Lovable.

SQL oficial:

- `database/v2/0000_reset_legacy.sql`

---

## 7. Fundação técnica V2

Após o reset, PRIMARY e REPLICA receberam a mesma fundação técnica:

```text
etl_cargas
audit_data_quality
audit_replication_runs
```

### `etl_cargas`

Rastreia cada carga de dados:

- dataset;
- fonte;
- arquivo;
- hash;
- ano/competência;
- status;
- linhas recebidas;
- linhas válidas;
- linhas rejeitadas;
- linhas gravadas;
- timestamps;
- observações.

### `audit_data_quality`

Registra checks de qualidade e seus resultados.

### `audit_replication_runs`

Registra execuções de replicação PRIMARY -> REPLICA, incluindo contagem, checksum, status e erro.

DDL oficial:

- `database/v2/0001_foundation.sql`

As três tabelas estão com RLS habilitado e sem grants diretos de conveniência para `anon`/`authenticated`.

---

## 8. Clean slate das regras de negócio

Depois do reset do banco, foi feita uma segunda limpeza: **remoção das regras funcionais da branch atual**.

PR utilizado:

- PR `#1` — `Reset completo das regras de negócio para a fundação V2`

Merge final:

```text
f026c78f1f98d2142271118cf6adc339e1bfa867
```

A mudança atingiu **77 arquivos**, com aproximadamente **13,5 mil linhas removidas**.

### Removido do `main`

- `.lovable/plan/` com planos históricos de carga e reconstrução;
- migrations antigas em `supabase/migrations/`;
- páginas específicas do produto anterior;
- componentes de concorrência;
- rotas de apresentação e busca antigas;
- hooks de carteira;
- hooks de consultores;
- hooks de potencial;
- hooks de renda;
- hooks de setorização;
- módulos de análise;
- regras de mensalidade;
- regras socioeconômicas;
- exportações antigas;
- tipos de domínio antigos;
- fluxos de market share;
- fluxos de concorrência;
- fluxos de plano de ação;
- fluxos de carteira;
- demais comportamentos comerciais legados codificados.

### Preservado no `main`

- bootstrap React/Vite;
- componentes UI genéricos;
- estilos e design tokens;
- integração Supabase necessária ao runtime;
- `supabase/config.toml`;
- fundação técnica V2;
- templates de contratos;
- arquitetura;
- governança;
- documentação de replicação;
- documentação de QA.

### Histórico Git

Os arquivos removidos continuam existindo no histórico Git por rastreabilidade, porém são **não vigentes**.

---

## 9. Frontend atual

O frontend atual foi deliberadamente neutralizado.

Ele não oferece:

- recomendação comercial;
- fórmula;
- market share;
- concorrência;
- mensalidade;
- perfil socioeconômico;
- carteira;
- potencial;
- Melhor Oferta;
- Zero Estoque;
- fluxo decisório.

A tela atual serve apenas para indicar que a fundação V2 está ativa e que o sistema aguarda reconstrução controlada.

---

## 10. Lovable Project Knowledge

O `Project Knowledge` do projeto Lovable foi consultado em 15/09/2026.

Resultado:

```text
vazio
```

Portanto, não foi encontrada uma segunda camada oculta de regras funcionais persistidas no Knowledge do projeto.

---

## 11. Segurança e pendências conhecidas

### `.env` versionado

Existe um arquivo `.env` rastreado pelo repositório.

Durante esta etapa ele **não foi aberto nem alterado**, para evitar exposição desnecessária de possíveis credenciais.

Antes de uma revisão de segurança definitiva, deve ser tratado como dívida técnica específica:

- verificar se contém segredo;
- rotacionar credenciais se necessário;
- remover segredo do estado vigente;
- revisar histórico se houver exposição relevante.

Não presumir que o `.env` é seguro apenas porque está versionado.

### Build/CI

A limpeza estrutural foi validada por inspeção de árvore, diff e estado pós-merge.

O repositório não apresentou status checks/CI configurados para o merge, e a execução local de build/testes não ficou comprovada nesta etapa.

Portanto, um próximo ciclo técnico deve executar build/testes antes de considerar alterações de frontend concluídas.

---

## 12. Replicação

A direção está definida:

```text
Lovable Cloud PRIMARY  --->  Supabase REPLICA
```

Porém o pipeline genérico do Paper Comercial ainda **não foi implementado**.

Quando o primeiro dataset for aprovado, a replicação deve herdar a engenharia validada no PEM:

- registry/allowlist explícita;
- tabelas autorizadas apenas;
- leitura paginada;
- operações idempotentes;
- lotes controlados;
- checksum determinístico;
- contagem PRIMARY x REPLICA;
- auditoria em `audit_replication_runs`;
- reconciliação;
- reparo somente PRIMARY -> REPLICA.

Documentação:

- `docs/replication/lovable-to-supabase.md`

---

## 13. Protocolo para o PRIMEIRO dataset

Ao receber os primeiros dados reais, **não criar tabela imediatamente**.

Executar nesta ordem:

### Etapa A — auditoria da fonte

1. identificar arquivo(s) e formato;
2. identificar fonte oficial;
3. identificar período/competência;
4. medir linhas e colunas;
5. verificar duplicidades;
6. verificar nulos;
7. verificar tipos;
8. identificar possíveis chaves;
9. identificar inconsistências e aliases;
10. registrar limitações metodológicas.

### Etapa B — contrato

Definir explicitamente:

- nome lógico do dataset;
- grão de uma linha;
- PK;
- chaves de relacionamento;
- tipos;
- regras de nulidade;
- normalizações;
- deduplicação;
- regras de qualidade;
- critérios de rejeição;
- segurança/RLS;
- estratégia de replicação;
- colunas utilizadas no checksum.

Usar:

- `docs/data-contracts/_template.md`

### Etapa C — engenharia

1. criar `database/v2/0002_*.sql` somente depois do contrato;
2. versionar no GitHub;
3. commit;
4. executar testes estruturais;
5. aplicar no PRIMARY;
6. carregar staging quando necessário;
7. executar QA;
8. promover somente dados aprovados;
9. aplicar estrutura correspondente na REPLICA;
10. replicar;
11. comparar contagem + checksum;
12. documentar evidência E2E.

### Gate de promoção

Nenhum dataset deve ser considerado concluído se houver:

- PK duplicada não explicada;
- falha crítica de integridade;
- chave ambígua não tratada;
- divergência PRIMARY x REPLICA;
- checksum diferente;
- linha rejeitada sem tratamento quando a regra exigir 100% de resolução.

---

## 14. O que NÃO está decidido

Neste momento **não existe decisão vigente** sobre:

- chave canônica de escola;
- chave canônica de cliente;
- relação entre INEP e Protheus;
- geografia;
- ordem de reconstrução dos domínios;
- regra de concorrência;
- raio comercial;
- market share;
- faixa de mensalidade;
- perfil socioeconômico;
- potencial de consumo;
- Melhor Oferta;
- Zero Estoque;
- regras de proposta;
- regras de prospecção/renovação;
- fórmulas e pesos comerciais.

Tudo isso deverá ser reconstruído e aprovado explicitamente.

---

## 15. Diretórios oficiais

```text
AGENTS.md
README.md

database/v2/
  0000_reset_legacy.sql
  0001_foundation.sql
  README.md

docs/architecture/
docs/governance/
docs/data-contracts/
docs/replication/
docs/testing/

src/
  infraestrutura React/Vite
  UI genérica
  integração Supabase

supabase/config.toml
```

As antigas migrations de negócio não fazem mais parte da branch atual.

---

## 16. Não descalibrar

- Não reutilizar regras legadas automaticamente.
- Não restaurar `.lovable/plan/` como especificação.
- Não restaurar `supabase/migrations/` antigas como V2.
- Não assumir chaves sem contrato.
- Não criar tabela diretamente no runtime antes de GitHub + commit.
- Não usar mensagem/prompt no Lovable como mecanismo de implementação permanente.
- Não transformar a REPLICA em origem de escrita.
- Não trocar `config.toml` para `vevm...` sem nova evidência.
- Não expor `service_role` ou secrets.
- Não liberar dataset sem QA objetivo.
- Não declarar paridade sem contagem + checksum.
- Não tratar `SIGMA` como outro projeto.
- Não depender da memória de um chat para decisão estrutural.

---

## 17. Ponto exato de retomada

**Fundação e clean slate concluídos.**

O projeto está pronto para receber os primeiros dados.

O próximo chat deve começar assim:

```text
1. Ler README.md + AGENTS.md.
2. Não recuperar nenhuma regra antiga.
3. Receber o primeiro arquivo/dataset.
4. Auditar a fonte antes de modelar.
5. Criar o primeiro contrato V2.
6. Só depois criar database/v2/0002_*.sql.
7. Carregar no PRIMARY com QA.
8. Implementar/usar replicação controlada.
9. Confirmar PRIMARY x REPLICA por contagem + checksum.
10. Atualizar este README com o novo domínio fechado.
```

## 18. Evidências e documentação complementar

- [`AGENTS.md`](AGENTS.md)
- [`docs/architecture/README.md`](docs/architecture/README.md)
- [`docs/governance/sources-of-truth.md`](docs/governance/sources-of-truth.md)
- [`docs/governance/change-workflow.md`](docs/governance/change-workflow.md)
- [`docs/data-contracts/_template.md`](docs/data-contracts/_template.md)
- [`docs/replication/lovable-to-supabase.md`](docs/replication/lovable-to-supabase.md)
- [`docs/testing/foundation-v2-2026-09-15.md`](docs/testing/foundation-v2-2026-09-15.md)
- [`docs/testing/business-rules-reset-2026-09-15.md`](docs/testing/business-rules-reset-2026-09-15.md)
