# Cadastros no banco (86 usuários) — base para login por e-mail

Aplicar a entrega `cadastros_supabase.sql` + `cadastros.json` neste projeto, criando a tabela de cadastros autorizados e importando os 86 registros com segurança (nenhum dado pessoal no frontend).

## O que será feito

1. **Migração de banco** criando `public.cadastros` com:
   - Campos: código Protheus (texto, preserva zeros à esquerda), nome, e-mail (único, minúsculo), cargo, gestor, ativo, vínculo com a conta de login.
   - Validações: cargo restrito a Consultor/Gerente/Supervisor/Diretor/Administrador; Protheus obrigatório exceto para Administrador; gestor obrigatório exceto para Diretor e Administrador.
   - Índices por cargo, gestor e ativos; atualização automática de `updated_at`.
   - Função de importação idempotente (`import_cadastros`), executável apenas pelo servidor.
   - Segurança: acesso anônimo bloqueado; usuário autenticado lê **apenas o próprio cadastro**; escrita somente por fluxo administrativo/servidor.

2. **Vínculo com o login** — o arquivo original cria um gatilho no schema de autenticação, o que não é permitido aqui. Em vez disso, a função já existente que roda no cadastro de novos usuários passa a também casar o e-mail com a linha de `cadastros` e gravar o vínculo. Comportamento final é o mesmo.

3. **Importação única dos 86 registros** — o `cadastros.json` **não** vai para `public/` nem para o bundle. A carga é feita server-side (chamada de importação com credencial de serviço), executada uma vez e depois removida.

4. **Validação** — conferir as contagens esperadas: 86 total, 75 Consultores, 5 Gerentes, 1 Supervisor, 1 Diretor, 4 Administradores; 4 sem Protheus, 5 sem gestor, 0 duplicados de e-mail/Protheus.

## Fora deste escopo (fases seguintes)

- Matriz de permissões por etapa/cargo (apenas `cargo` fica disponível).
- Tela de login e troca do acesso atual por código Protheus.
- Transformar `gestor` textual em referência ao gestor.
- Tela administrativa de inclusão/inativação.

## Notas técnicas

- Este projeto já possui `profiles` + `user_roles` (papel admin/consultor). `cadastros` entra como fonte de verdade do RH comercial e **coexiste** com essas tabelas; nenhuma delas é alterada agora.
- `GRANT SELECT` apenas para `authenticated`; `service_role` com acesso total; nada para `anon`.
- Nenhum nome ou e-mail é registrado em logs durante a importação.
