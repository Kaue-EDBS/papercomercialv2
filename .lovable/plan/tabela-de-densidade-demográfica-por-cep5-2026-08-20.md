# Tabela de Densidade Demográfica por CEP5

Criar no banco uma tabela exclusiva para os dados demográficos do pacote enviado, seguindo o mesmo padrão usado na carga do ENEM: apenas backend, sem alterar telas ou lógica do app.

## O que será criado

Tabela `densidade_demografica_cep5`, com granularidade CEP5 × Município:

- Identificação: CEP5 (texto de 5 caracteres, zeros à esquerda preservados) e município
- População total e renda nominal (total e por classe A++, A+, B1, B2, C1, C2, D, E)
- População por faixa etária (faixas base de "até 4" a "80+" e os agregados)
- Potencial de consumo (total, livros e material escolar, artigos escolares, livros didáticos, outros, cursos regulares)
- População cruzada renda × faixa etária (8 classes × 9 faixas + totais)

Total: 123 campos, conforme o dicionário do README do pacote.

Regras de integridade incluídas: combinação CEP5 + município única, índices de busca por CEP5 e por município, e travas que impedem que as somas de faixas etárias e de classes de renda ultrapassem a população.

## Acesso

Leitura liberada apenas para usuários autenticados — mesmo critério já usado na tabela do ENEM. Nenhuma escrita pelo app; a carga é feita por processo administrativo.

## Carga dos dados

Importação dos 24.905 registros do JSON higienizado do pacote, em lotes, com verificação final: contagem de linhas, amostras (ex.: CEP5 01001 / São Paulo) comparadas ao arquivo de origem e checagem de que nenhuma trava de consistência foi violada.

## Detalhes técnicos

- DDL baseada em `densidade_demografica_cep5_higienizado.sql` do pacote (campos quantitativos em `bigint`, pois o potencial de consumo estoura `integer`).
- `id bigint GENERATED ALWAYS AS IDENTITY` como chave primária; `UNIQUE (cep5, municipio)` como chave natural para upsert.
- GRANT de `SELECT` para `authenticated` e `ALL` para `service_role`; RLS habilitada com política de leitura para autenticados.
- Nulos preservados como nulos (46 linhas sem população) — nada convertido para zero.
- Nenhum arquivo do frontend é alterado nesta etapa; o uso desses dados nos slides socioeconômicos entra em uma etapa posterior.
