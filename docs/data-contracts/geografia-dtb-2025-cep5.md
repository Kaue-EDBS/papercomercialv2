# Contrato de dados — Geografia DTB 2025 + CEP5

> Status: **HOMOLOGADO — DTB + CEP5 CONCLUÍDOS E RECONCILIADOS**  
> Definido em: **2026-09-15**  
> Homologação da carga CEP5: **2026-09-15**

## 1. Papel

A geografia é o primeiro domínio de negócio reconstruído do Paper Comercial V2.

O núcleo administrativo é baseado diretamente no **IBGE — Divisão Territorial Brasileira (DTB) 2025**, a partir do arquivo original auditado para este projeto, e acrescenta o `CEP5` como dimensão territorial operacional de primeira classe.

O CEP5 terá papel central nas funcionalidades futuras de:

- busca/contextualização de concorrentes;
- leitura de dados demográficos em granularidade inferior ao município;
- relacionamento territorial de escolas e demais entidades quando houver município + CEP5 disponíveis.

Este contrato define a estrutura territorial e suas regras de integridade. Ele **não define ainda fórmulas de concorrência, raio, ranking, market share ou agregação demográfica**.

## 2. Fontes da verdade

### DTB 2025

Fonte canônica: **IBGE — DTB 2025**.  
Arquivo auditado no Paper: `COD_MUNICIPAL.zip`  
SHA-256: `a5947915a7213cddde00682a51d0734ea6b6ec2307d237d1e7937edde6766b99`

Conteúdo utilizado:

- municípios;
- distritos;
- subdistritos;
- arquivo informativo de unidades novas/extintas apenas como evidência documental.

### CEP5

Arquivo: `CEP5.xlsx`  
Aba: `Resultados`  
SHA-256: `74ad34907a4ee418ededa872d3530cc11ae89270ed666331a6879ea72cb8cf13`

Colunas da fonte:

- `CEP5`;
- `Município`;
- `Estado`.

## 3. Modelo territorial

O CEP5 não é distrito, subdistrito nem divisão administrativa do IBGE. Ele constitui uma ramificação operacional própria abaixo do município.

```text
UF
 -> Região Geográfica Intermediária
    -> Região Geográfica Imediata
       -> Município
          ├─ Distrito
          │  └─ Subdistrito
          └─ CEP5
```

## 4. Chaves canônicas

### Município

`COD_MUNICIPAL`

- código municipal oficial completo de 7 dígitos;
- armazenado como `text`;
- PK de `dim_municipio`;
- nomes nunca são chave definitiva;
- UF não substitui `COD_MUNICIPAL`.

### CEP5

O `CEP5` **não é globalmente único**.

A identidade territorial fina é:

```text
(COD_MUNICIPAL, CEP5)
```

Essa combinação é a PK de `dim_cep5`.

Regra obrigatória:

- quando `COD_MUNICIPAL` estiver conhecido, consultas territoriais devem preferir `COD_MUNICIPAL + CEP5`;
- consulta apenas por CEP5 pode retornar mais de um município;
- a aplicação nunca deve escolher silenciosamente um município em CEP5 compartilhado.

## 5. Estrutura persistente

### `dim_municipio`

Campos principais:

- `cod_municipal` — PK, 7 dígitos;
- `municipio`;
- `cod_uf`;
- `nome_uf`;
- `cod_regiao_intermediaria`;
- `regiao_intermediaria`;
- `cod_regiao_imediata`;
- `regiao_imediata`;
- `cod_municipio_dtb`;
- `ano_dtb`;
- `data_base_dtb`;
- `ativo`;
- `carga_id`;
- `atualizado_em`.

### `dim_distrito`

- PK `cod_distrito`, 9 dígitos;
- FK `cod_municipal`;
- `left(cod_distrito, 7) = cod_municipal`.

### `dim_subdistrito`

- PK `cod_subdistrito`, 11 dígitos;
- FK `cod_distrito`;
- FK `cod_municipal`;
- `left(cod_subdistrito, 9) = cod_distrito`;
- `left(cod_subdistrito, 7) = cod_municipal`.

### `dim_cep5`

Grão: uma associação válida entre um município canônico e um CEP5.

Campos:

- `cod_municipal` — FK e parte da PK;
- `cep5` — `text`, 5 dígitos e parte da PK;
- `municipio_origem`;
- `uf_origem`;
- `metodo_resolucao` — `EXATO` ou `ALIAS_HOMOLOGADO`;
- `ativo`;
- `carga_id`;
- `atualizado_em`.

Não existe `unique(cep5)`.

## 6. Aliases homologados do CEP5

A resolução nominal é explícita, sem fuzzy matching:

| Fonte | UF | Município canônico DTB 2025 | COD_MUNICIPAL | Método |
|---|---|---|---|---|
| `São Luiz` | RR | `São Luiz do Anauá` | `1400605` | `ALIAS_HOMOLOGADO` |
| `Arês` | RN | `Arez` | `2401206` | `ALIAS_HOMOLOGADO` |
| `Açu` | RN | `Assú` | `2400208` | `ALIAS_HOMOLOGADO` |

Todos os demais pares Município + UF foram resolvidos por igualdade exata com a dimensão canônica do Paper.

## 7. Município DTB sem CEP5 na fonte

`Boa Esperança do Norte/MT` (`5101837`) existe na DTB 2025 e não aparece no `CEP5.xlsx` recebido.

Isso não remove nem inativa o município em `dim_municipio`.

Cobertura homologada:

```text
5.570 municípios com CEP5 / 5.571 municípios DTB 2025
```

## 8. CEP5 compartilhados

Há 9 CEP5 associados a mais de um município, todos válidos:

| CEP5 | Municípios |
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

## 9. Estado homologado — DTB 2025

Contagens:

- 5.571 municípios;
- 10.751 distritos;
- 646 subdistritos;
- 27 UFs;
- 133 Regiões Geográficas Intermediárias;
- 510 Regiões Geográficas Imediatas.

Qualidade:

- 0 PK duplicada;
- 0 FK inválida;
- 0 inconsistência de prefixo hierárquico.

Checksums PRIMARY = REPLICA:

- município: `4665954435fe358572621d23847ac833`;
- distrito: `82deeb72775cc53ef362bca04834571a`;
- subdistrito: `9bf7f178c76829051084ef9c6702a19b`.

Carga `geografia_dtb_2025`: **concluída**.

## 10. Estado homologado — CEP5

Auditoria e carga final:

- 24.905 associações recebidas e gravadas;
- 24.905 PKs compostas únicas;
- 24.896 CEP5 distintos;
- 5.570 municípios cobertos;
- 248 CEP5 iniciam com zero, preservados por tipo `text`;
- 3 aliases homologados;
- 9 CEP5 compartilhados;
- 0 nulos críticos;
- 0 CEP5 fora do formato de 5 dígitos;
- 0 FK inválida;
- 0 resolução fuzzy automática.

Checksum determinístico PRIMARY = REPLICA:

`09737a6c95f08c920532a2baadbf411e`

Carga `geografia_cep5`: **concluída**.

## 11. Replicação

Tabelas do domínio:

- `dim_municipio`;
- `dim_distrito`;
- `dim_subdistrito`;
- `dim_cep5`.

Direção oficial:

```text
Lovable Cloud PRIMARY -> Supabase REPLICA
```

A carga CEP5 foi replicada nessa direção e registrada em `audit_replication_runs`.

Paridade homologada exige e atingiu:

- mesma contagem;
- mesmo checksum;
- zero FK inválida.

## 12. Segurança e limpeza técnica

As quatro dimensões são internas por padrão:

- RLS habilitado;
- sem grants diretos para `anon`/`authenticated`;
- consumo apenas por backend/server-side ou interfaces explicitamente autorizadas no futuro.

Todos os objetos temporários usados exclusivamente na ingestão/replicação do CEP5 foram removidos após a validação.

Estado final confirmado:

- PRIMARY: 24.905 linhas em `dim_cep5`, 0 tabelas `tmp_*`, 0 rotinas `tmp_*`;
- REPLICA: 24.905 linhas em `dim_cep5`, 0 tabelas `tmp_*`, 0 rotinas `tmp_*`.

## 13. Edge Functions

**Nenhuma Edge Function funcional foi criada ou homologada neste domínio.**

O domínio geográfico atual é composto por:

- DDL versionado;
- tabelas;
- constraints;
- índices;
- RLS;
- carga;
- QA;
- replicação.

Qualquer Edge Function futura deve nascer de um caso de uso funcional explícito do CIT/Paper, com contrato próprio e versionamento no GitHub.

## 14. Isolamento do domínio

Este contrato é autônomo dentro do Paper Comercial V2.

Nenhum outro projeto, aplicação ou banco constitui fonte, mecanismo de transporte, fallback ou especificação funcional do domínio sem pedido explícito do usuário.

## 15. Uso futuro

Este contrato autoriza o CEP5 como **chave territorial fina** para os próximos contratos de concorrência e demografia.

Ele não autoriza ainda nenhuma regra de seleção de concorrentes ou cálculo demográfico. Essas regras deverão referenciar este contrato e usar `COD_MUNICIPAL + CEP5` quando o contexto municipal estiver disponível.
