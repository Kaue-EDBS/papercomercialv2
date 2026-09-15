# Workflow de mudanca — Paper Comercial V2

## Regra geral

Toda mudanca permanente nasce no GitHub e deve ser commitada antes de ser aplicada ao runtime ou aos bancos.

## Mudanca de dados/schema

1. Identificar fonte, grao, chave e objetivo de negocio.
2. Criar/atualizar contrato em `docs/data-contracts/`.
3. Criar DDL/migration em `database/v2/`.
4. Revisar PK, FK, tipos, nulabilidade, indices, constraints e RLS.
5. Revisar impacto no frontend e nas regras comerciais.
6. Aplicar no PRIMARY.
7. Validar estrutura e dados no PRIMARY.
8. Aplicar o mesmo desenho na REPLICA.
9. Replicar dados somente apos validacao do PRIMARY.
10. Comparar contagem + checksum.
11. Registrar auditoria e somente entao liberar consumo.

## Mudanca de interface

1. Definir necessidade e regra de negocio.
2. Confirmar que o contrato de dados suporta a necessidade.
3. Ajustar Figma quando houver mudanca relevante de UX/UI.
4. Implementar via GitHub + commit.
5. Rodar testes/build conforme aplicavel.
6. Sincronizar pela branch conectada ao Lovable.
7. Validar estados vazio/loading/erro e dados reais.

## Mudanca destrutiva

Reset, DROP, exclusao de dados ou mudanca de chave exige:

- inventario antes da mudanca;
- SQL versionado no GitHub;
- confirmacao do escopo;
- preservacao de schemas gerenciados pela plataforma, salvo decisao explicita;
- validacao posterior mostrando exatamente quais objetos permaneceram.

## Definition of Done

Uma alteracao nao esta concluida ate que:

- regra/origem estejam documentadas;
- codigo/DDL estejam versionados;
- testes aplicaveis passem;
- dados tenham validacao objetiva quando houver carga;
- nao existam segredos no diff;
- PRIMARY e REPLICA estejam em paridade quando aplicavel;
- o README/handoff esteja atualizado se a mudanca alterar arquitetura ou ponto de retomada.
