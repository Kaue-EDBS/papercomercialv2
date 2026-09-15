# Replicação Paper Comercial V2 — PRIMARY -> REPLICA

## Direção

```text
Lovable Cloud PRIMARY  --->  Supabase REPLICA (`vevmnoxbjdkibdwfygfn`)
```

Nunca há escrita automática REPLICA -> PRIMARY.

## IDs Supabase

- `vevmnoxbjdkibdwfygfn`: REPLICA externa confirmada do Paper Comercial V2.
- `chwsmkdkgdgocnbcyvmq`: ID presente no `supabase/config.toml`; provável backend técnico associado ao Lovable/PRIMARY, mas sem confirmação administrativa pela conexão Supabase externa atual.

O `config.toml` **não deve ser alterado para apontar para a REPLICA**.

## Estado

A fundação contém `audit_replication_runs`.

O domínio geográfico DTB 2025 já foi carregado e reconciliado entre PRIMARY e REPLICA. O pipeline genérico de replicação do Paper ainda não foi implementado.

Qualquer pipeline futuro do Paper deve ser definido e versionado dentro deste próprio projeto, com:

- registry/allowlist explícita de tabelas autorizadas;
- leitura paginada;
- operações idempotentes;
- lotes controlados;
- checksum determinístico;
- contagem PRIMARY x REPLICA;
- auditoria em `audit_replication_runs`;
- reconciliação objetiva;
- reparo sempre PRIMARY -> REPLICA.

## Isolamento

A replicação do Paper é autônoma.

Nenhum outro projeto, banco ou aplicação deve ser usado como:

- origem de dados;
- ponte de transporte;
- fallback;
- referência de checksum;
- especificação de implementação;
- fonte de configuração.

As únicas pontas da replicação são o PRIMARY e a REPLICA do próprio Paper Comercial V2.

## Segurança

- credenciais somente server-side;
- nenhuma `service_role` ou secret no frontend/GitHub;
- RLS e princípio de menor privilégio;
- receiver autenticado quando for implementado;
- nenhuma função temporária de ingestão deve permanecer após uma carga pontual.
