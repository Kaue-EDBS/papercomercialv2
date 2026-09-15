# Clean slate de regras de negócio — 2026-09-15

## Objetivo

Registrar a remoção das regras funcionais legadas da branch atual do Paper Comercial V2 após o reset dos bancos.

## Removido da branch atual

- planos históricos em `.lovable/plan/`;
- migrations legadas em `supabase/migrations/`;
- páginas e componentes específicos do produto antigo;
- módulos de concorrência;
- hooks de carteira, consultores, dados, potencial, renda e setorização;
- bibliotecas de análise, mensalidade, socioeconômico, exportação e tipos de domínio;
- rotas antigas de apresentação e busca;
- metadados HTML que descreviam o comportamento comercial anterior.

## Preservado

- histórico Git, apenas como evidência não vigente;
- bootstrap React/Vite;
- biblioteca UI genérica;
- estilos/design tokens;
- integração Supabase gerada para o runtime;
- fundação técnica de banco V2;
- documentação de governança, arquitetura e QA.

## Lovable

`Project Knowledge` do projeto `Paper Comercial OFICIAL` foi consultado e estava vazio; portanto não havia regra persistente oculta nessa camada para remover.

## Resultado esperado

A branch atual não deve oferecer nenhuma fórmula, heurística, fluxo comercial ou chave canônica de negócio reutilizável. Qualquer comportamento funcional futuro precisa ser redefinido explicitamente e versionado.
