# Contrato de dados — TEMPLATE

> Use este arquivo como base para cada dataset/domínio novo do Paper Comercial V2.

## 1. Identificação

- Dataset:
- Fonte oficial:
- Responsável:
- Periodicidade:
- Ano/competência:
- Arquivo(s) de origem:

## 2. Objetivo de negócio

Descreva o que o dataset representa e quais decisões/telas/regras ele suporta.

## 3. Grão

Defina exatamente o que representa uma linha.

## 4. Chave primária

- PK proposta:
- Justificativa:
- Regra de unicidade:

## 5. Chaves de relacionamento

| campo | relaciona com | regra |
|---|---|---|
|  |  |  |

## 6. Dicionário de campos

| campo | tipo | obrigatório | descrição | regra de validação |
|---|---|---|---|---|
|  |  |  |  |  |

## 7. Regras de normalização

- aliases aceitos;
- padronização textual;
- tratamento de nulos;
- tipos/conversões;
- códigos oficiais;
- arredondamentos;
- deduplicação.

## 8. Regras de qualidade

Definir checks objetivos, por exemplo:

- unicidade da PK;
- nulidade em campos críticos;
- integridade referencial;
- ranges válidos;
- cobertura esperada;
- duplicidades;
- contagens de entrada/saída.

## 9. Promoção para PRIMARY

A carga só pode ser promovida quando todos os checks críticos passarem.

## 10. Replicação

- tabela(s) replicada(s):
- PK para ordenação/canonicalização:
- colunas de checksum:
- escopo da carga:
- critério de paridade: contagem + checksum.

## 11. Segurança

- RLS:
- papéis com acesso:
- necessidade de leitura pelo frontend:
- dados sensíveis/pessoais:

## 12. Evidência de QA

Registrar dataset/carga de teste, contagens, hashes e resultado final.