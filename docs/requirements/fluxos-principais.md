# Mapeamento dos fluxos principais — Paper Comercial V2

Data: 29/09/2026. Responsável pelas decisões: Kaue Pastrello (time técnico).

Este documento registra, para cada fluxo principal, **entradas, saídas, atores, estados e transições**. Ele descreve comportamento desejado; não é migration, não é contrato de dados e não comprova implementação. Cada item é marcado como:

- **Decidido** — aprovado pelo responsável e pronto para virar contrato/implementação;
- **Implementado** — já existe no código versionado (com referência);
- **Pendente** — ainda precisa de decisão ou verificação.

Regra de continuidade: ao decidir algo novo, atualizar este arquivo no mesmo commit da decisão. Ao implementar, apontar o commit/migration/teste correspondente e manter a distinção entre decidido e implementado.

## Atores

| Ator | Quem é | Perfil técnico (`access_grants.role`) |
|---|---|---|
| Time técnico | Lista nominal fechada (ver F01) | `admin` |
| Time comercial | Consultores comerciais do mercado privado; na prática, qualquer conta autenticada dos domínios EDBS que não esteja na lista técnica | `viewer` |
| Microsoft Entra ID | Provedor de identidade (login Microsoft) | — |
| PRIMARY | Banco operacional autoritativo (Lovable Cloud) | — |
| Worker de replicação | Processo técnico PRIMARY → REPLICA via GitHub Actions — **descontinuado em 29/09/2026** (ver F04) | login técnico `cit_replication_*` |

Não existem outros perfis. Os papéis `operator` e `reviewer` da `0003` foram removidos pela `0008` (ver F01, Implementação).

---

## F01 — Acesso e autenticação

Estado: **Decidido** em 29/09/2026. Implementação: **Aplicada no PRIMARY e verificada** em 29/09/2026 — login Microsoft e UX pelo Lovable (commits `127135d`…`455582b`); perfis, provisionamento e rotas pela migration `0008` (commit `6189013`) e pela interface (ver "Implementação" e "Verificação no PRIMARY").

### Resumo

Mapeamento original do responsável. Perfil técnico ampliado de 1 para 5 contas em 29/09/2026.

| Elemento | Regra |
|---|---|
| Quem acessa | Consultores comerciais do mercado privado + time técnico |
| Autenticação | Microsoft Auth |
| Domínios permitidos | `editoradobrasil.com.br` e `editoradobrasil1.onmicrosoft.com` |
| Perfil técnico | As 5 contas da regra 3 |
| Perfil comercial | Demais usuários autenticados dos domínios autorizados |
| Técnico pode acessar | Todas as rotas da aplicação |
| Comercial pode acessar | Somente a rota/módulo de **Análise Geográfica** |
| Usuário externo | Acesso negado |

### Objetivo

Garantir que somente pessoas da EDBS acessem o sistema, autenticadas pela conta Microsoft corporativa, e que cada uma veja apenas as rotas do seu perfil.

### Regras

1. **Provedor único:** autenticação exclusivamente via Microsoft (Entra ID) pelo Auth do PRIMARY. Não há login por senha nem cadastro próprio.
2. **Domínios permitidos:** somente e-mails terminados em `@editoradobrasil.com.br` ou `@editoradobrasil1.onmicrosoft.com`. Qualquer outro domínio é bloqueado, mesmo que o login Microsoft tenha sucesso.
3. **Perfil técnico (`admin`) — lista fechada:**
   - `vinicius.moraes@editoradobrasil.com.br`
   - `ana.kretli@editoradobrasil.com.br`
   - `joao.jurado@editoradobrasil.com.br`
   - `amanda.bueno@editoradobrasil.com.br`
   - `kaue.pastrello@editoradobrasil.com.br`
4. **Perfil comercial (`viewer`) — automático:** toda conta de domínio permitido que não esteja na lista técnica recebe `viewer` no primeiro acesso aprovado pelo Auth. A regra anterior de liberação manual (grant explícito antes de qualquer acesso) foi **descartada** em 29/09/2026.
5. **Rotas:**
   - `admin`: todas as rotas;
   - `viewer`: somente a rota de análise geográfica (ver F02).
6. **Autorização é decidida no servidor.** A interface esconde o que o perfil não pode usar, mas quem nega é o PRIMARY, consultando `auth.users` e `cit_private.access_grants` ao vivo. Claims editáveis (`user_metadata`) nunca autorizam nada — regra já vigente em `docs/data-contracts/ingestion-v1.md`.
7. Comparação de e-mail e domínio sem diferenciar maiúsculas/minúsculas.

### Entradas

- Clique em "Entrar com Microsoft".
- Resposta do Entra ID: identidade e e-mail da conta.
- Registro de perfil em `cit_private.access_grants` (quando já existir).

### Saídas

- Sessão autenticada com perfil resolvido (`admin` ou `viewer`) e redirecionamento para a rota inicial do perfil.
- Ou bloqueio com mensagem clara: domínio não permitido, acesso revogado ou rota não permitida para o perfil.

### Estados

| Estado | Significado |
|---|---|
| `ANONIMO` | Sem sessão. |
| `AUTENTICANDO` | Redirecionado ao login Microsoft, aguardando retorno. |
| `BLOQUEADO_DOMINIO` | Login Microsoft concluído, mas e-mail fora dos domínios permitidos. Sem sessão útil no sistema. |
| `ATIVO_ADMIN` | Sessão válida com perfil técnico. |
| `ATIVO_VIEWER` | Sessão válida com perfil comercial. |
| `REVOGADO` | Perfil revogado em `access_grants` ou conta desabilitada; nenhuma operação é aceita. |

### Transições

| De | Evento | Condição | Para |
|---|---|---|---|
| `ANONIMO` | Clicar "Entrar com Microsoft" | — | `AUTENTICANDO` |
| `AUTENTICANDO` | Retorno do Entra ID | Falha/cancelamento | `ANONIMO` |
| `AUTENTICANDO` | Retorno do Entra ID | Domínio fora da lista | `BLOQUEADO_DOMINIO` |
| `AUTENTICANDO` | Retorno do Entra ID | Domínio permitido e e-mail na lista técnica | `ATIVO_ADMIN` |
| `AUTENTICANDO` | Retorno do Entra ID | Domínio permitido, fora da lista técnica | `ATIVO_VIEWER` (cria grant `viewer` se ainda não existir) |
| `AUTENTICANDO` | Retorno do Entra ID | Domínio permitido, mas e-mail não confirmado ou grant revogado | `REVOGADO` (tela "Acesso não liberado") |
| `ATIVO_VIEWER` | Acessar rota não permitida | — | Permanece `ATIVO_VIEWER`; acesso negado e retorno à análise geográfica |
| `ATIVO_ADMIN` / `ATIVO_VIEWER` | Grant revogado ou conta desabilitada | — | `REVOGADO` |
| Qualquer ativo | Sair / sessão expirar | — | `ANONIMO` |
| `BLOQUEADO_DOMINIO` / `REVOGADO` | Sair | — | `ANONIMO` |

### Implementação

O Lovable fez o login Microsoft e a UX (29/09/2026, commits `127135d`…`455582b`), mas criou um modelo de perfis paralelo (`public.app_role` = `admin`/`gestor`/`consultor`, `public.user_roles`), sem a lista técnica e sem restrição de rota. A migration `0008` e a interface corrigem isso. Decisão de 29/09/2026: `cit_private.access_grants` é a **única** fonte de permissão.

| Item | Onde | Como funciona |
|---|---|---|
| Login Microsoft | `src/auth/AuthGate.tsx`, `src/integrations/lovable/index.ts` (Lovable) | Único caminho de entrada; `src/main.tsx` protege o app inteiro. |
| Domínios permitidos | `cit_private.allowed_email_domains` (0008) | Versionados em migration; a checagem no `AuthGate` é só camada visual. |
| Lista técnica | `cit_private.admin_allowlist` (0008) | Os 5 e-mails; alterar somente por migration. |
| Bloqueio de cadastro de outro domínio | trigger `on_auth_user_created_corporate_check` em `auth.users` | Recusa a criação da conta; mesmo nome do trigger do Lovable, agora gravando em `access_grants`. |
| Perfil automático | `cit_private.provision_grant` (0008) | No cadastro e em **toda** chamada de `cit_ingest`: `admin` se o e-mail está na lista técnica, senão `viewer`. Cobre as contas antigas no primeiro acesso. Exige e-mail confirmado (`email_confirmed_at`). Não reativa grant revogado. Quem sai da lista técnica volta a `viewer` no acesso seguinte. |
| Conta fora dos domínios com grant antigo | `cit_private.edbs_email` (0008) | Sem perfil, mesmo com grant anterior. |
| Autorização no servidor | `cit_private.ingest_api` (0008) | `viewer`: só `session` e `lookup` de municípios; demais ações exigem `admin` (`ADMIN_ONLY`). `operator`/`reviewer` não são mais aceitos na tabela. |
| Rotas | `src/App.tsx` | `/analise-geografica` para os dois perfis; `/fundacao` (fundação + console de ingestão) só `admin`; `viewer` é redirecionado. |
| Perfil sem acesso | `AuthGate.tsx` | Tela "Acesso não liberado" com botão Sair. |
| Modelo paralelo do Lovable | 0008 | `public.user_roles`, `public.has_role` e `public.app_role` removidos. `public.profiles` mantida só como identidade (nome/e-mail), legível pelo dono e sem escrita pelo navegador. |
| Formulário de senha | `IngestionConsole.tsx` | Removido; o console não autentica sozinho. |

Testes: `database/tests/ingestion.sql` (roda 0001–0007, as duas migrations do Lovable e a 0008, na mesma ordem do PRIMARY), `src/test/auth-gate.test.tsx`, `src/test/app.test.tsx`, `src/test/ingestion-console.test.tsx`. A `0008` também foi aplicada num banco sem as migrations do Lovable (cenário REPLICA).

### Verificação no PRIMARY (29/09/2026)

A `0008` foi colada inteira no editor SQL do Lovable Cloud pelo Kaue ("Query succeeded"; arquivo transacional, sem aplicação parcial). Consulta de verificação exportada em seguida:

| Verificação | Esperado | Resultado |
|---|---|---|
| Contas técnicas em `admin_allowlist` | 5 | 5 |
| Perfis em `access_grants` | `admin:1` (grant anterior do Kaue) | `admin:1` |
| `public.user_roles` removida | true | true |
| Contas em `auth.users` sem e-mail confirmado | — | 0 |

Login do Kaue pela conta Microsoft funcionou após a aplicação. Não verificado ainda: login de uma conta comercial (deve cair em `/analise-geografica` com perfil `viewer`).

Como a `0008` foi aplicada pelo editor SQL, e não pelo chat do Lovable, ela não aparece em `supabase/migrations/`. A fonte oficial continua sendo `database/v2/`; não aceitar sugestão do Lovable de recriar `user_roles`/`app_role`.

### Pendências

- [ ] **Testar o login de uma conta comercial** e confirmar o perfil `viewer` e a rota `/analise-geografica`.
- [ ] **Tenant do login Microsoft:** ainda não há tenant configurado (29/09/2026), então o login aceita contas de qualquer organização Microsoft e a checagem por domínio depende do e-mail informado por ela. Restringir ao tenant EDBS quando ele for configurado.
- [ ] **Login por senha:** desligar o provedor e-mail/senha no Auth do PRIMARY, para que a Microsoft seja de fato o único caminho.
- [ ] **Destino das 28 contas existentes no Auth do PRIMARY** (snapshot de 15/09/2026): levantar a lista e decidir se são mantidas, desabilitadas ou removidas; desligar o login por senha.
- [ ] Caminho `/analise-geografica` é provisório; confirmar no F02 (pendência "Nome do módulo").
- [ ] Validar os textos das telas `BLOQUEADO_DOMINIO` ("Acesso nao autorizado…") e `REVOGADO` ("Acesso nao liberado…").
- [ ] Desligamento de colaborador: a conta desabilitada no Entra ID impede novo login, mas uma sessão já aberta dura até expirar. Decidir se isso é aceitável ou se precisa de revogação ativa.

---

## F02 — Análise Geográfica

Estado: **Em mapeamento** desde 29/09/2026. Decisões do responsável registradas abaixo; nada implementado além da rota provisória `/analise-geografica`. Os indicadores ainda estão sendo avaliados: o fluxo é desenhado para funcionar com **blocos de dados** que serão definidos depois, sem depender de quais são.

### Resumo

| Elemento | Regra |
|---|---|
| Quem usa | Consultor comercial (`viewer`) e time técnico (`admin`) |
| Entrada | Código da escola: `COD_PROTHEUS`, `COD_INEP` ou `CD_ESCOLA` |
| Chave da escola | Principal: `COD_PROTHEUS`. Secundária: `COD_INEP`. `CD_ESCOLA` só como meio de busca |
| Recorte | Consultor: somente as escolas da sua carteira. Técnico: todas as escolas |
| Território da escola | CEP5 da escola, resolvido pela geografia oficial (`dim_cep5`) |
| Dados exibidos | Mescla de dados educacionais e demográficos (blocos a definir); o demográfico é do **CEP5** da escola |
| Saída | Análise na tela e PDF, para apresentar à escola na visita |
| Usuário sem perfil | Acesso negado (F01) |

### Regras

1. **Identificação da escola.**
   - `COD_PROTHEUS` é a chave principal da escola no sistema.
   - `COD_INEP` é a chave secundária.
   - `CD_ESCOLA` vem da Intranet, sistema em desligamento, e é aceito só como forma de busca, porque o consultor ainda o consulta.
   - Nem toda escola tem os três códigos.
2. **Duplicidade conhecida.** Uma mesma escola pode aparecer com mais de um `COD_PROTHEUS`; isso é erro de origem. O sistema não escolhe um silenciosamente: a duplicidade (ex.: o mesmo `COD_INEP` em mais de um `COD_PROTHEUS`) é apontada na carga e na tela.
3. **Carteira.** O login Microsoft identifica o consultor pelo e-mail. O e-mail leva ao `COD_PROTHEUS` do consultor, e esse código leva às escolas da carteira dele. O `COD_PROTHEUS` do consultor e o da escola são códigos diferentes e não se misturam.
4. **Recorte no servidor.** A restrição à carteira é aplicada pelo PRIMARY, não só pela interface. Um consultor não consegue abrir uma escola fora da carteira nem digitando o código.
5. **Território.** O demográfico usa o CEP5 da escola dentro do município dela (`dim_cep5` tem chave `cod_municipal + cep5`). Nunca inventar ou emprestar CEP5. Para `5101837` (Boa Esperança do Norte/MT) vale a regra homologada de município inteiro (`docs/data-contracts/boa-esperanca-do-norte-cep5.md`).
6. **Dado ausente não vira zero.** Bloco sem dado para a escola ou o CEP5 aparece como "indisponível", na tela e no PDF.

### Atores

| Ator | Papel no fluxo |
|---|---|
| Consultor comercial | Informa o código, consulta a análise da escola da sua carteira, gera o PDF e apresenta na visita |
| Time técnico | O mesmo, para qualquer escola; também carrega e corrige as bases (fluxo F03) |
| PRIMARY | Resolve o código, aplica o recorte da carteira, resolve o território e entrega os blocos |
| Bases de origem | Escolas; consultores; carteira (ver Dependências) |

### Entradas

- Código digitado pelo usuário, que pode ser `COD_PROTHEUS`, `COD_INEP` ou `CD_ESCOLA`.
- Identidade do usuário (e-mail do login) e perfil (F01).
- Escolha da escola, quando o código corresponde a mais de uma (regra 2).
- Comando "Gerar PDF".

### Saídas

- **Tela da análise:** identificação da escola (nome e códigos), território (UF, município, CEP5), blocos educacionais e blocos demográficos.
- **PDF** com o mesmo conteúdo, pronto para apresentar à escola.
- **Mensagens de bloqueio:** código não encontrado; escola fora da carteira; escola sem território resolvido; bloco indisponível.

### Estados (proposta para validar)

| Estado | Significado |
|---|---|
| `AGUARDANDO_CODIGO` | Tela inicial, campo de busca vazio. |
| `BUSCANDO` | Código enviado ao servidor. |
| `NAO_ENCONTRADA` | Nenhuma escola com esse código dentro do recorte do usuário. |
| `MULTIPLAS_ESCOLAS` | O código corresponde a mais de uma escola do recorte (duplicidade da regra 2); o usuário escolhe. |
| `ESCOLA_SELECIONADA` | Uma escola resolvida, na carteira do usuário. |
| `SEM_TERRITORIO` | A escola não tem CEP5 válido no município dela: blocos demográficos indisponíveis, educacionais seguem. |
| `ANALISE_PRONTA` | Blocos carregados; cada bloco com dado ou "indisponível". |
| `GERANDO_PDF` → `PDF_PRONTO` | Documento gerado a partir da análise na tela. |

### Transições (proposta para validar)

| De | Evento | Condição | Para |
|---|---|---|---|
| `AGUARDANDO_CODIGO` | Enviar código | — | `BUSCANDO` |
| `BUSCANDO` | Resposta | Nenhuma escola no recorte | `NAO_ENCONTRADA` |
| `BUSCANDO` | Resposta | Mais de uma escola no recorte | `MULTIPLAS_ESCOLAS` |
| `BUSCANDO` | Resposta | Exatamente uma escola | `ESCOLA_SELECIONADA` |
| `MULTIPLAS_ESCOLAS` | Escolher uma | — | `ESCOLA_SELECIONADA` |
| `ESCOLA_SELECIONADA` | Resolver território | CEP5 válido no município | `ANALISE_PRONTA` |
| `ESCOLA_SELECIONADA` | Resolver território | Sem CEP5 válido | `SEM_TERRITORIO` → `ANALISE_PRONTA` (demográfico indisponível) |
| `ANALISE_PRONTA` | Gerar PDF | — | `GERANDO_PDF` → `PDF_PRONTO` |
| Qualquer | Nova busca | — | `AGUARDANDO_CODIGO` |

### Dependências (cada base exige contrato em `docs/data-contracts/` antes de carregar)

| Base | Campos previstos | Situação |
|---|---|---|
| Escolas | `COD_PROTHEUS` (escola), `COD_INEP`, `CD_ESCOLA`, nome, endereço/CEP, município | A subir pelo responsável |
| Consultores | `COD_PROTHEUS` (consultor), nome, e-mail | Em atualização na origem |
| Carteira | `COD_PROTHEUS` (escola) + consultor | A subir; ver pendência de chave |
| Blocos educacionais e demográficos | A definir | Responsável avaliando os dados |

### Pendências

- [ ] **Chave da carteira:** confirmar que a base de carteira traz o `COD_PROTHEUS` do **consultor**, e não só o nome. Ligar escola e consultor pelo nome quebra com homônimos e grafias diferentes.
- [ ] **E-mail do consultor:** o e-mail da base de consultores deve ser o mesmo do login Microsoft. Decidir o que acontece se não bater (consultor autenticado sem carteira).
- [ ] **Escola fora da carteira:** mostrar a mesma mensagem de "não encontrada", sem revelar que a escola existe, ou dizer que ela pertence a outra carteira?
- [ ] **Duplicidade de `COD_PROTHEUS`:** quem corrige (origem ou time técnico) e se as duas linhas ficam visíveis até a correção.
- [ ] **Formato dos códigos:** padrão de cada um (dígitos, tamanho), para o sistema reconhecer o tipo digitado ou pedir que o usuário escolha.
- [ ] **CEP da escola:** confirmar que a base de escolas traz o CEP de 8 dígitos (o CEP5 sai do prefixo).
- [ ] **Blocos de dados:** quais indicadores educacionais e demográficos, de quais fontes, e em que ordem entram.
- [ ] **PDF:** conteúdo e identidade visual; se registra quem gerou e quando.
- [ ] **Nome do módulo:** a entrada é por escola; confirmar se continua "Análise Geográfica" e a rota `/analise-geografica`.

---

## F03 — Entrada de dados (ingestão)

Estado: **Implementado** para geografia (`docs/data-contracts/ingestion-v1.md`); mapeamento de fluxo **Pendente**. Será o caminho das bases de escolas, consultores e carteira do F02.

- Ator: somente `admin` (após F01).
- Estados já implementados: `UPLOADING → REVIEW → READY → VALIDATED`, com saída `REJECTED`.
- A mapear: entradas, saídas e transições no formato deste documento, incluindo a promoção do lote validado para a tabela oficial.

---

## F04 — Replicação PRIMARY → REPLICA

Estado: **Descontinuado** em 29/09/2026 — decisão do responsável: o projeto não terá mais banco REPLICA. Worker, workflows e testes removidos do repositório; logins desativados no PRIMARY pela `0009`. Ficam como histórico as migrations 0004–0006 e `docs/replication/`. Pendente: remover as tabelas de controle e os papéis `cit_replication_*` numa migration futura.
