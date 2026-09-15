<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> Este projeto esta conectado ao Lovable. Nao reescreva historico Git ja publicado
> na branch conectada. Commits no GitHub sao o mecanismo oficial de sincronizacao.
<!-- LOVABLE:END -->

# Paper Comercial V2 - regras para agentes e automacoes

Antes de alterar qualquer coisa, leia `README.md` e `docs/architecture/README.md`.

1. GitHub e a fonte oficial de codigo, DDL, contratos, regras futuras, testes e documentacao.
2. Em 2026-09-15 todas as regras de negocio legadas foram removidas da branch atual. Nao recuperar formulas, fluxos, chaves, filtros ou heuristicas do historico Git sem pedido explicito do usuario.
3. Toda regra de negocio nova deve nascer de fonte/necessidade explicitada, contrato versionado, implementacao testavel e commit.
4. Nao assumir chaves canonicas, ordem de dominios, faixas, formulas, criterios de concorrencia, market share, mensalidade, potencial, oferta ou qualquer comportamento legado.
5. Lovable Cloud e runtime e banco operacional PRIMARY. Alteracoes permanentes de codigo nao devem ser feitas por mensagens/prompts no agente do Lovable.
6. Supabase externo `vevmnoxbjdkibdwfygfn` e a REPLICA confirmada. Fluxo automatico de dados e sempre PRIMARY -> REPLICA.
7. `supabase/config.toml` aponta para `chwsmkdkgdgocnbcyvmq` e deve permanecer assim ate prova administrativa em contrario. Esse ID e fortemente consistente com o backend tecnico ligado ao Lovable/PRIMARY; nao substitui-lo pelo ID da REPLICA.
8. O projeto `chwsmkdkgdgocnbcyvmq` nao e acessivel pela conexao Supabase externa atual, portanto sua natureza exata permanece como topologia inferida, nao fato administrativo confirmado.
9. Toda mudanca de schema V2 deve existir primeiro em `database/v2/`. Dados de negocio exigem contrato em `docs/data-contracts/`.
10. Nenhuma credencial, service role, connection string ou segredo deve ser versionado.
11. Tabelas internas devem usar RLS e principio de menor privilegio.
12. Contagem + checksum sao obrigatorios para declarar paridade de datasets replicados.
13. Schemas gerenciados pela plataforma (`auth`, `storage`, `realtime`, extensoes e equivalentes) nao fazem parte de resets de negocio sem decisao explicita.
14. Figma e referencia visual; `SIGMA` e somente um nome antigo/incorreto e nao um projeto paralelo.
