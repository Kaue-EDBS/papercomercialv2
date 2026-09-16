# Regra territorial — Boa Esperança do Norte/MT e CEP5

> **Status:** regra de domínio aprovada em 16/09/2026.
> **COD_MUNICIPAL:** `5101837`.
> **Escopo:** CIT / Paper Comercial V2.

## 1. Motivo

Boa Esperança do Norte/MT é município válido na referência territorial atual, mas não possui recorte na fonte `CEP5.xlsx` homologada pelo CIT/Paper. A ausência é uma limitação temporal da fonte e não um erro de identidade municipal.

## 2. Regra obrigatória

Quando uma função, filtro, validação ou componente de interface normalmente depender de CEP5 e o município resolvido for `5101837`, o escopo territorial deve ser:

```text
MUNICIPIO_INTEIRO
```

A apresentação ao usuário deve ser:

```text
Município inteiro — sem recorte CEP5 na fonte aprovada
```

## 3. Comportamento técnico

Para `5101837`:

- não exigir CEP5 para considerar o município territorialmente resolvido;
- não inventar, inferir, preencher ou emprestar CEP5;
- se a entrada trouxer `CEP` ou `CEP5`, preservar o valor apenas no payload bruto/auditoria e não promovê-lo como filtro territorial normalizado;
- retornar metadado `cep5_scope = MUNICIPIO_INTEIRO` nas resoluções CEP5-aware;
- a camada de apresentação deve renderizar o município como unidade territorial integral.

Para todos os demais municípios, as regras normais de CEP5 permanecem inalteradas.

## 4. Limite da exceção

Esta regra é **exclusiva** para `5101837`. A simples ausência de CEP5 para outro município, em fonte futura, não autoriza aplicar `MUNICIPIO_INTEIRO` automaticamente. Cada novo caso exige homologação explícita e atualização versionada do contrato.

## 5. Implementação versionada

A regra é implementada por:

- `database/v2/0007_boa_esperanca_cep5_scope.sql` — função central `cit_private.cep5_scope` e ajuste da resolução de ingestão;
- `src/lib/cep5-scope.ts` — helper de apresentação para a interface;
- `database/tests/boa-esperanca-cep5.sql` — testes de regressão no banco;
- `src/test/cep5-scope.test.ts` — testes da apresentação.

A migration não cria nenhuma linha artificial em `dim_cep5` e não altera as 24.905 associações homologadas existentes.

## 6. Critérios de aceite

A regra só é considerada implementada quando os testes provarem simultaneamente que:

1. `5101837` passa numa operação que requer CEP5 mesmo sem CEP5;
2. um CEP5 recebido para `5101837` não aparece no payload normalizado;
3. o retorno informa `MUNICIPIO_INTEIRO` e o texto de interface aprovado;
4. outro município sem CEP5 continua retornando `CEP5_OBRIGATORIO` quando o contrato exigir CEP5;
5. um município ordinário com CEP5 válido continua usando escopo `CEP5`.
