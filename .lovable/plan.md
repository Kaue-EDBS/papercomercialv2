# Base Didático e Apoio 2026 — modelo normalizado

Subir o pacote enviado para o banco em modelo normalizado, com os campos fixos da escola separados das adoções, e o **Código da Escola** como chave de relacionamento. Apenas backend — nenhuma tela, hook ou exportação é alterada.

## Estrutura

**1. `escolas_didatico_apoio` — 4.511 linhas (uma por escola)**
Campos fixos: código da escola (chave primária), escola, município, UF, região, ano (2026).

**2. `adocoes_didatico_apoio` — 23.187 linhas (uma por adoção)**
Ligada à tabela de escolas pelo código da escola. Cada linha traz:
- ordem do bloco na escola, matéria, segmento (EI, EF1, EF2, EM), tipo de material (DIDATICO, APOIO)
- ano anterior: coleção anterior, grupo editorial anterior, quantidade de adoções
- ano atual: coleção atual, grupo editorial, quantidade de adoções
- anos de adoção da coleção e estratégia (ATACAR, CUIDAR, DEFENDER, MONITORAR)

Ausência de informação continua vazia — nada convertido para zero.

## Sobre "uma tabela por segmento"

Recomendo **não** criar quatro tabelas físicas (EI, EF1, EF2, EM). Os quatro segmentos têm exatamente as mesmas colunas, então quatro tabelas iguais trazem só custo: toda consulta que cruza segmentos vira `UNION` de quatro, cada índice e cada ajuste futuro precisa ser feito quatro vezes, e uma escola com adoções em três segmentos passa a aparecer em três tabelas.

O mesmo resultado, sem esses custos: **uma tabela de adoções com a coluna `segmento`**, mais quatro visões prontas que se comportam como se fossem tabelas separadas:

- `vw_adocoes_ei`
- `vw_adocoes_ef1`
- `vw_adocoes_ef2`
- `vw_adocoes_em`

Consultar `vw_adocoes_ef1` é igual a consultar uma tabela só de EF1 — mas os totais gerais continuam saindo de uma consulta só. Se você preferir mesmo as quatro tabelas físicas, é só dizer que eu ajusto o plano.

## Acesso

Leitura liberada apenas para usuários autenticados nas duas tabelas — mesmo critério das bases ENEM, demográfica e censo. Nenhuma escrita pelo app; carga por processo administrativo.

## Validação após a carga

- 4.511 escolas e 23.187 adoções
- Soma de adoções do ano anterior = 1.940.045 e do ano atual = 2.120.278 (conforme a auditoria do pacote)
- Nenhuma adoção órfã (toda adoção aponta para uma escola existente)
- Amostra conferida contra o arquivo (ex.: COLEGIO CHRISTUS / Fortaleza-CE)

## Ponto de atenção

O "Código da Escola" desta base é numérico (6 a 9 dígitos, ex.: `600006970`) e **não bate** com o `cod_protheus` das carteiras (formato tipo `C08573`). A base entra como conjunto independente; se você tiver o de-para com o Protheus ou o INEP, a ligação com as carteiras entra numa etapa seguinte.

## Detalhes técnicos

- `escolas_didatico_apoio`: PK `codigo_escola text`, índice em `(uf, municipio)`.
- `adocoes_didatico_apoio`: `id bigint GENERATED ALWAYS AS IDENTITY`, `codigo_escola text NOT NULL REFERENCES public.escolas_didatico_apoio(codigo_escola) ON DELETE CASCADE`, `UNIQUE (codigo_escola, bloco)` para carga idempotente; índices em `codigo_escola`, `segmento`, `materia`, `grupo_editorial_atual`.
- `segmento` e `tipo_material` como enums textuais validados por CHECK (`EI|EF1|EF2|EM`, `DIDATICO|APOIO`); quantidades em `integer` nulo-permissivo.
- Views por segmento com `security_invoker = true`, para herdarem a RLS da tabela base.
- `GRANT SELECT` para `authenticated`, `GRANT ALL` para `service_role`; RLS habilitada nas duas tabelas com política de leitura para autenticados.
- Carga como operação de dados: leitura do XLSX do pacote, desdobramento dos até 54 blocos por linha e inserção em lotes com `ON CONFLICT DO UPDATE`.
- O XLSX não é copiado para o repositório; os dados ficam apenas no banco.

## Fora do escopo

Nenhum consumo no frontend nesta etapa.
