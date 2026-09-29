# Workflow de mudança — Paper Comercial V2

## Regra geral

Toda mudança permanente nasce no GitHub e recebe commit antes de chegar ao runtime ou ao banco.

## Nova regra ou dataset

1. Registrar necessidade e fonte.
2. Definir grão, semântica, chaves e limitações sem herdar pressupostos antigos.
3. Criar contrato em `docs/data-contracts/`.
4. Criar DDL em `database/v2/` quando houver schema.
5. Definir testes e checks de qualidade.
6. Implementar via GitHub.
7. Validar build/testes.
8. Aplicar no PRIMARY.
9. Validar o PRIMARY, com contagem + checksum quando houver dados.
10. Documentar resultado.

## Interface

1. Especificar comportamento atual desejado.
2. Não copiar fluxo ou texto antigo por inferência.
3. Atualizar Figma quando aplicável.
4. Implementar via GitHub + commit.
5. Testar estados vazio/loading/erro e comportamento aprovado.

## Mudança destrutiva

Exige inventário, SQL/código versionado, escopo explícito e validação posterior. Schemas gerenciados pela plataforma são preservados salvo decisão específica.

## Definition of Done

A alteração precisa ter fonte/decisão documentada, código versionado, testes aplicáveis, QA objetivo de dados quando houver, ausência de segredos no diff e validação no PRIMARY quando aplicável.
