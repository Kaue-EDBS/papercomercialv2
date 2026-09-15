# Arquitetura Paper Comercial V2

## Objetivo

Manter uma arquitetura auditável, reproduzível e independente da memória de chats ou de regras ocultas em runtime.

```text
                           FIGMA
                    referencia visual
                           |
                           v
CHATGPT <--------------> GITHUB <--------------> LOVABLE
orquestracao             fonte oficial           runtime + PRIMARY
QA / auditoria           codigo + DDL + docs           |
                                                       | 1-way
                                                       v
                                                   SUPABASE
                                                      REPLICA
```

## Estado funcional

Desde 2026-09-15, **nenhuma regra de negócio legada é vigente na branch atual**. Não existe ordem obrigatória de domínios, chave canônica pré-escolhida, fórmula, faixa, critério comercial ou fluxo funcional herdado.

## Ambientes

- GitHub: `Kaue-EDBS/papercomercialv2` — fonte oficial.
- Lovable: `Paper Comercial OFICIAL` (`8380d53b-a14d-4993-9447-d7c404347336`) — runtime + PRIMARY.
- Supabase externo: `vevmnoxbjdkibdwfygfn`, `sa-east-1` — REPLICA confirmada.
- Figma: time `CIT` (`1681665672034047133`) — workspace visual oficial; `SIGMA` é nome antigo/incorreto.

## Supabase: `config.toml` x REPLICA

`supabase/config.toml` contém `project_id = "chwsmkdkgdgocnbcyvmq"`. Esse ID não é acessível pela conexão Supabase externa atual. Como o repositório está conectado ao Lovable e mantém integração Supabase gerada pelo runtime, a interpretação operacional mais segura é que `chwsm...` pertence ao lado técnico do PRIMARY/Lovable.

Essa associação é uma **inferência técnica forte**, não uma confirmação administrativa. Portanto o arquivo deve ser preservado sem substituir seu ID por `vevm...`.

`vevm...` permanece inequivocamente a REPLICA externa definida pela V2.

## Banco

A fundação técnica contém apenas:

- `etl_cargas`;
- `audit_data_quality`;
- `audit_replication_runs`.

Schemas da plataforma (`auth`, `storage`, `realtime`, extensões etc.) não são domínio do Paper Comercial e não entram em resets de negócio por padrão.

## Princípios

1. GitHub-first + commit para mudanças permanentes.
2. PRIMARY é a origem operacional de escrita.
3. REPLICA recebe dados somente PRIMARY -> REPLICA.
4. Contrato e DDL precedem qualquer dataset de negócio.
5. Nenhuma chave, regra ou heurística é presumida a partir do sistema antigo.
6. Histórico Git é evidência, não especificação vigente.
7. Falhas críticas bloqueiam promoção de dados.
8. Segredos ficam server-side.
9. RLS e menor privilégio por padrão.
10. Datasets replicados exigem paridade objetiva por contagem + checksum.
11. Figma define referência visual; GitHub define implementação executável.
