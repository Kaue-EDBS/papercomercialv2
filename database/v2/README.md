# Banco Paper Comercial V2

`database/v2/` é a única fonte oficial de DDL da V2.

## Estado atual

- `0000_reset_legacy.sql` — reset reproduzível da camada de negócio realizado em 2026-09-15.
- `0001_foundation.sql` — fundação técnica: `etl_cargas`, `audit_data_quality` e `audit_replication_runs`.
- `0002_geografia_dtb_2025_cep5.sql` — primeiro domínio V2: DTB 2025 + dimensão operacional CEP5.
- `0003+` — ainda não definido. Não atribuir domínio, chave ou regra sem decisão e contrato novos.

## Domínio 0002 — Geografia + CEP5

Contrato: `docs/data-contracts/geografia-dtb-2025-cep5.md`.

Fontes vigentes e autônomas do Paper:

- `COD_MUNICIPAL.zip` — IBGE / DTB 2025 original auditado;
- `CEP5.xlsx` — referência territorial CEP5 auditada.

Estrutura persistente:

- `dim_municipio`;
- `dim_distrito`;
- `dim_subdistrito`;
- `dim_cep5`.

Chaves:

- município: `cod_municipal`;
- distrito: `cod_distrito`;
- subdistrito: `cod_subdistrito`;
- CEP5: PK composta `(cod_municipal, cep5)`.

O `CEP5` não é globalmente único e não é tratado como distrito/subdistrito. É uma ramificação territorial operacional abaixo do município, destinada a suportar futuros contratos de concorrência e demografia.

## Estado homologado da carga

### DTB 2025

- `dim_municipio`: 5.571 linhas;
- `dim_distrito`: 10.751 linhas;
- `dim_subdistrito`: 646 linhas;
- 27 UFs;
- 133 Regiões Geográficas Intermediárias;
- 510 Regiões Geográficas Imediatas;
- zero PK duplicada;
- zero FK inválida;
- zero inconsistência de prefixo hierárquico.

Checksums PRIMARY = REPLICA:

- município: `4665954435fe358572621d23847ac833`;
- distrito: `82deeb72775cc53ef362bca04834571a`;
- subdistrito: `9bf7f178c76829051084ef9c6702a19b`.

Carga: `geografia_dtb_2025` — **concluída**.

### CEP5

- 24.905 associações gravadas;
- 24.896 CEP5 distintos;
- 5.570 municípios cobertos;
- 3 aliases homologados;
- 9 CEP5 compartilhados entre municípios;
- zero PK duplicada;
- zero FK inválida;
- zero CEP5 fora do formato de 5 dígitos;
- zero nulo crítico;
- `Boa Esperança do Norte/MT` permanece como município DTB válido sem CEP5 nesta fonte.

Checksum PRIMARY = REPLICA:

`09737a6c95f08c920532a2baadbf411e`

Carga: `geografia_cep5` — **concluída**.

A replicação foi executada no sentido oficial:

```text
Lovable Cloud PRIMARY -> Supabase REPLICA
```

O evento foi registrado em `audit_replication_runs`.

## Estado técnico após a carga

Todos os objetos temporários usados exclusivamente na ingestão/replicação do CEP5 foram removidos após a validação.

Validação final:

- PRIMARY: 24.905 linhas em `dim_cep5`, 0 tabelas `tmp_*`, 0 rotinas `tmp_*`;
- REPLICA: 24.905 linhas em `dim_cep5`, 0 tabelas `tmp_*`, 0 rotinas `tmp_*`.

Não há Edge Function criada por este domínio neste momento. O domínio 0002 é composto por DDL, tabelas, constraints, índices, RLS, carga, QA e replicação. Serviços/Edge Functions futuros devem nascer apenas quando houver um caso de uso funcional definido.

## Segurança

As dimensões são internas por padrão:

- RLS habilitado;
- sem grants diretos para `anon`/`authenticated`;
- helpers temporários de carga removidos;
- nenhuma credencial persistida no DDL ou na documentação.

## Isolamento

O Paper Comercial V2 é autônomo.

Nenhum outro projeto, banco ou aplicação deve ser utilizado como fonte, transporte, fallback, especificação ou referência operacional sem pedido explícito do usuário.

## Fluxo para novos domínios

1. fonte/necessidade explícita;
2. auditoria;
3. definição de grão e chave;
4. contrato em `docs/data-contracts/`;
5. DDL em `database/v2/`;
6. commit GitHub;
7. aplicação no PRIMARY;
8. QA;
9. replicação PRIMARY -> REPLICA;
10. contagem + checksum;
11. evidência e documentação final.
