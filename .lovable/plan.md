# Base Didático e Apoio 2026 no banco

Subir os dados do pacote enviado para o banco, no mesmo padrão das cargas anteriores (ENEM, densidade demográfica, censo): apenas backend, sem tocar em telas ou lógica do app.

## Como os dados serão guardados

A planilha vem em formato "largo": uma linha por escola e até 54 blocos de adoção lado a lado (600 colunas). Esse formato é ótimo para leitura em Excel, mas ruim para banco — inviabiliza filtro por matéria, coleção ou estratégia.

A carga será feita em formato normalizado: **uma linha por adoção**, exatamente as 23.187 adoções do arquivo, repetindo os campos fixos da escola em cada linha. Nada é perdido: a visão "largo" pode ser reconstruída a qualquer momento a partir dessa tabela.

Tabela `adocoes_didatico_apoio`:

- Escola: código da escola, nome, município, UF, região, ano (2026)
- Adoção: ordem do bloco na escola, matéria, segmento (EI, EF1, EF2, EM), tipo de material (DIDATICO, APOIO)
- Ano anterior: coleção anterior, grupo editorial anterior, quantidade de adoções
- Ano atual: coleção atual, grupo editorial, quantidade de adoções
- Anos de adoção da coleção e estratégia (ATACAR, CUIDAR, DEFENDER, MONITORAR)

Ausência de informação continua vazia — nada convertido para zero.

## Acesso

Leitura liberada apenas para usuários autenticados, mesmo critério das tabelas ENEM, demográfica e censo. Nenhuma escrita pelo app; carga por processo administrativo.

## Validação após a carga

- 23.187 linhas de adoção e 4.511 escolas distintas
- Soma de adoções do ano anterior = 1.940.045 e do ano atual = 2.120.278 (conforme a auditoria do pacote)
- Amostra conferida contra o arquivo (ex.: COLEGIO CHRISTUS / Fortaleza-CE)
- Máximo de 54 blocos em uma escola preservado

## Ponto de atenção

O "Código da Escola" desta base é numérico (6 a 9 dígitos, ex.: 600006970) e **não bate** com o `cod_protheus` das carteiras (formato tipo `C08573`). Ou seja, hoje essa base não se conecta automaticamente às carteiras. Vou guardá-la como base independente; se você tiver o de-para entre esse código e o Protheus (ou o INEP), a ligação entra numa etapa seguinte.

## Detalhes técnicos

- `CREATE TABLE public.adocoes_didatico_apoio` com `id bigint GENERATED ALWAYS AS IDENTITY`, chave natural `UNIQUE (ano, codigo_escola, bloco)` para carga idempotente, índices em `codigo_escola`, `(uf, municipio)`, `materia` e `grupo_editorial_atual`.
- Quantidades em `integer` nulo-permissivo; textos normalizados com `btrim`.
- `GRANT SELECT` para `authenticated`, `GRANT ALL` para `service_role`; RLS habilitada com política de leitura para autenticados.
- Carga como operação de dados (não migração): leitura do XLSX do pacote, "desdobramento" dos 54 blocos e inserção em lotes com `ON CONFLICT DO UPDATE`.
- O XLSX não é copiado para o repositório; os dados ficam apenas no banco.

## Fora do escopo

Nenhuma tela, hook ou exportação usa a tabela ainda.
