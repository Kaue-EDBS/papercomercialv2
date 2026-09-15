# Merge gate P01-P11

Este arquivo existe apenas para registrar e disparar a validação do HEAD completo da branch `chore/cit-p01-p11` antes da integração na `main`.

Gate exigido:
- typecheck;
- testes da aplicação;
- build;
- migrations em PostgreSQL descartável;
- testes de ingestão;
- testes de replicação/reconciliação;
- validação do commit que inclui `0005_replication_roles.sql`.

Nenhuma migration de produção é executada por este gate.
