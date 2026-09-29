# Contrato de dados — Censo Escolar (escolas privadas ativas) 2022–2025 V2

- Status: aplicado no PRIMARY em 2026-09-29
- DDL: `database/v2/0011_censo_escolar_v2.sql`
- Tabela: `public.censo_escolas_privadas_ativas`

## Origem

Pacotes auditados enviados pelo responsável (uploads do projeto):

| Ano | Pacote | Linhas | SHA-256 do CSV (prefixo) |
|-----|--------|--------|---------------------------|
| 2022 | `censo_escolas_privadas_ativas_2022_pacote_harmonizado.zip` | 45.977 | `b8e55b43627474e4` |
| 2023 | `censo_escolas_privadas_ativas_2023_pacote_harmonizado.zip` | 42.316 | `443db60adbc6bd4f` |
| 2024 | `censo_escolas_privadas_ativas_2024_pacote_harmonizado.zip` | 43.218 | `65da8d9f6c064ecf` |
| 2025 | `censo_escolas_privadas_ativas_2025_pacote_V2.zip` | 42.454 | `570250da1dd1209b` |

Total carregado: **173.965 linhas**. Todos os CSVs conferidos contra o `manifesto_sha256.json` de cada pacote
(igualdade exata). O ZIP de 2022 chegou truncado no final da transmissão (JSON auxiliar cortado); o CSV de dados
foi recuperado por leitura sequencial dos headers locais e validado pelo SHA-256 oficial.

Filtros de origem preservados: `CO_REDE = 2` (privada) e `TP_SITUACAO_FUNCIONAMENTO = 1` (em atividade).
Verificado no banco: 0 linhas fora desse filtro.

## Estrutura

- 125 colunas idênticas e na mesma ordem nos quatro anos (harmonização feita na origem), mais `carregado_em`.
- Chave primária composta `(nu_ano_censo, cod_inep)`.
- `cod_inep`: **texto de 8 dígitos** (`LPAD(...,8,'0')`), com CHECK `^[0-9]{8}$`. É a chave de cruzamento
  com `public.dim_escola.cod_inep`. Não usar município, CEP ou nome da escola como chave alternativa.
- `co_municipio`: texto de 7 dígitos (IBGE), FK para `public.dim_municipio.cod_municipal` — dimensão municipal
  canônica única do CIT. Verificado: 0 órfãos, 3.462 municípios distintos.
- Demais colunas: `integer` (indicadores `IN_*`, quantidades `QT_*`, tipologias `TP_*`), exceto
  `no_municipio` e `no_entidade` (texto).
- Índices: `cod_inep`, `co_municipio`, `nu_ano_censo`.

## Segurança

- RLS habilitada **sem policy permissiva**.
- `anon` e `authenticated` sem nenhum privilégio (REVOKE ALL). `service_role` com acesso total.
- Leitura exclusivamente por backend controlado. Nenhuma API de fornecimento de dados a terceiros.
- O papel de carga `sandbox_exec` recebeu privilégio temporário apenas durante o COPY e foi revogado em seguida.

## Validações executadas (2026-09-29)

| Verificação | Resultado |
|---|---|
| Total de linhas | 173.965 |
| Por ano | 2022: 45.977 · 2023: 42.316 · 2024: 43.218 · 2025: 42.454 |
| Linhas fora do filtro rede/situação | 0 |
| Municípios órfãos vs. `dim_municipio` | 0 |
| INEPs distintos com correspondência em `dim_escola` | 31.374 |

## Observações abertas

- 31.374 INEPs do Censo casam com `dim_escola`; o restante corresponde a escolas privadas fora da setorização
  comercial (mercado potencial) e a cadastros Protheus sem INEP. Não é erro de carga.
- Arquivos auxiliares dos pacotes (matriz de comparabilidade, presença entre anos, dicionários) não foram
  carregados; permanecem como material de auditoria da origem.
