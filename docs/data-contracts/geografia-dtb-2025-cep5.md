# Contrato de dados — Geografia DTB 2025 + CEP5

> Status: **CARGAS HOMOLOGADAS; PIPELINE PERMANENTE AINDA PENDENTE**.
> Definição e revisão de evidências: **15/09/2026**.
> Referências: [mapa de engenharia](../architecture/mapa-cit-paper-v2.md) e [snapshot auditado](../testing/cit-paper-snapshot-2026-09-15.json).

## 1. Papel

A geografia é o primeiro domínio de dados reconstruído do CIT/Paper. O núcleo administrativo é baseado na DTB 2025 do IBGE, usando o arquivo original aprovado para este projeto. O CEP5 acrescenta uma referência operacional de relacionamento territorial.

O domínio dará suporte a futuros contratos de concorrência e demografia. Ele não define fórmulas, raio, ranking, market share, geometria ou agregações demográficas. Nenhuma regra comercial antiga é reativada por este contrato.

## 2. Fontes aprovadas

### DTB 2025

Fonte institucional: IBGE — Divisão Territorial Brasileira 2025. Data-base: **31/12/2025**.

Arquivo: `COD_MUNICIPAL.zip`.
SHA-256: `a5947915a7213cddde00682a51d0734ea6b6ec2307d237d1e7937edde6766b99`.

Relatórios utilizados: municípios, distritos e subdistritos. O arquivo de unidades novas/extintas é informativo, não uma dimensão operacional separada.

### CEP5

Fonte aprovada: arquivo fornecido pelo usuário `CEP5.xlsx`, aba `Resultados`.
SHA-256: `74ad34907a4ee418ededa872d3530cc11ae89270ed666331a6879ea72cb8cf13`.

Colunas: `CEP5`, `Município`, `Estado`. Não atribuir a esse arquivo certificação postal externa ou metodologia demográfica não documentada.

## 3. Modelo territorial

```text
UF → Região Intermediária → Região Imediata → Município
                                                ├─ Distrito → Subdistrito
                                                └─ Associação Município + CEP5
```

UF e regiões são atributos de `dim_municipio`, não tabelas físicas separadas. CEP5 é um ramo operacional próprio, não distrito/subdistrito. A hierarquia serve de contexto; não exige que todos os datasets sejam relacionados por todos os níveis.

## 4. Chaves

O cabeçalho lógico municipal é `COD_MUNICIPAL`; o nome físico PostgreSQL é `cod_municipal`. Tipo `text`, sete dígitos, PK de `dim_municipio`. Nomes e UF ajudam na resolução, mas não substituem a chave canônica.

CEP5 é `text`, cinco dígitos. Sua identidade é **`(cod_municipal, cep5)`**. Não existe `unique(cep5)`.

Consulta por CEP5 isolado pode retornar mais de um município. Nunca escolher silenciosamente o primeiro resultado. Quando o município for conhecido, usar a chave composta para obter a associação correta.

## 5. Estrutura persistente

DDL oficial: [`0002_geografia_dtb_2025_cep5.sql`](../../database/v2/0002_geografia_dtb_2025_cep5.sql).

### `dim_municipio` — exatamente 14 colunas

| Campo físico | Tipo | Regra |
|---|---|---|
| `cod_municipal` | text | PK, sete dígitos |
| `municipio` | text | Nome canônico da fonte DTB |
| `cod_uf` | text | Dois dígitos |
| `nome_uf` | text | Nome da UF |
| `cod_regiao_intermediaria` | text | Quatro dígitos |
| `regiao_intermediaria` | text | Nome da região |
| `cod_regiao_imediata` | text | Seis dígitos |
| `regiao_imediata` | text | Nome da região |
| `cod_municipio_dtb` | text | Código interno DTB, cinco dígitos; não é a PK |
| `ano_dtb` | smallint | 2025 nesta carga |
| `data_base_dtb` | date | 2025-12-31 nesta carga |
| `ativo` | boolean | Vigência no snapshot |
| `carga_id` | uuid | FK para `etl_cargas` |
| `atualizado_em` | timestamptz | Metadado técnico |

### `dim_distrito` — 9 colunas

PK `cod_distrito` de nove dígitos; FK `cod_municipal`; `distrito_dtb`; `distrito`; `ano_dtb`; `data_base_dtb`; `ativo`; `carga_id`; `atualizado_em`.

Integridade: `left(cod_distrito, 7) = cod_municipal`.

### `dim_subdistrito` — 10 colunas

PK `cod_subdistrito` de onze dígitos; FKs `cod_distrito` e `cod_municipal`; `subdistrito_dtb`; `subdistrito`; `ano_dtb`; `data_base_dtb`; `ativo`; `carga_id`; `atualizado_em`.

Integridade: `left(cod_subdistrito, 9) = cod_distrito` e `left(cod_subdistrito, 7) = cod_municipal`. Município do subdistrito deve coincidir com o do distrito.

### `dim_cep5` — 8 colunas

Grão: uma associação entre município canônico e CEP5.

| Campo | Regra |
|---|---|
| `cod_municipal` | FK e parte da PK |
| `cep5` | Texto de cinco dígitos e parte da PK |
| `municipio_origem` | Texto literal da fonte CEP5 |
| `uf_origem` | Sigla literal da UF da fonte |
| `metodo_resolucao` | `EXATO` ou `ALIAS_HOMOLOGADO` |
| `ativo` | Associação vigente na carga |
| `carga_id` | FK para `etl_cargas` |
| `atualizado_em` | Metadado técnico |

## 6. Aliases tratados nesta carga

| Origem | UF | Nome canônico | COD_MUNICIPAL |
|---|---|---|---|
| São Luiz | RR | São Luiz do Anauá | `1400605` |
| Arês | RN | Arez | `2401206` |
| Açu | RN | Assú | `2400208` |

As três linhas foram registradas como `ALIAS_HOMOLOGADO`, sem fuzzy automático. As demais foram resolvidas por correspondência exata. O tratamento não cria um catálogo reutilizável de exceções: essa tabela/serviço ainda não existe na V2.

## 7. Cobertura e compartilhamento

`5101837` — Boa Esperança do Norte/MT — existe na DTB e não aparece na fonte CEP5. Continua válido e ativo; ausência de cobertura não é erro de identidade municipal.

| CEP5 compartilhado | Municípios na fonte |
|---|---|
| `11770` | Itariri/SP; Peruíbe/SP |
| `17455` | Fernão/SP; Gália/SP |
| `36490` | Ouro Branco/MG; Piranga/MG |
| `44865` | Irecê/BA; Morro do Chapéu/BA |
| `45263` | Bom Jesus da Serra/BA; Poções/BA |
| `45265` | Caetanos/BA; Poções/BA |
| `46110` | Brumado/BA; Malhada de Pedras/BA |
| `65935` | Buritirana/MA; Senador La Rocque/MA |
| `78470` | Nobres/MT; Rosário Oeste/MT |

Essas associações foram preservadas conforme a fonte aprovada e justificam a PK composta. Não interpretar o compartilhamento como confirmação de polígono, distância ou relação comercial.

## 8. Resultado das cargas

| Dimensão | PRIMARY | REPLICA |
|---|---:|---:|
| `dim_municipio` | 5.571 | 5.571 |
| `dim_distrito` | 10.751 | 10.751 |
| `dim_subdistrito` | 646 | 646 |
| `dim_cep5` | 24.905 | 24.905 |

DTB: 27 UFs, 133 regiões intermediárias, 510 regiões imediatas; PKs únicas; checks de FK e prefixos sem falhas.

CEP5: 24.905 associações, 24.896 prefixos distintos, 5.570 municípios cobertos, nove prefixos compartilhados, três aliases e zero falhas nos checks de formato/FK/nulos críticos.

**Correção documental:** existem **4.495 registros e 4.495 CEP5 distintos iniciados por zero**, não 248. Esse número foi conferido no XLSX original, no CSV normalizado e em ambos os bancos em 15/09/2026. Os dados já estavam preservados como texto; nenhuma correção de conteúdo foi necessária.

## 9. Evidência e checksum

As cargas `geografia_dtb_2025` e `geografia_cep5` estão concluídas nos dois bancos. Nesta auditoria os originais foram normalizados novamente e comparados aos CSVs; o conteúdo coincidiu com PRIMARY e REPLICA.

O protocolo `sha256-json-array-lines-v1` usa arrays JSON de colunas de negócio, ordenados por PK, separados por LF sem LF final, em UTF-8. `carga_id` e `atualizado_em` são excluídos desse checksum e devem ser verificados separadamente.

| Tabela | SHA-256 idêntico nas três representações |
|---|---|
| `dim_municipio` | `44b2d93b700d03b11ddb81ca1688b2d2f599e7eeffef2d6b3ab2cb2fd57d70f3` |
| `dim_distrito` | `5e3bfea56b4c8b82ca6f8a92f8ecd9f82ac4bfacc7c5825a8d5fdd5284dc3679` |
| `dim_subdistrito` | `2c9aeef8a0df9882883ae042decea8cf799d7b0e516292c30fc44b0ec83d981a` |
| `dim_cep5` | `346285b67463ee58bd2e27f30d46e59281cb9c6ef095c3d5e4389e5f7d884b56` |

Os MD5 históricos das cargas são preservados no snapshot de evidências. Não misturar algoritmos/protocolos nem alterar eventos passados para aparentar outra metodologia.

Consulta: [`geografia_snapshot_readonly.sql`](../../database/validation/geografia_snapshot_readonly.sql).

## 10. Replicação: escopo comprovado

A cópia geográfica foi executada e reconciliada pontualmente no sentido PRIMARY → REPLICA. **Ainda não existe serviço genérico permanente de replicação/reconciliação homologado.**

Há um evento CEP5 em `audit_replication_runs` no PRIMARY e nenhum evento na REPLICA. Não existem runs individuais DTB nessa tabela. Portanto, a paridade comprovada é do conteúdo geográfico, não da trilha de auditoria ou de todo o banco.

A política futura de espelhar logs/metadados deve ser explicitada. Backfill posterior não deve ser apresentado como evento histórico original.

## 11. Segurança e serviços

As dimensões possuem RLS ativo e não concedem privilégios efetivos de tabela a `anon`/`authenticated` no snapshot. Os helpers temporários de ingestão foram removidos do escopo auditado. A extensão HTTP continua no PRIMARY e sua necessidade será revista em etapa própria.

Não há serviço V2 versionado/homologado de validação municipal, staging ou revisão manual. A REPLICA possui zero Edge Functions; o catálogo administrativo completo do PRIMARY gerenciado não foi verificado independentemente.

A homologação da carga não deve ser interpretada como teste E2E de uma interface de importação ainda inexistente.

## 12. Critérios para evolução

Preservar unicidade de PK, formatos textuais, integridade hierárquica, linhagem, cobertura explicitada e paridade por conteúdo. Contagens deste documento são propriedades do snapshot aprovado, não constantes universais de cargas futuras.

Para futuros datasets, a validação referencial considera as linhas recebidas; não exige cobertura nacional. Resolução por Município + UF deve ser inequívoca; fuzzy somente sugere; conflito entre código válido e nome/UF deve ter tratamento definido e auditado.

CEP5 não deve ser inventado, corrigido por proximidade numérica ou usado isoladamente para escolher município em casos compartilhados.

## 13. Isolamento e uso futuro

O domínio é autônomo no CIT/Paper. Fontes, bancos e contratos de outro projeto não podem substituir esta linhagem sem pedido explícito.

As regras exatas de concorrência e demografia serão definidas em contratos próprios. Este contrato fornece identidade territorial; não oferece seleção de concorrentes, ranking, raio ou estimativa demográfica pronta.
