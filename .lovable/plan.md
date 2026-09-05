# Novo fluxo: login Outlook → busca → validação → paper

Reorganizar o app em uma única aplicação (SPA) com fluxo direto: **entrar com a conta Microsoft/Outlook → buscar a escola → validar a concorrência → gerar o paper**. A Etapa 1 deixa de existir como etapa separada.

## O que muda

**1. Entrada com Outlook (Microsoft)**
- A tela de "Código Protheus" é substituída por um botão "Entrar com Microsoft".
- O login passa a ser de verdade (conta da empresa), não mais uma lista local de códigos.
- Ao entrar pela primeira vez, o sistema reconhece o consultor pelo e-mail (já existe a base de cadastros no banco que faz essa ligação) e monta a sessão com nome, código e gestor.
- Quem não estiver cadastrado recebe uma mensagem clara para procurar o administrador — sem acesso ao app.

**2. Fluxo único, sem Etapa 1**
- Saem de cena: a tela de escolha "Carteira ou Paper", a tela inicial de busca (capa), o comparativo escolar e a tela "Minha Carteira".
- Depois do login, o usuário cai direto na busca por escola (Código INEP ou Código Protheus).
- A partir da busca o fluxo segue como hoje: concorrentes essenciais → tabela de concorrentes → mapa e raio → tipo de apresentação → as 11 páginas do paper.

**3. O que não muda**
- Toda a Etapa 2 (validação de concorrência) e a Etapa 3 (paper completo, comparativos internos, exportação PDF/PPTX) continuam exatamente como estão.
- Busca por INEP com fallback para Código Protheus continua valendo.
- Bases no banco (carteiras, censo, ENEM, demográfica) não são tocadas.

## Pontos de atenção

- **Comparativo escolar**: a interpretação é que sai junto com a Etapa 1. Se quiser mantê-lo, aviso e ele vira um botão na tela de busca.
- **Carteira fake (Kaue Pastrello / DEMO001)**: sem a tela "Minha Carteira", ela deixa de aparecer no app. Os arquivos continuam no projeto caso a carteira volte em outra versão.
- **Login Microsoft**: exige um cadastro do aplicativo no Microsoft Entra (Azure) da empresa — normalmente feito pelo time de TI. Eu preparo toda a configuração do lado do app e deixo o passo a passo; sem esse cadastro da TI, o botão de login não funciona.
- **Sessão**: hoje a sessão fica salva no navegador; com o login real ela passa a ser gerenciada com segurança pela autenticação do backend, incluindo sair da conta.

## Detalhes técnicos

- `PageLogin` reescrita com `supabase.auth.signInWithOAuth({ provider: 'azure', ... })`, redirect para `window.location.origin` e tratamento de retorno da sessão (`onAuthStateChange`).
- Configuração do provedor Azure via `configure_social_auth` (mesmo turno), com instruções para o cadastro no portal Azure (client ID/secret).
- Sessão do consultor derivada de `auth.users` + `profiles`/`cadastros` (o trigger `handle_new_user` já vincula e-mail → cod_protheus e gestor); o `localStorage` de sessão é removido.
- `Index.tsx`: removidos os estados/telas `modo`, `carteira`, `capa` e o módulo comparativo; após login, `setPage('paper')` (busca). Ajustes de `handleBack`/`handleNewSearch` e do `Header` (botão sair passa a usar `signOut`).
- Arquivos órfãos (`PageModo`, `PageCapa`, `PageCarteira`, `ComparativeModule`, hooks de carteira) são desligados do fluxo; remoção física dos arquivos só depois de validado, para facilitar reversão.
- Rota `/apresentacao/:inep` (links diretos) continua funcionando, agora exigindo login.

## Fora do escopo

Nenhuma mudança visual nas páginas do paper, nenhuma carga de dados nova, e o plano anterior de Material Próprio continua suspenso.
