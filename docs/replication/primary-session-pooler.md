# PRIMARY: Session Pooler e prova de conexao

## Decisao e origem

Em 16/09/2026 o usuario autorizou resolver a conectividade externa do PRIMARY do Paper. O historico fornecido identifica `aws-1-us-east-1.pooler.supabase.com` como host retornado pelo Lovable. A porta escolhida e 5432 (Session mode), porque o worker usa estado e locks de sessao. O host nao foi deduzido pela regiao e nao ha varredura de outros clusters.

A documentacao oficial confirma Session 5432, Transaction 6543, username `[ROLE].[PROJECT-REF]`, IPv4 no pooler compartilhado e `sslmode=verify-full` com CA para validar o servidor:
https://supabase.com/docs/guides/database/connecting-to-postgres

## Implementacao

`scripts/primary_session.py` le `CIT_PRIMARY_DATABASE_URL` somente dentro do runner e substitui apenas host/porta em memoria. A senha e preservada byte a byte, inclusive percent-encoding. O secret armazenado no GitHub NAO e alterado e seu valor NAO e exposto em logs, argumentos, arquivos ou artefatos.

O contrato aceita somente o usuario tecnico do PRIMARY, o banco postgres, os hosts conhecidos aws-0/aws-1 de us-east-1 e TLS verify-full. O destino efetivo e sempre aws-1:5432. Parametros que poderiam substituir host, IP, usuario ou banco pela query string sao rejeitados. A REPLICA nao e redirecionada.

O workflow manual passou a usar esse ponto de entrada tanto no preflight quanto no worker, evitando testar um endpoint e executar a replicacao em outro. Invocar `replication.py` diretamente continua usando o DSN fornecido pelo operador: para a configuracao aprovada, usar o wrapper ou corrigir o secret manualmente mantendo a senha.

## Verificacao sem escrita

`CIT production connection verification` executa somente na main, com o environment existente `cit-production-replication` e sem remover qualquer protecao. Dispara manualmente ou em alteracoes dos arquivos de conectividade na main. Nao e uma rotina agendada de replicacao.

1. Testes unitarios sem secrets.
2. Instalacao da dependencia fixada e CA.
3. Preflight: DNS, TLS, login, database e membership das roles.
4. Snapshot em transacoes PostgreSQL READ ONLY: 41.873 linhas geograficas por banco, contagens e SHA-256 do baseline homologado, e definicoes da migration 0007.

Nenhuma linha de negocio, auditoria ou controle e inserida/alterada. O snapshot usa o protocolo SHA-256 existente; os MD5 separados sao somente identidades de definicao das duas funcoes e NAO substituem checksums geograficos.

`check` do worker tradicional continua gravando auditoria. Ele nao e chamado pelo novo workflow; `apply` tambem nao.

## Evidencia e limites

Foram executados localmente 14 testes unitarios de normalizacao, preservacao de senha sintetica, TLS, idempotencia, rejeicao de projeto/usuario/host/parametros inesperados e mensagens sem credenciais. A comprovacao real depende do resultado do workflow na main; o merge isolado nao comprova conectividade.

Registrar no PR a execucao real, seu SHA e resultado. Se falhar, classificar pelo log sanitizado e nao girar senha, ampliar permissoes, trocar projeto ou insistir em hosts adivinhados.

Uma verificacao bem-sucedida fecha conectividade e leitura do snapshot pelo runner. Nao comprova promocao/replay de replicacao nem E2E da interface publicada. Esses escopos continuam separados.
