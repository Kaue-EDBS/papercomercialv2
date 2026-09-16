# PRIMARY: Session Pooler e prova de conexao

> **Conectividade externa confirmada em 16/09/2026, 14:06 de Brasilia.** A execucao [35126088433](https://github.com/Kaue-EDBS/papercomercialv2/actions/runs/35126088433) terminou com sucesso no commit `4e426bc1e95c17916a3b10e1642366c3164f3b2f`. Evidencia consolidada: [primary-connection-2026-09-16.json](../testing/primary-connection-2026-09-16.json).

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

## Evidencia efetivamente observada

O PR #11 foi integrado somente depois de CI de aplicacao e banco aprovados. No commit integrado, os runs de aplicacao `35126088367`, banco `35126088372` e conexao real `35126088433` tambem passaram.

O log do job `104895353744` confirmou:

- secret armazenado ainda aponta a aws-0; o endpoint efetivo foi aws-1:5432 sem alterar credenciais;
- PRIMARY e REPLICA conectaram por IPv4, com verify-full, usuario tecnico, banco postgres e membership corretos;
- ambos os snapshots executaram com `transaction_read_only = on` e retornaram `ok = true`;
- municipios 5.571, distritos 10.751, subdistritos 646 e associacoes CEP5 24.905 por banco;
- os quatro hashes de negocio coincidem com o baseline aprovado em cada ambiente;
- as definicoes das funcoes 0007 coincidem com as versoes aplicadas e auditadas;
- os 14 testes unitarios de normalizacao passaram tambem no runner de producao.

A falha anterior `tenant/user not found` foi resolvida, no fluxo aprovado, pela correcao do endpoint. Nao houve redefinicao de senha ou ampliacao de privilegios. Isso nao representa confirmacao administrativa de propriedade da infraestrutura Lovable, mas comprova autenticacao e leitura externa do PRIMARY identificado pelo contrato.

## Limites e ponto de retomada

Concluidos: conectividade externa dos dois ambientes e leitura das dimensoes pelo runner. A verificacao de funcoes aqui compara definicoes; nao repete todos os testes comportamentais da etapa 0007 anterior.

Ainda separados: reconciliacao real com entrega de auditoria, promocao/replay em producao e E2E da interface publicada. Nenhuma rotina de replicacao foi agendada.

Proximo passo: executar conscientemente `CIT manual replication` em `check`, com `allow_deletions=false`, usando a main corrigida. Essa operacao compara os dados geograficos e grava auditoria/controle; nao e somente leitura. Validar o resultado e os registros persistidos antes de declarar o fluxo operacional homologado. Nao usar `apply` para recarregar dados ja equivalentes sem necessidade e escopo aprovado.
