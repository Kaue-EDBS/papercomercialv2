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
   - `viewer`: somente a rota de análise geográfica (ver F03).
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
- [ ] Caminho `/analise-geografica` é provisório; confirmar ao mapear F03.
- [ ] Validar os textos das telas `BLOQUEADO_DOMINIO` ("Acesso nao autorizado…") e `REVOGADO` ("Acesso nao liberado…").
- [ ] Desligamento de colaborador: a conta desabilitada no Entra ID impede novo login, mas uma sessão já aberta dura até expirar. Decidir se isso é aceitável ou se precisa de revogação ativa.

---

## F02 — Ingestão de dados

Estado: **Implementado** para geografia (`docs/data-contracts/ingestion-v1.md`); mapeamento de fluxo **Pendente** de validação com os perfis novos.

- Ator: somente `admin` (após F01).
- Estados já implementados: `UPLOADING → REVIEW → READY → VALIDATED`, com saída `REJECTED`.
- A mapear: entradas, saídas e transições no formato deste documento.

---

## F03 — Análise geográfica

Estado: **Pendente**. Única rota do perfil `viewer`; ainda não existe na interface.

- Atores: `admin` e `viewer`.
- A mapear: entradas, saídas, estados e transições.

---

## F04 — Replicação PRIMARY → REPLICA

Estado: **Descontinuado** em 29/09/2026 — decisão do responsável: o projeto não terá mais banco REPLICA. A implementação (`docs/replication/`, migrations 0004–0006, workflows e scripts) permanece no repositório como histórico até uma remoção planejada.
