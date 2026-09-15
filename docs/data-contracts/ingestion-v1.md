# Contrato CIT de ingestão geográfica V1

Data: 15/09/2026. Implementação: `database/v2/0003_cit_ingestion_access.sql` e `src/features/ingestion/`. Contrato exclusivo do CIT/Paper; não restaura regras comerciais.

## Fronteira de responsabilidade

O serviço recebe, preserva e valida um lote. **Não cria tabelas temáticas arbitrárias e não substitui dimensões canônicas.** `VALIDATED` significa staging geograficamente validada e selada; não significa dataset de negócio publicado ou replicado. A promoção de cada domínio exige contrato e destino allowlisted próprios.

Foi implementado como RPC PostgreSQL `public.cit_ingest(action,payload)`, não como Edge Function. Isso permite transações de revisão/selamento no próprio PRIMARY e evita expor credenciais administrativas no navegador. O entrypoint público é SECURITY INVOKER. A implementação privilegiada fica em schema privado, valida usuário, sessão e autorização em todas as chamadas e não concede acesso direto às tabelas internas.

## Entrada e limites

Aceita CSV/TSV UTF-8 ou array JSON de objetos. XLSX deve ser normalizado antes, preservando códigos como texto. Limites defensivos: 8 MiB de bytes originais, 100.000 linhas por lote, 500 linhas por requisição de append e 65.536 bytes por objeto normalizado no PostgreSQL. São limites máximos de proteção, não uma garantia de latência para arquivos no teto. Os testes de paginação da replicação usam mais de 1.000 registros.

O parser preserva strings, zeros à esquerda, colunas extras e estruturas JSON. CSV com colunas em excesso/falta, cabeçalhos vazios/duplicados ou aspas malformadas é rejeitado. JSON segue a semântica JSON/JSONB; chaves literais duplicadas em um mesmo objeto não constituem formato recomendado e devem ser removidas na higienização prévia.

O servidor calcula SHA-256 dos bytes e interpreta o arquivo. **Cada linha enviada em append deve ser igual à linha correspondente do arquivo interpretado no servidor.** Um cliente não pode trocar o conteúdo e manter o hash do arquivo original.

## Identidade, idempotência e estados

Identidade do lote: usuário + dataset + fonte + SHA-256 dos bytes. Repetir o arquivo com metadados incompatíveis falha; repetir o mesmo bloco com o mesmo conteúdo não duplica; repetir um índice com conteúdo diferente falha.

```text
UPLOADING -> REVIEW -> READY -> VALIDATED
                  \-> REJECTED
```

Enquanto faltar qualquer bloco/linha, o lote permanece UPLOADING e não pode ser selado. REVIEW exige intervenção autorizada. READY exige quantidade integral e zero pendências. VALIDATED sela staging e gera `etl_cargas.status=validada`, `linhas_gravadas=0`, com check geográfico. Nenhuma linha é silenciosamente descartada para atingir 100%.

## Resolução geográfica

A saída usa `COD_MUNICIPAL`, `MUNICIPIO`, `UF` e `CEP5` quando aplicável. Cabeçalhos equivalentes são reconhecidos; duas colunas candidatas divergentes produzem revisão, não escolha arbitrária.

1. Código municipal existente é conferido contra nome/UF disponíveis.
2. Código válido e nome/UF conflitantes ficam em revisão; não se decide silenciosamente qual campo é verdadeiro.
3. Código inválido/ausente pode ser corrigido por nome normalizado + UF somente se o resultado for único.
4. Alias humano pré-aprovado é restrito à fonte, UF e nome normalizado.
5. Fuzzy sugere até cinco candidatos da mesma UF; nunca aprova uma linha.
6. CEP5 fornecido precisa ter cinco dígitos e pertencer ao município canônico. Quando obrigatório no lote, ausência também bloqueia.
7. Somente uma coluna explicitamente chamada CEP pode ter um CEP completo de oito dígitos convertido para prefixo. Não acrescentar zeros nem truncar valores inválidos de CEP5.

100% significa todas as linhas exigidas pelo contrato resolvidas. Não se exige cobertura nacional. Um município canônico sem CEP5 na fonte não é excluído; uma linha que exige CEP5 sem associação válida permanece pendente.

## Revisão

Somente admin/reviewer. Exige linha pendente, versão atual do lote, município canônico, justificativa e CEP5 válido quando presente/obrigatório. Troca de UF exige confirmação explícita. Um CEP fornecido na origem não pode ser apagado silenciosamente para contornar o gate.

Memorizar alias é opt-in. A regra não pode sobrescrever outra associação já homologada. Alias não é aprendido a partir de coluna ambígua ou troca de UF. O payload original é preservado, o normalizado fica separado e um evento append-only registra a decisão.

## Tabelas privadas

| Tabela | Responsabilidade |
|---|---|
| `cit_private.access_grants` | Aprovações explícitas e revogáveis de papéis. |
| `cit_private.ingestion_batches` | Bytes originais, hash, parser result, contagem e estado do lote. |
| `cit_private.ingestion_rows` | Linha original, hash, normalização e resolução. |
| `cit_private.review_events` | Histórico de decisões, ator e motivo. |
| `cit_private.municipality_aliases` | Exceções reutilizáveis homologadas por fonte. |

RLS habilitado, sem grants de tabela a anon/authenticated. Não incluir `cit_private` nos schemas expostos da Data API.

## Papéis

| Papel | Pode importar | Pode revisar | Pode selar | Escopo de leitura |
|---|---|---|---|---|
| admin | Sim | Sim | Sim | Todos os lotes |
| operator | Sim | Não | Sim | Próprios lotes |
| reviewer | Não | Sim | Não | Lotes destinados à revisão |
| viewer | Não | Não | Não | Apenas lotes próprios já existentes e lookup geográfico |

A migração não promove automaticamente nenhuma das contas existentes. A validação consulta `auth.users`, `auth.sessions` e `access_grants` ao vivo. Claims editáveis `user_metadata` não autorizam operações. Conta sem aprovação, sessão revogada, conta anônima, excluída ou banida é bloqueada.

A interface usa login por senha de conta existente e não tem signup. Isso não é uma alteração da configuração global de signup/provedores do Supabase; mesmo uma conta criada por outra via continua sem autorização na V2.

## Verificação

SQL: `database/tests/ingestion.sql`. UI: `src/test/ingestion-console.test.tsx` (transporte simulado). Parser/segurança: `src/test/geography.test.ts`. CI executa PostgreSQL descartável e não recebe credenciais de produção. Login HTTP com uma conta real aprovada é um passo de ativação separado, não substituído pelos testes isolados.
