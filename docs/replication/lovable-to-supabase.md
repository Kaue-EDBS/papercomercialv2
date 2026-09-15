# Replicação Paper Comercial V2 — Lovable Cloud -> Supabase

## Direção

```text
Lovable Cloud (PRIMARY)  --->  Supabase (REPLICA)
```

A replicação é unidirecional. O Supabase externo `vevmnoxbjdkibdwfygfn` não deve escrever automaticamente de volta no PRIMARY.

## Objetivos

- cópia independente dos dados curados;
- auditoria de cargas;
- consultas analíticas sem impacto no PRIMARY;
- verificação de integridade;
- recuperação/exportação independente.

## Estado atual

A fundação V2 já possui `audit_replication_runs`, mas o pipeline genérico de replicação ainda não foi implementado neste projeto.

Antes de implementar o receiver/replicador, o primeiro dataset de negócio precisa estar formalizado com:

- contrato de dados;
- DDL V2;
- PK estável;
- colunas de checksum;
- regra de escopo da carga;
- critérios de promoção.

## Padrão que será herdado do PEM

Quando o primeiro dataset estiver pronto, a implementação deve seguir o mesmo desenho validado no PEM:

1. allowlist/registry de tabelas replicáveis;
2. leitura paginada do PRIMARY;
3. reset apenas do escopo autorizado na REPLICA;
4. upsert por lotes;
5. checksum canônico determinístico;
6. comparação de contagem + checksum;
7. registro em `audit_replication_runs`;
8. reconciliação sem escrita reversa;
9. reparo sempre PRIMARY -> REPLICA.

## Segurança

- credenciais apenas server-side;
- nenhuma `service_role` no frontend ou GitHub;
- receiver protegido por autenticação server-to-server;
- REPLICA não expõe tabelas internas a `anon/authenticated` sem necessidade explícita;
- toda tabela em schema exposto deve ter RLS coerente com o modelo de acesso.

## Observação sobre histórico de migrations da REPLICA

O projeto Supabase externo já possuía histórico de migrations anterior à fundação Paper V2. Esse histórico é metadado gerenciado da plataforma e foi preservado. A camada de negócio `public` foi limpa e reconstruída conforme `database/v2/0000_reset_legacy.sql` e `database/v2/0001_foundation.sql`.
