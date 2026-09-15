# Contrato de dados — Geografia DTB 2025 + CEP5

> Status: **ATIVO PARA ESTRUTURA / CARGA PENDENTE**  
> Definido em: **2026-09-15**

## 1. Papel

A geografia é o primeiro domínio de negócio reconstruído do Paper Comercial V2.

O núcleo administrativo replica a geografia canônica validada no PEM, baseada no **IBGE — Divisão Territorial Brasileira (DTB) 2025**, e acrescenta o `CEP5` como dimensão territorial operacional de primeira classe.

O CEP5 terá papel central nas funcionalidades futuras de:

- busca/contextualização de concorrentes;
- leitura de dados demográficos em granularidade inferior ao município;
- relacionamento territorial de escolas e demais entidades quando houver município + CEP5 disponíveis.

Este contrato define apenas a estrutura territorial e as regras de integridade. Ele **não define ainda fórmulas de concorrência, raio, ranking, market share ou agregação demográfica**.

## 2. Fonte da verdade administrativa

Fonte canônica: **IBGE — DTB 2025**.  
Data-base utilizada: **2025-12-31**.

Arquivos de referência da publicação:

- `RELATORIO_DTB_BRASIL_2025_MUNICIPIOS`;
- `RELATORIO_DTB_BRASIL_2025_DISTRITOS`;
- `RELATORIO_DTB_BRASIL_2025_SUBDISTRITOS`;
- pacote oficial `DTB_2025.zip`.

O Paper Comercial deve reproduzir a mesma geografia homologada no PEM:

- 5.571 municípios;
- 27 UFs;
- 133 Regiões Geográficas Intermediárias;
- 510 Regiões Geográficas Imediatas;
- 10.751 distritos;
- 646 subdistritos.

As contagens acima são propriedades do snapshot DTB 2025, não regras hard-coded para futuras versões.

## 3. Fonte do CEP5

Arquivo recebido: `CEP5.xlsx`  
Aba: `Resultados`

Colunas da fonte:

- `CEP5`;
- `Município`;
- `Estado`.

SHA-256 do arquivo auditado:

`74ad34907a4ee418ededa872d3530cc11ae89270ed666331a6879ea72cb8cf13`

Auditoria da fonte:

- 24.905 linhas de dados;
- 24.905 combinações exatas únicas `CEP5 + Município + Estado`;
- 24.896 valores distintos de CEP5;
- 5.570 pares distintos Município + UF;
- 27 UFs;
- 0 nulos nos três campos;
- 100% dos CEP5 com exatamente 5 dígitos;
- 248 CEP5 iniciam com zero, portanto `CEP5` é obrigatoriamente `text`;
- 9 CEP5 são compartilhados por dois municípios.

## 4. Modelo territorial

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

## 5. Chave canônica municipal

`COD_MUNICIPAL`

Regras:

- código municipal oficial completo de 7 dígitos;
- armazenado como `text`;
- PK de `dim_municipio`;
- nomes nunca são chave definitiva;
- UF não substitui `COD_MUNICIPAL`;
- a verdade nominal de município/UF é a DTB 2025.

## 6. Chave canônica do CEP5

O `CEP5` **não é globalmente único**.

A identidade de uma associação territorial CEP5 é:

```text
(COD_MUNICIPAL, CEP5)
```

Essa combinação é a PK de `dim_cep5`.

Regra obrigatória para aplicações futuras:

- quando `COD_MUNICIPAL` estiver conhecido, consultas territoriais devem preferir `COD_MUNICIPAL + CEP5`;
- consulta apenas por `CEP5` é permitida, mas pode retornar mais de um município;
- a aplicação nunca pode escolher silenciosamente um município quando o mesmo CEP5 estiver associado a mais de um.

## 7. `dim_municipio`

Repete o contrato vigente do PEM:

| Campo | Tipo | Regra |
|---|---|---|
| `cod_municipal` | text | PK, 7 dígitos |
| `municipio` | text | nome oficial IBGE |
| `cod_uf` | text | 2 dígitos |
| `nome_uf` | text | nome oficial da UF |
| `cod_regiao_intermediaria` | text | 4 dígitos |
| `regiao_intermediaria` | text | nome oficial |
| `cod_regiao_imediata` | text | 6 dígitos |
| `regiao_imediata` | text | nome oficial |
| `cod_municipio_dtb` | text | código interno DTB, 5 dígitos |
| `ano_dtb` | smallint | 2025 na carga inicial |
| `data_base_dtb` | date | 2025-12-31 na carga inicial |
| `ativo` | boolean | vigência no snapshot |
| `carga_id` | uuid | FK para `etl_cargas` |
| `atualizado_em` | timestamptz | metadado técnico |

## 8. `dim_distrito`

- PK `cod_distrito`, 9 dígitos;
- FK `cod_municipal`;
- `left(cod_distrito, 7) = cod_municipal`;
- contexto administrativo/territorial.

## 9. `dim_subdistrito`

- PK `cod_subdistrito`, 11 dígitos;
- FK `cod_distrito`;
- FK `cod_municipal`;
- `left(cod_subdistrito, 9) = cod_distrito`;
- `left(cod_subdistrito, 7) = cod_municipal`.

## 10. `dim_cep5`

Grão: **uma associação válida entre um município canônico e um CEP5**.

| Campo | Tipo | Regra |
|---|---|---|
| `cod_municipal` | text | FK para `dim_municipio`; parte da PK |
| `cep5` | text | 5 dígitos; parte da PK |
| `municipio_origem` | text | valor literal da fonte CEP5 |
| `uf_origem` | text | sigla UF literal da fonte, 2 letras |
| `metodo_resolucao` | text | `EXATO` ou `ALIAS_HOMOLOGADO` |
| `ativo` | boolean | associação vigente na carga |
| `carga_id` | uuid | FK para `etl_cargas` |
| `atualizado_em` | timestamptz | metadado técnico |

A tabela não terá `unique(cep5)`.

## 11. Aliases homologados da fonte CEP5

A auditoria identificou três diferenças nominais entre `CEP5.xlsx` e a DTB 2025. Elas são resolvidas explicitamente, sem fuzzy matching:

| Fonte | UF | Município canônico DTB 2025 | COD_MUNICIPAL | Método |
|---|---|---|---|---|
| `São Luiz` | RR | `São Luiz do Anauá` | `1400605` | `ALIAS_HOMOLOGADO` |
| `Arês` | RN | `Arez` | `2401206` | `ALIAS_HOMOLOGADO` |
| `Açu` | RN | `Assú` | `2400208` | `ALIAS_HOMOLOGADO` |

Todos os demais pares Município + UF da fonte são resolvidos por igualdade exata com a dimensão canônica.

## 12. Município DTB sem CEP5 na fonte

`Boa Esperança do Norte/MT` (`5101837`) existe na DTB 2025 e não aparece no `CEP5.xlsx` recebido.

Isso **não remove nem inativa o município** em `dim_municipio`.

A cobertura CEP5 esperada para esta fonte é:

```text
5.570 municípios com ao menos um CEP5 / 5.571 municípios DTB 2025
```

O município sem CEP5 permanece válido e terá zero filhos em `dim_cep5` até que uma fonte posterior homologada forneça a associação.

## 13. CEP5 compartilhados entre municípios

Os nove CEP5 não globais identificados são:

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

Esses casos são válidos e explicam por que a PK é composta.

## 14. Regras de qualidade

A carga geográfica só pode ser promovida quando:

### DTB

- 100% de `cod_municipal` únicos e com 7 dígitos;
- nenhum município sem nome;
- distritos 100% relacionados a município;
- subdistritos 100% relacionados a distrito e município;
- prefixos hierárquicos consistentes;
- contagens e checksum iguais ao conjunto canônico homologado no PEM.

### CEP5

- 24.905 associações recebidas;
- 24.905 PKs compostas únicas;
- 24.896 CEP5 distintos;
- 0 nulos;
- todos os CEP5 com 5 dígitos;
- 100% das linhas resolvidas para um `COD_MUNICIPAL` canônico;
- exatamente 3 resoluções `ALIAS_HOMOLOGADO` por par nominal de origem, podendo cada alias aparecer em várias linhas;
- nenhuma resolução fuzzy automática;
- 9 CEP5 com mais de um `COD_MUNICIPAL` na fonte auditada;
- 5.570 municípios canônicos cobertos pelo arquivo;
- `Boa Esperança do Norte/MT` reconhecido como ausência esperada da fonte, não como erro da dimensão municipal.

## 15. Replicação

Tabelas replicáveis deste domínio:

- `dim_municipio`;
- `dim_distrito`;
- `dim_subdistrito`;
- `dim_cep5`.

Paridade exige, por tabela:

- mesma contagem PRIMARY x REPLICA;
- checksum determinístico idêntico;
- ausência de FK inválida;
- registro em `audit_replication_runs` quando o pipeline genérico estiver ativo.

## 16. Segurança

As quatro dimensões são internas por padrão:

- RLS habilitado;
- sem grants diretos para `anon`/`authenticated`;
- consumo pelo backend/server-side ou por interfaces explicitamente autorizadas futuramente.

## 17. Uso futuro

Este contrato autoriza o CEP5 como **chave territorial fina** para os próximos contratos de concorrência e demografia.

Ele não autoriza ainda nenhuma regra de seleção de concorrentes ou cálculo demográfico. Essas regras deverão referenciar este contrato, usando `COD_MUNICIPAL + CEP5` quando o contexto municipal estiver disponível.