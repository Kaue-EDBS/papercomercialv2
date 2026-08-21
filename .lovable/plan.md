# Base Material Próprio 2026 no banco

Subir apenas o pacote de Material Próprio, em formato normalizado. O plano anterior (Didático e Apoio) fica de fora — voltamos a ele quando o modelo de normalização estiver definido. Nenhuma alteração de frontend.

## Como os dados serão guardados

A planilha vem em formato "largo": uma linha por escola e até 25 blocos de adoção lado a lado (281 colunas). No banco isso vira **uma linha por adoção** — as 9.761 adoções do arquivo — repetindo os campos fixos da escola em cada linha. Nada se perde: a visão em blocos pode ser reconstruída a partir dessa tabela.

Tabela `adocoes_material_proprio`:

- Escola: código da escola, nome, município, UF, região, ano (2026)
- Adoção: ordem do bloco na escola, matéria, segmento (EI, EF1, EF2, EM), tipo de material (sempre MATERIAL PRÓPRIO)
- Ano anterior: coleção anterior, grupo editorial anterior, quantidade de adoções
- Ano atual: coleção atual, grupo editorial, quantidade de adoções
- Anos de adoção da coleção e estratégia (ATACAR, MONITORAR)

A regra do pacote é preservada como veio: onde não havia adoção anterior de material próprio, os campos trazem "COLEÇÃO EDITORIAL / NÃO ADOTAVA MATERIAL PRÓPRIO" e "EDITORIAL / NÃO ADOTAVA MATERIAL PRÓPRIO" (2.777 linhas). Demais ausências continuam vazias, nunca zero.

Para facilitar a leitura por escola, incluo também a visão `vw_escolas_material_proprio`: uma linha por escola (1.150) com nome, município, UF, região, número de adoções e totais do ano anterior e do ano atual.

## Acesso

Leitura apenas para usuários autenticados — mesmo critério das bases ENEM, demográfica e censo. Nenhuma escrita pelo app.

## Validação após a carga

- 9.761 adoções e 1.150 escolas distintas
- Soma do ano anterior = 876.675 e do ano atual = 1.200.136 (conforme a auditoria do pacote)
- Máximo de 25 blocos em uma escola preservado
- Amostra conferida contra o arquivo (ex.: ASSOC BENEFIC SANTA ZITA DE LUCCA / Porto Alegre-RS)

## Ponto de atenção

O "Código da Escola" é numérico (ex.: `900102768`) e não bate com o `cod_protheus` das carteiras (formato tipo `C08573`). A base entra independente; a ligação com carteiras depende de um de-para, em etapa futura.

## Detalhes técnicos

- `CREATE TABLE public.adocoes_material_proprio` com `id bigint GENERATED ALWAYS AS IDENTITY`, `UNIQUE (ano, codigo_escola, bloco)` para carga idempotente; índices em `codigo_escola`, `(uf, municipio)`, `segmento` e `materia`.
- `codigo_escola text` (preserva zeros à esquerda); quantidades em `integer` nulo-permissivo; CHECK em `segmento` (`EI|EF1|EF2|EM`).
- View `vw_escolas_material_proprio` com `security_invoker = true`, herdando a RLS da tabela base.
- `GRANT SELECT` para `authenticated`, `GRANT ALL` para `service_role`; RLS habilitada com política de leitura para autenticados.
- Carga como operação de dados: leitura do XLSX do pacote, desdobramento dos até 25 blocos por linha e inserção em lotes com `ON CONFLICT DO UPDATE`.
- O XLSX não é copiado para o repositório; os dados ficam apenas no banco.

## Fora do escopo

Didático e Apoio, e qualquer consumo no frontend.
