# CIT / Paper Comercial V2 — checkpoint oficial de continuidade

> **Checkpoint de encerramento — 16/09/2026.** Este README é a porta de entrada obrigatória para qualquer nova conversa, agente ou retomada do projeto.
>
> **Ponto exato em que o trabalho parou:** a fundação técnica, a geografia, a conexão PRIMARY → REPLICA e a reconciliação em `check` estão comprovadas. O próximo trabalho é **homologar a ingestão E2E no ambiente publicado**, usando o lote controlado descrito na seção **18. Ponto exato de retomada**.
>
> O produto comercial ainda **não foi reconstruído**. Isso é deliberado: primeiro a fundação precisa estar 100% estabelecida, testada e reproduzível.

> **Atualização de 29/09/2026 — prevalece sobre o texto abaixo onde houver conflito:**
>
> - **Acesso (F01):** login somente Microsoft, domínios EDBS, perfis `admin` (5 contas técnicas) e `viewer` (demais contas EDBS, automático). Migration `0008` aplicada no PRIMARY e verificada. Detalhes em [docs/requirements/fluxos-principais.md](docs/requirements/fluxos-principais.md).
> - **REPLICA descontinuada:** decisão do responsável em 29/09/2026 — o projeto não terá mais banco REPLICA. As seções sobre REPLICA, replicação e paridade abaixo ficam como **histórico**. A remoção da infraestrutura de replicação (workflows, scripts, roles/logins técnicos no PRIMARY, secrets do GitHub e o projeto Supabase `vevmnoxbjdkibdwfygfn`) ainda **não foi feita**.

Leituras complementares: [AGENTS.md](AGENTS.md), [arquitetura](docs/architecture/README.md), [mapa de engenharia](docs/architecture/mapa-cit-paper-v2.md), [workflow de mudanças](docs/governance/change-workflow.md), [contrato geográfico](docs/data-contracts/geografia-dtb-2025-cep5.md), [contrato do Session Pooler](docs/replication/primary-session-pooler.md) e [evidência da conexão](docs/testing/primary-connection-2026-09-16.json).

> **Atenção para documentação histórica:** alguns textos anteriores em `docs/architecture/` ainda registram o PRIMARY bloqueado ou o `check` como pendente. Esses estados foram superados em 16/09/2026. Para o estado operacional mais recente, este README e as evidências/runs citados abaixo prevalecem até a próxima consolidação documental.

---

# 1. Regra de continuidade — obrigatória

Este projeto deve continuar compreensível mesmo que a conversa, a sessão ou o agente mude.

Antes de alterar qualquer coisa:

1. ler este README inteiro;
2. ler `AGENTS.md`;
3. ler `docs/architecture/README.md` e `docs/architecture/mapa-cit-paper-v2.md`, interpretando trechos históricos à luz deste checkpoint;
4. confirmar o estado atual no GitHub e nos ambientes antes de escrever;
5. nunca inferir sucesso de uma etapa não executada.

Ao concluir qualquer processo relevante, registrar claramente:

1. **o que foi feito**;
2. **por que foi feito**;
3. **como funciona**;
4. **o que foi validado de verdade**;
5. **o que não foi validado**;
6. **estado final**;
7. **ponto exato de retomada**.

Regra central:

> **Código escrito não é deploy. Deploy não é teste. Teste não é produção homologada. Dados carregados não significam pipeline automático pronto.**

---

# 2. Objetivo atual do projeto

A linha de pensamento aprovada para a V2 é:

```text
1. estabelecer a fundação técnica
2. carregar os dados estruturantes que conectam os demais domínios
3. firmar PRIMARY → REPLICA
4. provar o ciclo operacional ponta a ponta
5. somente depois reconstruir os módulos comerciais
```

O ciclo que queremos homologar antes de avançar para regras comerciais é:

```text
fonte
  ↓
ingestão
  ↓
validação / revisão
  ↓
staging VALIDATED
  ↓
promoção controlada para tabela canônica do PRIMARY
  ↓
PRIMARY
  ↓
replicação apply
  ↓
REPLICA
  ↓
auditoria + checksum + paridade
```

Hoje **não estamos reconstruindo telas comerciais**. Estamos fechando a fundação que permitirá carregar escolas, setorização, adoções, ENEM, demografia, concorrência e demais domínios sem refazer chaves e relacionamentos depois.

---

# 3. Fronteiras e fontes da verdade

| Camada | Papel oficial |
|---|---|
| GitHub `Kaue-EDBS/papercomercialv2` | Fonte de verdade de código, DDL, migrations, contratos, testes, decisões e documentação. |
| Lovable `Paper Comercial OFICIAL` | Runtime e banco operacional **PRIMARY**. |
| Supabase `vevmnoxbjdkibdwfygfn` | **REPLICA** independente. Nunca escreve de volta no PRIMARY. |
| Figma CIT | Referência UX/UI; não define regra de negócio. |
| Arquivos homologados do Paper | Fonte dos datasets; linhagem e hash devem ser preservados. |

Fluxo autorizado:

```text
PRIMARY → REPLICA
```

Nunca usar outro projeto, banco ou aplicação como fonte, transporte, benchmark ou especificação do Paper sem autorização explícita do usuário.

---

# 4. Identificação dos ambientes

- Repositório: `Kaue-EDBS/papercomercialv2`
- Branch operacional: `main`
- Lovable oficial: `8380d53b-a14d-4993-9447-d7c404347336`
- Projeto: `Paper Comercial OFICIAL`
- URL publicada: `https://cit-edbs.lovable.app`
- Project ref da aplicação/backend: `chwsmkdkgdgocnbcyvmq`
- Supabase REPLICA: `vevmnoxbjdkibdwfygfn`
- Região REPLICA: `sa-east-1`
- Figma: time `CIT`, Team ID `1681665672034047133`; arquivo direto ainda precisa ser consolidado quando a fase visual começar.

`supabase/config.toml` deve continuar apontando para:

```text
chwsmkdkgdgocnbcyvmq
```

**Não trocar pelo project ref da REPLICA.**

No encerramento de 16/09/2026, o projeto Lovable estava publicado e o código servido estava sincronizado com a `main` antes deste commit documental. Nenhuma mudança funcional foi feita ao preparar este checkpoint.

---

# 5. Invariantes — não violar

1. **Não reaplicar `database/v2/0000_reset_legacy.sql`.**
2. **Não restaurar regras comerciais do legado automaticamente.**
3. **Não resetar ou recarregar os dados atuais para facilitar testes.**
4. **Não inventar chaves, CEPs, aliases ou relações ausentes.**
5. **Não expor senha, service role, secret ou DSN completo.**
6. **Mudança estrutural de banco nasce em `database/v2/`.**
7. **Dado de negócio novo exige contrato versionado em `docs/data-contracts/`.**
8. **RLS e menor privilégio permanecem obrigatórios.**
9. **Paridade de dataset exige contagem + checksum sob protocolo explícito.**
10. **`allow_deletions=false` é o padrão da replicação até autorização explícita.**
11. **Não fabricar auditoria histórica para igualar contagens entre PRIMARY e REPLICA.**
12. **Lovable não deve ser usado como agente para fazer alterações permanentes de código; GitHub + commit é o mecanismo oficial.**

---

# 6. Linha do tempo técnica consolidada

A sequência real da V2 até este checkpoint foi:

```text
reset controlado do legado
→ foundation
→ geografia DTB 2025
→ CEP5
→ prova de paridade por hash
→ ingestão / staging / revisão
→ roles e grants
→ infraestrutura permanente de replicação
→ CI e preflight
→ exceção Boa Esperança do Norte
→ correção do acesso externo ao PRIMARY
→ prova READ ONLY PRIMARY + REPLICA
→ reconciliação real em mode=check
→ auditoria real do check
→ preparação do teste de ingestão E2E
→ PAUSA DO PROJETO EM 16/09/2026
```

---

# 7. Migrations V2

DDL canônico atual:

```text
database/v2/0000_reset_legacy.sql
database/v2/0001_foundation.sql
database/v2/0002_geografia_dtb_2025_cep5.sql
database/v2/0003_cit_ingestion_access.sql
database/v2/0004_replication_control.sql
database/v2/0005_replication_roles.sql
database/v2/0006_replication_login_principals.sql
database/v2/0007_boa_esperanca_cep5_scope.sql
database/v2/0008_edbs_access_profiles.sql
```

Em 29/09/2026 o Lovable também criou `supabase/migrations/20260929141947_*.sql` e `20260929142006_*.sql` (login Microsoft). Elas rodam antes da `0008`, que substitui o modelo de perfis delas.

Resumo:

| Migration | Função | Estado neste checkpoint |
|---|---|---|
| `0000` | reset inicial do legado | Histórico; **não reaplicar** |
| `0001` | foundation de carga/qualidade/auditoria | Aplicada |
| `0002` | geografia DTB + CEP5 | Aplicada e homologada |
| `0003` | ingestão, staging, revisão e acesso | Aplicada; E2E publicado ainda pendente |
| `0004` | controle da replicação | Aplicada |
| `0005` | group roles da replicação | Aplicada |
| `0006` | login principals técnicos | Aplicada |
| `0007` | escopo especial de Boa Esperança do Norte | Aplicada e validada nos dois bancos |
| `0008` | acesso EDBS: perfis `admin`/`viewer`, lista técnica, provisionamento automático | Aplicada no PRIMARY em 29/09/2026 e verificada; não se aplica à REPLICA (descontinuada) — ver `docs/requirements/fluxos-principais.md`, F01 |

---

# 8. Foundation física e segurança

Tabelas da aplicação por banco: **15**.

## `public` — 7 tabelas

- `etl_cargas`
- `audit_data_quality`
- `audit_replication_runs`
- `dim_municipio`
- `dim_distrito`
- `dim_subdistrito`
- `dim_cep5`

## `cit_private` — 8 tabelas

- `access_grants`
- `ingestion_batches`
- `ingestion_rows`
- `municipality_aliases`
- `review_events`
- `replication_jobs`
- `replication_pages`
- `replication_items`

Estado de segurança já auditado:

- RLS habilitado nas 15 tabelas nos dois bancos;
- sem privilégios diretos de tabela para `anon` ou `authenticated`;
- roles técnicas sem `SUPERUSER`, `CREATEDB`, `CREATEROLE`, `REPLICATION` nativo ou `BYPASSRLS`;
- connection limit dos login principals = 2;
- PRIMARY usa login source; REPLICA usa login target.

A REPLICA possuía avisos INFO de `rls_enabled_no_policy` em tabelas internas privadas; acesso direto continua revogado. Não criar políticas permissivas apenas para silenciar INFO.

---

# 9. Dados estruturantes — geografia homologada

A geografia é o primeiro domínio estruturante porque Município/UF/CEP5 sustentará a ligação de escolas, ENEM, demografia, setorização e outros domínios futuros.

## DTB 2025

Fonte homologada: `COD_MUNICIPAL.zip`

SHA-256 do arquivo original:

```text
a5947915a7213cddde00682a51d0734ea6b6ec2307d237d1e7937edde6766b99
```

Carga:

```text
dataset: geografia_dtb_2025
carga_id: 934dafbe-0d0c-4463-8600-3faf0e623026
```

Resultados:

- 5.571 municípios;
- 10.751 distritos;
- 646 subdistritos;
- 27 UFs;
- 133 regiões intermediárias;
- 510 regiões imediatas.

`COD_MUNICIPAL` é texto de sete dígitos e é a referência territorial canônica atual.

## CEP5

Fonte homologada: `CEP5.xlsx`, aba `Resultados`.

SHA-256:

```text
74ad34907a4ee418ededa872d3530cc11ae89270ed666331a6879ea72cb8cf13
```

Carga:

```text
dataset: geografia_cep5
carga_id: 42229071-a0a3-4c0d-a8a8-14d7ead5895e
```

Resultados:

- 24.905 associações Município + CEP5;
- 24.896 CEP5 distintos;
- 5.570 municípios cobertos;
- 4.495 CEP5 iniciados por zero;
- 9 CEP5 compartilhados entre municípios.

A chave de `dim_cep5` é:

```text
(cod_municipal, cep5)
```

CEP5 sozinho **não** identifica universalmente um município.

Aliases homologados:

| UF | Fonte | Canônico | Código |
|---|---|---|---|
| RR | São Luiz | São Luiz do Anauá | `1400605` |
| RN | Arês | Arez | `2401206` |
| RN | Açu | Assú | `2400208` |

---

# 10. Boa Esperança do Norte/MT — regra exclusiva homologada

Município:

```text
5101837 — Boa Esperança do Norte/MT
```

A DTB reconhece o município, mas a fonte CEP5 homologada não possui recorte para ele.

Regra V2:

- nunca inventar, inferir ou emprestar CEP5;
- `cep5_scope('5101837')` retorna `MUNICIPIO_INTEIRO`;
- rótulo: **“Município inteiro — sem recorte CEP5 na fonte aprovada”**;
- CEP/CEP5 recebido no payload bruto é preservado para auditoria, mas não vira filtro territorial normalizado;
- ausência de CEP5 não bloqueia a linha quando o município é `5101837`;
- a exceção vale **somente** para esse município.

A migration `0007_boa_esperanca_cep5_scope.sql` foi aplicada em PRIMARY e REPLICA.

Funções verificadas nos dois ambientes:

```text
cit_private.cep5_scope(text)
MD5 da definição: 1850592d6b4bcd018bf3932ea794edf2

cit_private.resolve_row(jsonb,text,boolean)
MD5 da definição: 28f9126ca364ab2deb0fe27d79fcf0dd
```

Foram executados 12 testes comportamentais em cada banco, **24/24 aprovados**, cobrindo Boa Esperança e municípios comuns.

---

# 11. Paridade geográfica comprovada

Protocolo:

```text
sha256-json-array-lines-v1
```

Regras do protocolo:

1. campos de negócio em ordem fixa;
2. ordenação por PK;
3. cada linha representada como array JSON;
4. LF entre linhas, sem LF terminal;
5. UTF-8;
6. SHA-256;
7. `carga_id` e `atualizado_em` não entram no conteúdo comparado.

| Tabela | Linhas em cada banco | SHA-256 |
|---|---:|---|
| `dim_municipio` | 5.571 | `44b2d93b700d03b11ddb81ca1688b2d2f599e7eeffef2d6b3ab2cb2fd57d70f3` |
| `dim_distrito` | 10.751 | `5e3bfea56b4c8b82ca6f8a92f8ecd9f82ac4bfacc7c5825a8d5fdd5284dc3679` |
| `dim_subdistrito` | 646 | `2c9aeef8a0df9882883ae042decea8cf799d7b0e516292c30fc44b0ec83d981a` |
| `dim_cep5` | 24.905 | `346285b67463ee58bd2e27f30d46e59281cb9c6ef095c3d5e4389e5f7d884b56` |

Total:

```text
41.873 registros geográficos por banco
```

Isso comprova **paridade do conteúdo geográfico**, não igualdade integral de schemas gerenciados, Auth, logs ou plataforma.

---

# 12. Ingestão V2 — o que já existe

A migration `0003_cit_ingestion_access.sql` implementou o gate de ingestão.

Entrada pública controlada:

```text
cit_ingest(action, payload)
```

Papéis funcionais:

- `admin`
- `operator`
- `reviewer`
- `viewer`

Capacidades implementadas:

- autenticação por sessão real;
- grant explícito em `cit_private.access_grants`;
- CSV, TSV e JSON;
- até 8 MiB;
- até 100.000 linhas;
- chunks de até 500 linhas;
- hash do arquivo validado no servidor;
- bytes originais preservados;
- staging durável;
- replay/idempotência;
- resolução Município/UF/CEP5;
- revisão manual;
- optimistic version;
- justificativa obrigatória;
- aliases apenas com opt-in explícito;
- auditoria de revisão;
- `finalize` gera `etl_cargas` + `audit_data_quality` e sela o lote.

Conceito importante:

```text
VALIDATED = staging validada e selada
```

**`VALIDATED` não significa promoção para tabela temática/canônica.** O próprio `finalize` registra `business_promoted=false` e `linhas_gravadas=0`.

Essa separação é deliberada: primeiro provar a entrada e validação; depois definir o contrato de promoção para cada domínio.

Estado do PRIMARY observado imediatamente antes de iniciar a homologação E2E em 16/09/2026:

```text
Auth users:               28
active access_grants:      1
role ativa:            admin
ingestion_batches:         0
ingestion_rows:            0
review_events:             0
municipality_aliases:      0
```

Nenhum lote E2E foi criado antes da pausa do projeto.

---

# 13. Replicação permanente — implementação

A infraestrutura permanente foi criada pelas migrations `0004`, `0005` e `0006`.

Group roles:

```text
cit_replication_source
cit_replication_target
```

Login principals:

```text
cit_replication_source_login
cit_replication_target_login
```

Worker atual:

- direção única PRIMARY → REPLICA;
- allowlist das quatro dimensões geográficas;
- ordem município → distrito → subdistrito → CEP5;
- snapshot consistente da origem;
- lotes de 500;
- staging no destino;
- checkpoints;
- replay após interrupção;
- promoção atômica;
- auditoria;
- comparação por hash;
- gate de deleções.

Modos:

```text
check = comparar; não promove/repara dados de negócio, mas grava auditoria/controle
apply = promover/reparar REPLICA usando PRIMARY como autoridade
```

`allow_deletions=false` é o padrão.

Workflows versionados:

- `CIT verification`
- `CIT database verification`
- `CIT production connection verification`
- `CIT manual replication`

---

# 14. PRIMARY — bloqueio resolvido

O problema anterior de acesso externo do PRIMARY foi encerrado em 16/09/2026.

Endpoint efetivo homologado para o Session Pooler:

```text
host: aws-1-us-east-1.pooler.supabase.com
port: 5432
database: postgres
sslmode: verify-full
```

O login usado pelo worker é o principal técnico source associado ao project ref `chwsmkdkgdgocnbcyvmq`.

## Importante: dívida de configuração ainda existente

O secret GitHub `CIT_PRIMARY_DATABASE_URL` **não foi regravado**. O valor armazenado ainda referencia o host antigo `aws-0-us-east-1.pooler.supabase.com`.

`scripts/primary_session.py` normaliza **somente em memória**, no runner:

```text
aws-0... → aws-1-us-east-1.pooler.supabase.com:5432
```

Ele preserva as credenciais, exige `sslmode=verify-full`, não imprime senha e não modifica o secret.

Consequência:

> workflows corrigidos funcionam; ferramentas que consumirem o secret diretamente, sem o wrapper, ainda podem falhar.

Não é necessário resetar a senha: as mesmas credenciais autenticaram com sucesso no endpoint correto.

---

# 15. Evidências reais de produção em 16/09/2026

## 15.1 Conectividade READ ONLY

PR #11:

```text
Corrigir PRIMARY para Session Pooler aprovado e verificar produção sem escrita
merge commit: 4e426bc1e95c17916a3b10e1642366c3164f3b2f
```

Workflow:

```text
CIT production connection verification
run: 35126088433
job: 104895353744
resultado: success
```

Comprovou nos dois ambientes:

- IPv4;
- TLS `verify-full`;
- autenticação;
- database `postgres`;
- `current_user` correto;
- membership da role técnica;
- PostgreSQL 17.6;
- leitura geográfica;
- hashes iguais ao baseline;
- migration `0007` com definições esperadas.

A verificação foi READ ONLY e não gravou auditoria/controle.

## 15.2 Reconciliação real em `check`

Workflow disparado manualmente:

```text
CIT manual replication
run: 35127583296
head SHA: 8130acd7abae6367f5cf602fb9baff5560f742f6
mode: check
allow_deletions: false
conclusion: success
```

Job de replicação:

```text
job_id: 11a1b795-a6fc-495b-9217-52dc5985e980
snapshot_sha256: 0243760b424cf8839442566ec91a5bd4089be32b9e21527f63492ca32d1dbaee
parity: true
```

Resultado:

- `dim_municipio`: 5.571 = 5.571, hash igual;
- `dim_distrito`: 10.751 = 10.751, hash igual;
- `dim_subdistrito`: 646 = 646, hash igual;
- `dim_cep5`: 24.905 = 24.905, hash igual;
- deletados: 0 em todas;
- inseridos/atualizados na geografia: 0;
- 4 eventos de auditoria produzidos;
- auditoria conferida diretamente em PRIMARY e REPLICA;
- `remaining_pages=0`;
- `remaining_items=0`;
- `unfinished_jobs=0`.

O job ficou `AUDITED`.

O PRIMARY possui um evento histórico adicional anterior; a REPLICA não. Isso é esperado e **não deve ser corrigido artificialmente**.

Conclusão deste marco:

```text
conexão PRIMARY: homologada
conexão REPLICA: homologada
preflight: homologado
replicação check: homologada
auditoria do check: homologada
paridade geográfica: confirmada
apply real em produção: ainda não homologado
```

---

# 16. Estado atual do produto publicado

O frontend atual é propositalmente mínimo. Ele informa que a fundação geográfica está carregada e oferece o **console administrativo de ingestão**.

O console implementa:

```text
login
→ identificar role
→ upload
→ append em chunks
→ inspeção
→ revisão manual
→ finalize
→ exportação do JSON validado
```

Os módulos comerciais ainda não foram reconstruídos.

Não reintroduzir automaticamente:

- concorrência;
- Zero Estoque;
- Melhor Oferta;
- proposta;
- IPC;
- potencial;
- market share;
- mensalidade;
- escolas/cliente como domínio canônico;
- demais regras históricas.

Cada domínio futuro deve nascer de fonte aprovada + contrato + migration/ingestão + QA + replicação + interface.

---

# 17. O que falta para considerar a fundação operacional 100% fechada

A fundação está madura, mas o ciclo reutilizável ainda precisa de quatro provas:

## 1. Homologar ingestão E2E publicada — **PRÓXIMA AÇÃO**

Provar com sessão real:

```text
login
→ upload
→ staging
→ validação
→ revisão
→ READY
→ finalize
→ VALIDATED
→ auditoria
```

Sem tocar nas dimensões canônicas.

## 2. Formalizar e homologar promoção para a camada canônica do PRIMARY

Hoje:

```text
VALIDATED ≠ promovido
```

Para cada domínio futuro, definir o contrato:

```text
staging VALIDATED
→ aprovação/promoção
→ tabela canônica PRIMARY
```

## 3. Homologar `apply` real em produção

Provar que uma divergência legítima pode ser corrigida:

```text
PRIMARY
→ apply
→ REPLICA
→ novo checksum
→ parity=true
```

Não adulterar a geografia homologada apenas para fabricar um erro.

## 4. Homologar recuperação/idempotência operacional

Após `apply`, comprovar:

- zero páginas/itens pendentes;
- auditoria entregue;
- reexecução sem efeitos duplicados;
- retomada segura após interrupção.

Os testes automatizados já cobrem esses comportamentos em ambiente isolado; falta a prova operacional apropriada.

Depois dessas provas, fechar governança:

- consolidar README/mapa/evidências;
- avaliar branch protection da `main`;
- corrigir o valor armazenado de `CIT_PRIMARY_DATABASE_URL` para o endpoint real, sem expor senha;
- manter o wrapper como validação defensiva, não como dependência de host obsoleto.

---

# 18. PONTO EXATO DE RETOMADA — NÃO REFAZER O QUE JÁ FOI FEITO

## Situação no momento da pausa

O projeto foi encerrado por hoje **antes de executar o primeiro lote E2E pela interface publicada**.

Já foi preparado um arquivo controlado chamado:

```text
cit_e2e_ingestao_20260916.json
```

SHA-256:

```text
724a7e6f70cff5689405cb73935cf26be8f43389f4c12b72e21aec5861d1b8ec
```

Conteúdo exato, caso seja necessário recriar o arquivo:

```json
[
  {
    "COD_MUNICIPAL": "3550308",
    "MUNICIPIO": "São Paulo",
    "UF": "SP",
    "CEP5": "01001",
    "CASO": "exato_cep5"
  },
  {
    "COD_MUNICIPAL": "3304557",
    "MUNICIPIO": "Rio de Janeiro",
    "UF": "RJ",
    "CEP": "20010-000",
    "CASO": "cep_completo"
  },
  {
    "COD_MUNICIPAL": "5101837",
    "MUNICIPIO": "Boa Esperança do Norte",
    "UF": "MT",
    "CEP5": "99999",
    "CASO": "boa_esperanca_scope"
  },
  {
    "COD_MUNICIPAL": "3550308",
    "MUNICIPIO": "São Pauloo",
    "UF": "SP",
    "CASO": "revisao_manual"
  }
]
```

Antes de pausar, o resolver do PRIMARY foi testado em leitura com as quatro linhas e retornou exatamente o comportamento esperado:

| Caso | Resultado esperado já pré-validado no resolver |
|---|---|
| São Paulo + `01001` | `VALIDO`, escopo `CEP5` |
| Rio + `20010-000` | `VALIDO`, normaliza para CEP5 `20010` |
| Boa Esperança + `99999` | `VALIDO`, remove CEP normalizado e usa `MUNICIPIO_INTEIRO` |
| `São Pauloo` | `AGUARDANDO_REVISAO`, motivo `CONFLITO_CODIGO_NOME_UF`, São Paulo aparece como candidato |

### Execução manual que falta

Abrir:

```text
https://cit-edbs.lovable.app
```

Depois:

1. clicar em **Abrir console administrativo**;
2. autenticar com a conta existente que possui grant `admin`;
3. selecionar o JSON acima;
4. preencher:

```text
Dataset: homologacao_e2e_ingestao
Fonte: E2E_20260916
Exigir CEP5 em todas as linhas: NÃO
```

5. enviar o lote;
6. esperar **3 linhas resolvidas + 1 pendência**;
7. revisar a linha `São Pauloo` selecionando:

```text
Município: São Paulo / SP / 3550308
CEP5: deixar vazio
Justificativa: Homologacao E2E da revisao manual
Corrigir UF: NÃO
Memorizar alias: NÃO
```

**Não marcar “Memorizar alias”.** O erro é proposital e não deve virar regra permanente.

8. após a revisão, o lote deve ficar `READY`;
9. clicar em **Selar lote validado**;
10. resultado esperado: `VALIDATED`.

### Validação de banco que deve ser feita imediatamente depois

Assim que o usuário disser que selou o lote, consultar o PRIMARY e confirmar:

1. existe exatamente o batch esperado;
2. `expected_rows=4` e `received_rows=4`;
3. nenhuma linha está `AGUARDANDO_REVISAO`;
4. os três casos automáticos foram normalizados corretamente;
5. a linha `São Pauloo` foi registrada como `CORRIGIDO` por revisão manual;
6. existe **1 `review_event`** correspondente;
7. **nenhum `municipality_alias`** foi criado;
8. o batch ficou `VALIDATED`;
9. `rows_sha256` foi persistido;
10. `carga_id` foi criado em `public.etl_cargas`;
11. `linhas_gravadas=0` e não houve promoção temática;
12. existe check `geographic_gate_v1` em `audit_data_quality` com `passou=true`;
13. as dimensões canônicas continuam exatamente:

```text
dim_municipio    5.571
dim_distrito    10.751
dim_subdistrito    646
dim_cep5         24.905
```

14. os quatro hashes geográficos permanecem iguais ao baseline da seção 11.

Se tudo isso passar, registrar a **ingestão E2E publicada como homologada** e avançar para o item 2 da seção 17: contrato/promoção da staging `VALIDATED` para a camada canônica.

---

# 19. O que NÃO fazer ao retomar

Não:

- executar outro `check` apenas por perda de contexto;
- reaplicar migrations já homologadas;
- criar novo admin sem necessidade;
- criar alias para `São Pauloo`;
- alterar as quatro dimensões geográficas para testar ingestão;
- executar `apply` antes de fechar o E2E de ingestão;
- restaurar regras comerciais históricas;
- usar REPLICA como autoridade sobre PRIMARY;
- trocar `config.toml` para a REPLICA;
- resetar senha do login técnico;
- copiar segredo para chat, README ou log.

---

# 20. Próximas fases depois da fundação

Somente depois do ciclo operacional homologado, começar os domínios comerciais.

A ordem ainda deve ser decidida por contrato, mas a tendência arquitetural é iniciar pelos dados que funcionam como eixo de relacionamento, especialmente **escolas/setorização**, e então conectar os demais domínios.

Possíveis domínios posteriores, sem reativação automática de regras legadas:

- escola canônica;
- setorização/carteira;
- adoções;
- ENEM;
- demografia;
- concorrência;
- produtos;
- Zero Estoque;
- Melhor Oferta;
- proposta;
- indicadores e regras comerciais homologadas.

Cada domínio deverá responder antes de ser implementado:

```text
qual é a fonte?
qual é o grão?
qual é a chave canônica?
quais relacionamentos são autorizados?
quais regras de qualidade?
como entra pela ingestão?
como é promovido?
como é replicado?
como é auditado?
como aparece na interface?
```

---

# 21. Glossário rápido

| Termo | Significado simples |
|---|---|
| PRIMARY | Banco operacional principal e autoritativo. |
| REPLICA | Cópia independente do PRIMARY. |
| Migration | Arquivo SQL versionado que registra mudança estrutural. |
| DDL | SQL que cria ou altera estrutura de banco. |
| Schema | Área lógica dentro do PostgreSQL. |
| PK | Chave que identifica unicamente um registro. |
| FK | Chave que relaciona tabelas. |
| Staging | Área de entrada/validação antes do dado canônico. |
| `VALIDATED` | Lote de staging validado e selado; não significa promoção temática. |
| Promoção | Movimento controlado de staging homologada para tabela canônica. |
| Role | Identidade/grupo de permissões PostgreSQL. |
| RLS | Row Level Security, controle de acesso por linha. |
| CI | Testes automáticos executados pelo GitHub. |
| Workflow | Sequência automatizada de tarefas do GitHub Actions. |
| Runner | Máquina temporária que executa workflow. |
| Secret | Credencial armazenada de forma protegida. |
| DSN | String de conexão com banco. |
| TLS/SSL | Criptografia da conexão. |
| CA | Certificado usado para validar o servidor. |
| Pooler | Intermediário que gerencia conexões PostgreSQL. |
| Session Pooler | Pooler que preserva sessão; usado aqui na porta 5432. |
| Preflight | Checagem de conexão e identidade antes da operação. |
| Hash/checksum | Impressão digital determinística do conteúdo. |
| Idempotência | Repetir operação sem efeitos duplicados indevidos. |
| Replay | Retomar/repetir execução controladamente. |
| E2E | Teste ponta a ponta do fluxo real. |
| `check` | Compara PRIMARY e REPLICA e registra auditoria/controle; não repara dados. |
| `apply` | Promove/repara REPLICA a partir do PRIMARY. |

---

# 22. Estado atual em uma frase

> **A V2 possui fundação, segurança, geografia homologada, PRIMARY e REPLICA conectados e reconciliação `check` real com auditoria e paridade; o trabalho parou imediatamente antes do primeiro teste de ingestão E2E pela interface publicada, que é a próxima ação e está completamente especificada na seção 18.**
