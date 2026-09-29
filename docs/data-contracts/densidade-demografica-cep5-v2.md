# Contrato de dados — Densidade Demográfica CEP5 V2

> Status: **CARREGADA E VALIDADA NO PRIMARY** em 2026-09-29.
> DDL: [`database/v2/0012_densidade_demografica_cep5_v2.sql`](../../database/v2/0012_densidade_demografica_cep5_v2.sql).

## 1. Fonte aprovada

Pacote do usuário `densidade_demografica_cep5_higienizado_pacote_V2.zip` (versão 2, 08/09/2026).

Arquivo de carga: `densidade_demografica_cep5_higienizado.csv`
SHA-256: `ba40e7562eb9b3e940c3675ed1bae56fbb3a50e29c0fc2fa484633b5b12403ba`
Tamanho: 12.368.078 bytes. UTF-8 com BOM, delimitador `;`, vazio = NULL.

Observação de transmissão: o upload do ZIP V2 chegou truncado no final (o JSON auxiliar
foi cortado). O CSV de carga está no início do arquivo e foi extraído íntegro; seu
SHA-256 é idêntico ao do pacote anterior preservado no ambiente, e o README V2 declara
que os dados tabulares não mudaram entre V1 e V2 — a V2 formaliza o contrato de
relacionamento, o SQL, o dicionário e os metadados.

## 2. Tabela persistente

`public.densidade_demografica_cep5` — 123 colunas de dados + `id` técnico.

Blocos de colunas:

| Bloco | Conteúdo |
|---|---|
| Identificação | `cep5` (char 5, zeros à esquerda), `municipio` (text) |
| População e renda agregada | `populacao`, `renda_nominal`, `renda_faixa_total`, `renda_faixa_a_pp` … `renda_faixa_e` |
| Faixa etária | `pop_idade_total` e 20 recortes (`ate_4` … `80_mais`, mais agregados `ate_9`, `25_34`, `35_49`, `50_59`, `60_mais`) |
| Consumo | `consumo_total`, `consumo_livros_material_escolar`, `consumo_artigos_escolares`, `consumo_livros_didaticos_revistas_tecnicas`, `consumo_outros_livros_material_escolar`, `consumo_cursos_regulares` |
| Renda × faixa etária | `pop_renda_idade_total` e 8 classes (`a_pp`, `a_p`, `b1`, `b2`, `c1`, `c2`, `d`, `e`) × 9 recortes etários + total |

Todos os campos quantitativos são inteiros (`bigint`), com NULL para ausência.
Ausência **não** equivale a zero.

## 3. Chave e relacionamento

A identidade da linha é o par **`(municipio, cep5)`**. `UNIQUE (cep5, municipio)` no banco.

Regra de cruzamento com a setorização/carteiras:

1. Obter o município da escola.
2. Dentro desse município, localizar o CEP5 da escola.
3. Associar somente se **ambos** corresponderem.
4. Sem correspondência, manter a escola via `LEFT JOIN` e apresentar os indicadores
   como ausentes. Não substituir ausência por zero.
5. **Nunca** procurar o mesmo CEP5 em outro município como alternativa, nem usar `OR`
   ou correspondência aproximada.

CEP5 compartilhados por mais de um município (confirmados no banco, 9 casos):
`11770`, `17455`, `36490`, `44865`, `45263`, `45265`, `46110`, `65935`, `78470`.

Se a carteira tiver apenas CEP completo, normalizar para oito dígitos e extrair os
cinco primeiros. Não completar códigos incompletos automaticamente.

Cardinalidade esperada: várias escolas para uma linha demográfica. Para somar população
de uma carteira, obter primeiro os pares `DISTINCT (municipio, cep5)` e só depois somar
os indicadores dos territórios encontrados. Não usar `SUM(DISTINCT populacao)`.

## 4. Agregados etários — dupla contagem

Não somar simultaneamente um agregado e suas subdivisões.
`pop_idade_25_34` = `pop_idade_25_29 + pop_idade_30_34`. O mesmo vale para
`ate_9`, `35_49`, `50_59` e `60_mais`.

## 5. Validação executada em 2026-09-29 (PRIMARY)

| Verificação | Esperado | Obtido |
|---|---|---|
| Linhas carregadas | 24.905 | 24.905 |
| CEP5 distintos | 24.896 | 24.896 |
| Pares `(municipio, cep5)` únicos | 24.905 | 24.905 |
| CEP5 em mais de um município | 9 | 9 |
| Municípios distintos | — | 5.297 |
| População somada | — | 218.136.383 |

Cruzamento com a setorização 2026 (`dim_escola` × `dim_municipio`):
**33.485 de 33.924 escolas (98,71%)** encontram território demográfico pelo par
`(municipio, cep5)`. As 439 restantes ficam sem indicadores, por `LEFT JOIN`.

Todas as `CHECK constraints` de teto populacional passaram na carga.

## 6. Limites herdados da fonte

Declarados pelo README V2 e **não corrigidos** nesta carga:

- 24.597 registros têm ao menos uma faixa com divergência entre o bloco de idade e
  sua soma nas classes de renda.
- Em 7.059 registros o detalhamento renda × idade soma menos que a população;
  diferença acumulada de 7.877 pessoas.

A integração deve tratar os blocos como independentes e não assumir igualdade entre eles.

## 7. Segurança

RLS habilitada sem policy permissiva. `anon` e `authenticated` sem qualquer privilégio.
`service_role` com acesso total. A concessão temporária ao papel de carga foi revogada
ao fim da importação. Leitura exclusivamente por backend controlado.
