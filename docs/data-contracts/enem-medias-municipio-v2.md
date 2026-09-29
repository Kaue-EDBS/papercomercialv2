# Contrato de dados — ENEM: médias por município (V2)

- **Status:** vigente
- **Carregado em:** 2026-09-29
- **Migration:** `database/v2/0013_enem_medias_municipio_v2.sql`
- **Tabela:** `public.enem_medias_municipio`

## 1. Origem

Pacotes v2.0 por edição, gerados a partir dos microdados oficiais do INEP:

| Edição | Arquivo de origem declarado | Municípios | Participantes |
|---|---|---:|---:|
| 2022 | `MICRODADOS_ENEM_2022.csv` | 1.747 | 3.476.105 |
| 2023 | `MICRODADOS_ENEM_2023.csv` | 1.750 | 3.933.955 |
| 2024 | `RESULTADOS_2024.csv` | 1.753 | 4.332.944 |
| **Total** | — | **5.250 linhas** | — |

Edições anteriores a 2022 e a edição 2025 **não** estão carregadas nesta tabela.

## 2. Unidade de análise

Uma linha = **um município de aplicação da prova em um ano**.

O agrupamento usa `CO_MUNICIPIO_PROVA` / `NO_MUNICIPIO_PROVA` / `SG_UF_PROVA`. O campo
`CO_MUNICIPIO_ESC` (município da escola) **não** foi usado. Portanto os indicadores
caracterizam o resultado no **local de aplicação**; não são médias dos moradores,
nem das escolas, nem da rede privada do município.

Não houve filtro de dependência administrativa, presença ou situação de redação.

## 3. Chave e relacionamento

- **Chave primária composta:** `(ano, "COD MUNICIPIO")`.
- `"COD MUNICIPIO"` é **texto de 7 dígitos** (código IBGE), com `CHECK '^[0-9]{7}$'`.
- **FK:** `"COD MUNICIPIO"` → `public.dim_municipio(cod_municipal)` — a dimensão
  municipal canônica única do CIT (DTB 2025). Os 1.757 municípios distintos da série
  são todos válidos nessa dimensão.
- O cruzamento com a setorização é **N:1 depois de fixar o ano**: uma carteira tem
  várias escolas no mesmo município.

```sql
SELECT e.escola_id, e.nome_escola, m.media_linguagens, m.media_matematica
FROM public.dim_escola e
LEFT JOIN public.enem_medias_municipio m
  ON m."COD MUNICIPIO" = e.cod_municipio
 AND m.ano = 2024;
```

**Regras obrigatórias de uso:**

1. Sempre filtrar o `ano`. Sem ele, cada escola casa com 3 linhas da série.
2. Sempre `LEFT JOIN`. Município sem aplicação de prova permanece **nulo**, nunca zero.
3. Nunca somar ou tirar média dos indicadores municipais após o JOIN com escolas —
   o valor se repete por escola e o agregado fica inflado.
4. `COD_INEP` identifica escola e **não** substitui o código municipal.
5. O nome `municipio` é descritivo; **não** é chave de cruzamento.

## 4. Campos (25 + controle)

| Campo | Tipo | Significado |
|---|---|---|
| `ano` | smallint | Edição do exame |
| `COD MUNICIPIO` | text(7) | Código IBGE do município de aplicação |
| `municipio` | text | Nome descritivo |
| `uf` | char(2) | UF de aplicação |
| `participantes_total` | integer | Linhas de inscrição no município, inclusive sem notas |
| `media_ciencias_natureza` / `n_ciencias_natureza` | numeric(7,2) / integer | `NU_NOTA_CN` |
| `media_ciencias_humanas` / `n_ciencias_humanas` | numeric(7,2) / integer | `NU_NOTA_CH` |
| `media_linguagens` / `n_linguagens` | numeric(7,2) / integer | `NU_NOTA_LC` |
| `media_matematica` / `n_matematica` | numeric(7,2) / integer | `NU_NOTA_MT` |
| `media_redacao_comp1..5` / `n_redacao_comp1..5` | numeric(7,2) / integer | `NU_NOTA_COMP1..5` |
| `media_redacao_final` / `n_redacao_final` | numeric(7,2) / integer | `NU_NOTA_REDACAO` |
| `carregado_em` | timestamptz | Controle de carga |

## 5. Regra de cálculo

Para cada município e indicador:
**média = soma das notas numéricas preenchidas ÷ quantidade dessas notas.**

- Células vazias não entram na soma nem no denominador.
- Zero **entra** na soma e no denominador.
- Cada indicador tem seu próprio denominador `n_*`. **Nunca** dividir a soma de notas
  por `participantes_total`.
- Somas acumuladas em centésimos inteiros; arredondamento só no resultado final,
  2 casas, `ROUND_HALF_UP`.
- `media_redacao_final` vem da média de `NU_NOTA_REDACAO` — **não** é a soma das cinco
  médias de competência já arredondadas (divergência máxima observada: 0,02 ponto).

## 6. Segurança

- RLS **habilitada** sem policy permissiva.
- `PUBLIC`, `anon` e `authenticated` **sem privilégio algum**.
- Acesso exclusivo do `service_role` / backend controlado. Nenhuma API expõe estes
  dados a terceiros.

## 7. Validações executadas na carga

| Verificação | Resultado |
|---|---|
| Linhas carregadas | 5.250 (2022: 1.747, 2023: 1.750, 2024: 1.753) |
| Participantes 2022 vs README | 3.476.105 = 3.476.105 |
| Códigos municipais com 7 dígitos | 100% |
| Órfãos contra `dim_municipio` | 0 (FK aceita na carga) |
| Escolas da setorização com ENEM 2024 no município | 31.789 de 33.924 (93,7%) |

## 8. Pendências

- A edição **2025** existe no ambiente em formato de colunas diferente
  (`codigo_municipio`, `media_cn`, `media_redacao`) e ainda **não** foi harmonizada
  nem carregada.
- Não houve autenticação externa da publicação do INEP nem certificação de
  completude nacional; a cobertura é a observada nos arquivos recebidos.
