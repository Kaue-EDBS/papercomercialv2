# Contrato de dados — Adoções 2026 (V2)

- **Status:** vigente
- **Carregado em:** 2026-09-29
- **Migration:** `database/v2/0014_adocoes_2026_v2.sql`
- **Tabelas:** `public.adocao_escolas`, `public.adocao_materias`, `public.fato_adocao`,
  `public.dim_obra_literaria`, `public.fato_adocao_literatura`

## 1. Origem

Quatro pacotes normalizados v2, todos com a chave canônica `CD_ESCOLA`:

| Pacote | Arquivo fonte declarado | Escolas | Fatos |
|---|---|---:|---:|
| Didático e Apoio | `Didatico e Apoio(3).xlsx`, aba `Export` | 4.511 | 23.187 |
| Material Próprio | `Material Proprio(3).xlsx`, aba `Export` | 1.150 | 9.761 |
| Sistema de Ensino | `MONITORAR/DEFENDER/CUIDAR/ATACAR.xlsx` | — | 184.830 |
| Literatura | `Literatura(20260908-150045).xlsx`, aba `Export` | 1.903 | 23.154 |
| **Total consolidado** | — | **15.612 únicas** | **240.932** |

Todos os fatos são do ano **2026**. Nenhum outro ano está carregado.

## 2. Princípio do modelo

**Uma adoção é uma linha.** O modelo horizontal anterior (até 600 colunas por escola)
foi substituído por fato + dimensões. A visão "escola com todas as suas adoções" é
montada por consulta, nunca por colunas físicas.

## 3. Chave e relacionamento

- `"CD_ESCOLA"` é **TEXT**, entre aspas duplas no PostgreSQL para preservar a caixa alta.
- Relacionamento com a base central: `public.escola_protheus.cd_escola`.
- **15.245 das 15.612** escolas das adoções (97,6%) casam com a setorização 2026;
  as 367 restantes não têm cadastro Protheus correspondente e devem aparecer como
  ausentes, nunca como zero.
- Sempre `LEFT JOIN`; escola sem adoção permanece na listagem sem fatos.

```sql
SELECT p.cod_protheus, f.tipo_material, f.materia, f.grupo_editorial_atual, f.qt_adocoes_ano_atual
FROM public.escola_protheus p
LEFT JOIN public.fato_adocao f ON f."CD_ESCOLA" = p.cd_escola AND f.ano = 2026;
```

**Nunca** cruzar adoções por nome de escola, município ou CNPJ — apenas por `CD_ESCOLA`.

## 4. Estrutura

### `adocao_escolas` (15.612)
`"CD_ESCOLA"` (PK), `escola`, `municipio`, `uf`, `regiao`.
Dimensão compartilhada pelos quatro pacotes. Em 49 casos o mesmo código veio com
grafia levemente diferente entre pacotes (acento ou espaço duplo); prevalece a
primeira ocorrência na ordem Didático/Apoio → Material Próprio → Sistema de Ensino →
Literatura. Nenhum conflito de identidade real foi observado.

### `adocao_materias` (39)
`materia` (PK), `familia_materia`, `familia_materia_label`, `ordem_familia`.
Catálogo unificado. `familia_materia` restrita a `INTEGRADAS`, `CIENCIAS_NATUREZA`,
`CIENCIAS_HUMANAS`, `MATEMATICA`, `LINGUAGENS`, `OUTROS`, `MULTIDISCIPLINAR`.

### `fato_adocao` (217.778)
`chave_adocao` (PK), `"CD_ESCOLA"` (FK), `ano`, `segmento`, `tipo_material`, `materia` (FK),
`colecao_anterior`, `grupo_editorial_anterior`, `qt_adocoes_ano_anterior`,
`colecao_atual`, `grupo_editorial_atual`, `qt_adocoes_ano_atual`,
`qt_anos_adocao_colecao`, `estrategia`, `tempo_contrato_sistema_ensino`.

| `tipo_material` | Linhas |
|---|---:|
| `SISTEMA_ENSINO` | 184.830 |
| `DIDATICO` | 16.931 |
| `MATERIAL_PROPRIO` | 9.761 |
| `APOIO` | 6.256 |

`tempo_contrato_sistema_ensino` é exclusivo de `SISTEMA_ENSINO`; **nulo** nos demais.
`estrategia` assume `MONITORAR`, `DEFENDER`, `CUIDAR` e `ATACAR`.

### `dim_obra_literaria` (6.323) e `fato_adocao_literatura` (23.154)
Literatura tem a **obra/título vinculada ao grupo editorial** como unidade analítica,
por isso vive em fato próprio. `obra_atual_id` é obrigatório; `obra_anterior_id` é nulo
quando a obra é nova na escola. `status_identificacao` observado: `COMPLETA` e
`GRUPO_EDITORIAL_APENAS`.

## 5. Regras de uso

1. **Não somar `fato_adocao` com `fato_adocao_literatura`** — são unidades diferentes
   (coleção por matéria × obra literária). Totalizar cada um no seu próprio contexto.
2. **Não agregar quantidade após juntar com a setorização** — uma escola tem várias
   linhas de adoção; o JOIN duplica qualquer indicador da escola.
3. `qt_adocoes_ano_anterior` e `qt_adocoes_ano_atual` são exemplares, não escolas.
4. Concorrência se lê por `grupo_editorial_atual`; `MATERIAL PROPRIO` aparece como
   grupo editorial nas linhas de Material Próprio e **não** é um concorrente.
5. Escola sem adoção de um tipo não significa zero adoções — significa ausência do
   registro naquela exportação.

## 6. Segurança

- RLS **habilitada** nas cinco tabelas, sem policy permissiva.
- `PUBLIC`, `anon` e `authenticated` **sem privilégio algum**.
- Acesso exclusivo do `service_role` / backend controlado. Nenhuma API expõe estes
  dados a terceiros.

## 7. Validações executadas na carga

| Verificação | Resultado |
|---|---|
| Linhas carregadas | 15.612 / 39 / 217.778 / 6.323 / 23.154 |
| Chaves de adoção duplicadas | 0 |
| Fatos órfãos de escola ou matéria | 0 |
| Fatos de literatura órfãos de obra | 0 |
| Didático+Apoio — total ano anterior | 1.940.045 = manifesto |
| Didático+Apoio — total ano atual | 2.120.278 = manifesto |
| Sistema de Ensino — total ano atual | 20.437.895 = manifesto |
| Escolas casadas com `escola_protheus` | 15.245 de 15.612 (97,6%) |

## 8. Ressalva registrada na auditoria de origem

O pacote de Sistema de Ensino declara classificação **"conforme com ressalvas de
cobertura e granularidade"**: o recorte-mãe `Sistema de Ensino(2).xlsx` estava truncado
na exportação, e a reconstrução pelos quatro arquivos de estratégia diverge dele em
49 linhas e em 80 unidades no total do ano anterior (19.018.567 no pacote contra
19.018.487 no recorte). Nenhum registro foi descartado para forçar igualdade com a
exportação truncada.
