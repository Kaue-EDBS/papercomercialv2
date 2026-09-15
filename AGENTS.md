<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> Este projeto esta conectado ao Lovable. Nao reescreva historico Git ja publicado
> na branch conectada. Commits no GitHub sao o mecanismo oficial de sincronizacao.
<!-- LOVABLE:END -->

# Paper Comercial V2 - regras para agentes e automacoes

Antes de alterar banco, regra de negocio ou interface, leia `docs/architecture/README.md`.

Regras obrigatorias:

1. GitHub e a fonte oficial de codigo, DDL, contratos, regras de negocio, testes e documentacao.
2. Toda alteracao permanente deve ser feita primeiro no GitHub e registrada em commit. Nao usar mensagens/prompts enviados ao ambiente do Lovable como mecanismo de implementacao.
3. Lovable Cloud e o runtime e banco operacional PRIMARY.
4. O Supabase externo `vevmnoxbjdkibdwfygfn` e REPLICA independente; nunca deve originar escrita automatica de volta ao PRIMARY.
5. Toda mudanca de schema V2 deve existir primeiro em `database/v2/` e possuir contrato correspondente em `docs/data-contracts/` quando houver dado de negocio.
6. O diretorio historico `supabase/migrations/` pertence ao desenho anterior. Nao deve ser reaplicado como fonte da V2.
7. Nenhuma credencial, secret key, service role, connection string ou segredo deve ser versionado.
8. Tabelas tecnicas internas devem usar RLS e nao conceder acesso direto a `anon`/`authenticated` sem necessidade explicita.
9. Chaves oficiais e estaveis devem preceder nomes em relacionamentos. Para escola, `COD_INEP` e candidato canonico para identidade fisica; `COD_PROTHEUS`/`CD_ESCOLA` sao chaves operacionais e precisam de contrato antes de uso definitivo.
10. Alteracoes estruturais devem incluir build/testes quando aplicavel e, para dados replicados, contagem + checksum PRIMARY x REPLICA.
11. Nenhuma tabela de negocio deve nascer diretamente no banco sem DDL versionado e validacao objetiva.
12. Frontend nao deve definir regra estrutural de dados; regras criticas devem ser documentadas e testaveis.
13. Schemas gerenciados pela plataforma (`auth`, `storage`, `realtime`, extensoes e equivalentes) nao fazem parte do reset de negocio, salvo decisao explicita e separada.
