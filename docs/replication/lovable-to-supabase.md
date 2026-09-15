# Replicação CIT/Paper — estado real e arquitetura-alvo

> Revisão de evidências: **15/09/2026**.

## Direção oficial

```text
Lovable Cloud PRIMARY do Paper → Supabase REPLICA do Paper
```

PRIMARY Lovable: `8380d53b-a14d-4993-9447-d7c404347336`.
REPLICA Supabase: `vevmnoxbjdkibdwfygfn`.

`supabase/config.toml` mantém `chwsmkdkgdgocnbcyvmq`. Sua associação ao backend PRIMARY continua inferida, não confirmada administrativamente; não substituí-lo pelo ID da REPLICA.

## O que já aconteceu

As quatro dimensões foram carregadas nos dois ambientes e comparadas independentemente:

| Tabela | PRIMARY | REPLICA | Conteúdo SHA-256 |
|---|---:|---:|---|
| `dim_municipio` | 5.571 | 5.571 | Igual |
| `dim_distrito` | 10.751 | 10.751 | Igual |
| `dim_subdistrito` | 646 | 646 | Igual |
| `dim_cep5` | 24.905 | 24.905 | Igual |

Isso comprova **paridade do conteúdo geográfico no snapshot**. Não comprova replicação contínua, rotina agendada, recuperação após falha ou igualdade integral de todos os objetos dos bancos.

Os helpers temporários de aplicação foram removidos do escopo auditado. Não há pipeline genérico de replicação versionado/homologado no Paper neste momento.

## Limite da trilha de auditoria atual

`audit_replication_runs` possui **1 registro no PRIMARY e 0 na REPLICA**. O registro do PRIMARY é da tabela `dim_cep5`, run `7212a290-0884-4b2c-b7d0-6c49aac4033e`. Não foram encontrados eventos individuais DTB nessa tabela.

Os dois ambientes possuem duas cargas concluídas em `etl_cargas` e dois checks aprovados em `audit_data_quality`. São evidências diferentes: registro de carga, resultado de qualidade e evento de replicação não se substituem.

Ainda é preciso definir se logs de auditoria serão espelhados integralmente, mantidos por ambiente ou conciliados por identificador. Não inventar eventos históricos para preencher a lacuna. Um registro posterior deve identificar-se como reconciliação/backfill posterior.

## Checksum

O snapshot atual usa `sha256-json-array-lines-v1`, documentado no [mapa de engenharia](../architecture/mapa-cit-paper-v2.md). Os checksums e a ordem das colunas estão no [snapshot JSON](../testing/cit-paper-snapshot-2026-09-15.json).

Consulta somente leitura: [`database/validation/geografia_snapshot_readonly.sql`](../../database/validation/geografia_snapshot_readonly.sql).

Os MD5 históricos das cargas continuam válidos como evidência do método usado naquela execução. Não comparar MD5 com SHA-256 ou protocolos de serialização diferentes. `carga_id` e `atualizado_em` são excluídos do checksum territorial e verificados separadamente como metadados.

## O que ainda falta implementar

A arquitetura-alvo requer allowlist de datasets/tabelas/colunas, identidade de lote, leitura paginada, ordem de FKs, gravação idempotente, checkpoints e retomada. Também precisa de autenticação server-side entre os ambientes, erro explícito de auditoria, comparação no mesmo escopo e estratégia de publicação que não exponha carga incompleta.

Upsert sozinho não remove registros que desapareceram da fonte. Cada contrato precisa decidir entre snapshot, exclusão lógica, tombstones ou outra regra aprovada. Não adotar exclusão automática silenciosa.

A reconciliação futura deve detectar conteúdo divergente, chaves ausentes/adicionais e schema incompatível. Reparo é sempre **PRIMARY → REPLICA** e deve respeitar escopo, autorização e auditoria.

Nenhuma dessas rotinas é declarada operacional apenas porque já existem os nomes de tabela ou o desenho no documento.

## Critério de homologação do pipeline permanente

Executar teste com lote válido, lote com erro, reenvio idempotente, interrupção/reinício, paginação além da primeira página, divergência no destino e recuperação controlada. Conferir conteúdo, contagem, checksum e eventos, sem inventar tempos ou resultados.

Antes disso, a classificação correta continua: **cópia pontual concluída; pipeline permanente pendente**.

## Segurança e isolamento

Nenhuma credencial privilegiada no frontend ou no Git. RLS e privilégios mínimos permanecem ativos. Nenhum outro projeto deve fornecer dados, serviços ou transporte sem pedido explícito do usuário.

A REPLICA não substitui um backup versionado com restauração testada. A política de retenção e recuperação ainda deve ser definida no Paper.
