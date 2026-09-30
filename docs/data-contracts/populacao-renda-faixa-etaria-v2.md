# Contrato de Dados — População por Faixa de Renda vs Faixa Etária (V2)

- **Status:** carregado e validado em 2026-09-30
- **Migration:** `database/v2/0015_populacao_renda_faixa_etaria_v2.sql`
- **Tabelas:** `public.populacao_renda_faixa_etaria_cep5`, `public.populacao_renda_faixa_etaria_municipio`

## Fontes aprovadas

| Arquivo | Aba | Linhas | Colunas |
|---|---|---|---|
| `População_por_Faixa_de_Renda_vs_Faixa_Etária_-_CEP5.xlsx` | `Resultados` | 24.905 | 26 (CEP5 + total + 24 indicadores) |
| `População_por_Faixa_de_Renda_vs_Faixa_Etária_-_Municípios.xlsx` | `Resultados` | 5.571 | 81 (código IBGE + 80 indicadores) |

Ambas são fontes próprias do Paper. Nenhuma origem externa foi usada.

## Regra de arredondamento (aprovada pelo responsável em 2026-09-30)

Os arquivos trazem valores decimais; o banco armazena inteiros (`bigint`). Para cada valor
não nulo, a regra é dígito a dígito, da esquerda para a direita, a partir da 1ª casa decimal:

- dígito ≤ 4 → arredonda **para baixo** e encerra;
- dígito ≥ 6 → arredonda **para cima** e encerra;
- dígito = 5 → **não decide**, avalia a próxima casa decimal com o mesmo teste (recursivo);
- se todas as casas restantes forem 5 (ou não houver mais casas), arredonda para baixo.

Exemplos: `3,49 → 3`; `3,5 → 3`; `3,55 → 3`; `3,556 → 4`; `3,58 → 4`; `3,6 → 4`.

**Valor ausente permanece NULL.** Ausência nunca é convertida em zero.

Esta regra difere do arredondamento padrão (`val + 0,5`) e é a única válida para esta base.

## `populacao_renda_faixa_etaria_cep5`

- Chave lógica composta: `UNIQUE (cep5, municipio)`. **Nunca cruzar por `cep5` isolado** —
  9 CEP5 pertencem a mais de um município (`11770`, `17455`, `36490`, `44865`, `45263`,
  `45265`, `46110`, `65935`, `78470`).
- O par `(cep5, municipio)` foi obtido por correspondência posicional 1:1 com
  `public.densidade_demografica_cep5` (mesma ordem, mesmos CEP5 linha a linha, **0
  divergências** na conferência). A planilha não traz o município.
- Indicadores: `camada_total` + 8 classes de renda (`a_pp`, `a_p`, `b1`, `b2`, `c1`, `c2`,
  `d`, `e`) × 3 faixas escolares (`ate_4`, `5_14`, `15_19`) = 24 colunas.
- Carregado: 24.905 linhas, 24.896 CEP5 distintos, 5.297 municípios distintos.
- Soma conferida: `camada_total` = 218.134.982 (46 nulos).

## `populacao_renda_faixa_etaria_municipio`

- Chave: `cod_municipal` (PK), FK para `public.dim_municipio.cod_municipal`.
- Indicadores: 8 classes de renda × 10 colunas (`total`, `ate_4`, `5_14`, `15_19`, `20_24`,
  `25_34`, `35_44`, `45_49`, `50_59`, `60_mais`) = 80 colunas.
- Carregado: 5.571 linhas, 5.571 códigos distintos (cobertura 1:1 com a DTB 2025).

### Correção de origem — 273 códigos IBGE errados na planilha

A planilha de origem trazia 5.571 linhas, mas apenas 5.298 códigos IBGE distintos: 273 linhas
tinham o código de um município **homônimo** (erro de PROCV na origem). Exemplo: a linha de
Presidente Médici/MA (`2109239`) trazia o código de Presidente Médici/RO (`1100254`).

Reconstrução aplicada e verificada:

1. A planilha está em ordem crescente de código IBGE, idêntica à ordem de `dim_municipio`.
2. As 5.298 linhas corretas batem **posicionalmente** com `dim_municipio`, sem lacuna.
3. Cada uma das 273 divergências é um par de homônimos confirmado nome a nome contra a DTB
   (Bom Jesus do Tocantins PA/TO, Pau D'Arco PA/TO, Araguanã TO/MA, Iracema RR/CE, etc.).

O código gravado é o da posição correspondente em `dim_municipio`, não o da planilha.
Esta é uma reconciliação documentada, não um dado de origem.

## Acesso

RLS habilitado **sem policy permissiva**; `anon` e `authenticated` sem qualquer privilégio.
Leitura somente por backend controlado / `service_role`. Nenhuma API expõe estes dados.

## Regras de uso

- Não somar agregado com subdivisão. Em `..._municipio`, `pop_renda_<classe>_total` já contém
  as faixas etárias da mesma classe.
- Cruzamento com escolas sempre por `LEFT JOIN`; território ausente mantém a escola com
  indicadores nulos. Nunca substituir ausência por zero nem buscar o CEP5 em outro município.
- Não agregar indicadores territoriais depois do JOIN com escolas (o JOIN duplica linhas).
- As duas tabelas são recortes independentes: não somar CEP5 com Município.
