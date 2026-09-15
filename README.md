# Paper Comercial V2 — Estado Atual e Ponto de Retomada

> Documento principal de continuidade do CIT/Paper Comercial V2.  
> Última consolidação: **2026-09-15**.

Antes de qualquer alteração, leia também:

- `AGENTS.md`;
- `docs/architecture/README.md`;
- `docs/governance/change-workflow.md`;
- `docs/data-contracts/geografia-dtb-2025-cep5.md`.

---

## 1. Regra máxima: o Paper é autônomo

O CIT/Paper Comercial V2 deve ser tratado como um projeto isolado.

Nenhum outro projeto, aplicação ou banco deve ser usado como:

- fonte de dados;
- fonte de regra de negócio;
- mecanismo de transporte;
- fallback;
- benchmark obrigatório;
- referência de checksum;
- especificação funcional;
- justificativa arquitetural.

Conhecimento de outros projetos não constitui requisito do Paper.

As decisões do Paper devem nascer apenas de:

1. fontes explicitamente aprovadas para o Paper;
2. contratos versionados neste repositório;
3. código/DDL versionado neste repositório;
4. banco PRIMARY do Paper;
5. REPLICA do Paper;
6. Figma oficial do Paper para UX/UI;
7. decisões explícitas do usuário.

---

## 2. Fontes da verdade

| Camada | Papel oficial |
|---|---|
| GitHub `Kaue-EDBS/papercomercialv2` | código, DDL, contratos, regras, testes, documentação e histórico |
| Lovable `Paper Comercial OFICIAL` | runtime + banco operacional **PRIMARY** |
| Supabase `vevmnoxbjdkibdwfygfn` | **REPLICA externa** |
| Figma — time `CIT` | referência visual/UX |
| arquivos-fonte aprovados | origem dos dados de negócio |

Fluxo autorizado:

```text
fontes aprovadas
      |
      v
GitHub / contratos
      |
      v
Lovable PRIMARY
      |
      | replicação 1-way
      v
Supabase REPLICA
```

Nunca existe reparo automático REPLICA -> PRIMARY.

---

## 3. Ambientes

### GitHub

- repositório: `Kaue-EDBS/papercomercialv2`;
- branch operacional: `main`.

### Lovable / PRIMARY

- projeto: `Paper Comercial OFICIAL`;
- Project ID: `8380d53b-a14d-4993-9447-d7c404347336`;
- papel: runtime + banco operacional PRIMARY.

### Supabase / REPLICA

- Project ref: `vevmnoxbjdkibdwfygfn`;
- região: `sa-east-1`;
- papel: REPLICA externa independente.

### Figma

- time: `CIT`;
- Team ID: `1681665672034047133`;
- nome conceitual correto: **Paper Comercial V2**;
- `SIGMA` é apenas nome antigo/incorreto e não outro projeto.

---

## 4. Identificadores Supabase

### `vevmnoxbjdkibdwfygfn`

REPLICA externa confirmada.

### `chwsmkdkgdgocnbcyvmq`

ID presente em `supabase/config.toml`.

A evidência técnica é consistente com esse ID pertencendo ao lado Lovable/PRIMARY, mas isso não foi confirmado administrativamente pela conexão externa atual.

Portanto:

- não trocar `supabase/config.toml` para `vevm...`;
- não tratar `chwsm...` como REPLICA;
- manter `vevm...` como REPLICA confirmada;
- só alterar essa topologia com evidência explícita.

---

## 5. Clean slate V2

Em 2026-09-15 a camada funcional antiga foi removida da branch atual.

Foram removidos:

- regras comerciais antigas;
- fórmulas;
- heurísticas;
- fluxos antigos;
- páginas específicas do produto anterior;
- hooks e módulos de negócio antigos;
- `.lovable/plan/`;
- migrations antigas de negócio em `supabase/migrations/`.

Merge principal do reset funcional:

```text
f026c78f1f98d2142271118cf6adc339e1bfa867
```

O histórico Git permanece apenas como evidência histórica. Não deve ser usado como requisito vigente sem pedido explícito do usuário.

---

## 6. Fundação técnica V2

PRIMARY e REPLICA possuem:

```text
etl_cargas
audit_data_quality
audit_replication_runs
```

DDL oficial:

- `database/v2/0001_foundation.sql`.

Essas tabelas têm RLS habilitado e não possuem grants diretos para `anon`/`authenticated`.

---

## 7. Primeiro domínio V2 — Geografia DTB 2025 + CEP5

DDL oficial:

- `database/v2/0002_geografia_dtb_2025_cep5.sql`.

Contrato:

- `docs/data-contracts/geografia-dtb-2025-cep5.md`.

Estrutura:

```text
dim_municipio
dim_distrito
dim_subdistrito
dim_cep5
```

Modelo lógico:

```text
UF
 -> Região Geográfica Intermediária
    -> Região Geográfica Imediata
       -> Município
          ├─ Distrito
          │  └─ Subdistrito
          └─ CEP5
```

O CEP5 é uma dimensão operacional própria. Ele não é distrito nem subdistrito.

---

## 8. Fonte DTB 2025 do Paper

Arquivo original recebido:

```text
COD_MUNICIPAL.zip
```

Fonte institucional:

```text
IBGE — Divisão Territorial Brasileira 2025
```

SHA-256:

```text
a5947915a7213cddde00682a51d0734ea6b6ec2307d237d1e7937edde6766b99
```

Auditoria direta:

- 5.571 municípios;
- 27 UFs;
- 133 regiões intermediárias;
- 510 regiões imediatas;
- 10.751 distritos;
- 646 subdistritos;
- 0 PK duplicada;
- 0 FK inválida;
- 0 quebra de prefixo hierárquico.

---

## 9. Estado da carga DTB 2025

Status: **CONCLUÍDA**.

Carga:

```text
geografia_dtb_2025
```

Contagens no PRIMARY e na REPLICA:

| tabela | linhas |
|---|---:|
| `dim_municipio` | 5.571 |
| `dim_distrito` | 10.751 |
| `dim_subdistrito` | 646 |

Checksums determinísticos atuais:

```text
dim_municipio    4665954435fe358572621d23847ac833
dim_distrito     82deeb72775cc53ef362bca04834571a
dim_subdistrito  9bf7f178c76829051084ef9c6702a19b
```

Resultado E2E:

- contagens PRIMARY = REPLICA;
- checksums PRIMARY = REPLICA;
- FK inválida = 0;
- prefixo hierárquico inválido = 0;
- carga registrada como concluída.

---

## 10. Fonte CEP5 do Paper

Arquivo recebido:

```text
CEP5.xlsx
```

Aba:

```text
Resultados
```

SHA-256:

```text
74ad34907a4ee418ededa872d3530cc11ae89270ed666331a6879ea72cb8cf13
```

Auditoria:

- 24.905 associações `CEP5 + Município + UF`;
- 24.905 combinações exatas únicas;
- 24.896 CEP5 distintos;
- 5.570 municípios cobertos;
- 27 UFs;
- 0 nulos;
- 100% dos CEP5 com 5 dígitos;
- 248 CEP5 começam com zero;
- 9 CEP5 são compartilhados entre dois municípios;
- 24.905/24.905 linhas resolvidas para `COD_MUNICIPAL`;
- nenhuma resolução fuzzy.

`CEP5` deve permanecer `text`.

---

## 11. Chave territorial CEP5

CEP5 não é globalmente único.

A chave territorial fina é:

```text
(COD_MUNICIPAL, CEP5)
```

Essa combinação é a PK de `dim_cep5`.

Consulta apenas por CEP5 pode retornar mais de um município. A aplicação nunca deve escolher silenciosamente um deles.

---

## 12. Aliases homologados do CEP5

Somente três diferenças nominais foram aprovadas:

| origem | UF | município canônico | COD_MUNICIPAL |
|---|---|---|---|
| `São Luiz` | RR | `São Luiz do Anauá` | `1400605` |
| `Arês` | RN | `Arez` | `2401206` |
| `Açu` | RN | `Assú` | `2400208` |

Método registrado:

```text
ALIAS_HOMOLOGADO
```

Todos os demais relacionamentos são `EXATO`.

---

## 13. CEP5 compartilhados

Os nove CEP5 compartilhados auditados são:

```text
11770
17455
36490
44865
45263
45265
46110
65935
78470
```

Esses casos são válidos e são o motivo para não existir `unique(cep5)`.

---

## 14. Município sem CEP5 na fonte atual

`Boa Esperança do Norte/MT` (`5101837`) existe na DTB 2025, mas não aparece no `CEP5.xlsx` recebido.

Isso não é erro e não inativa o município.

Cobertura atual:

```text
5.570 / 5.571 municípios
```

---

## 15. Estado da carga CEP5

Carga registrada:

```text
geografia_cep5
```

Estado atual:

- fonte auditada: sim;
- 24.905 linhas válidas: sim;
- 0 rejeições: sim;
- `dim_cep5` criada: sim;
- RLS ativo: sim;
- linhas gravadas: **ainda pendentes**;
- checksum PRIMARY x REPLICA: **pendente**.

Existe atualmente um helper interno temporário criado apenas para facilitar a ingestão compacta dos pares `COD_MUNICIPAL + CEP5`.

Antes de considerar o CEP5 concluído, é obrigatório:

1. carregar as 24.905 associações no PRIMARY;
2. validar PK/FK/cobertura/aliases;
3. replicar para a REPLICA;
4. validar contagem + checksum;
5. registrar QA;
6. remover qualquer helper temporário de ingestão.

---

## 16. Replicação

Direção única:

```text
Lovable PRIMARY  --->  Supabase REPLICA
```

A replicação do Paper deve ser implementada dentro do próprio Paper, com:

- allowlist explícita;
- paginação;
- idempotência;
- lotes controlados;
- checksum determinístico;
- contagem;
- auditoria em `audit_replication_runs`;
- reconciliação;
- reparo somente PRIMARY -> REPLICA.

Nenhum outro projeto deve participar desse fluxo.

---

## 17. Segurança

Regras vigentes:

- RLS nas tabelas internas;
- nenhum grant direto de conveniência para `anon`/`authenticated` nas dimensões internas;
- nenhum `service_role` ou segredo no frontend;
- nenhuma credencial versionada intencionalmente;
- funções temporárias devem ser removidas após uso;
- alterações permanentes devem passar pelo GitHub.

### Dívida técnica conhecida

Existe um `.env` rastreado pelo repositório.

Ele não foi aberto durante o clean slate. Deve passar por auditoria de segurança separada antes de ser considerado seguro.

---

## 18. Frontend

O frontend permanece neutralizado.

Ainda não estão reativados:

- concorrência;
- market share;
- mensalidade;
- perfil socioeconômico;
- carteira;
- potencial;
- Melhor Oferta;
- Zero Estoque;
- proposta;
- plano de ação;
- demais regras comerciais.

Nenhuma dessas regras deve ser recuperada do histórico automaticamente.

---

## 19. O que já está decidido

- `COD_MUNICIPAL` é a chave administrativa canônica da geografia;
- DTB 2025 é a fonte geográfica vigente;
- CEP5 é `text`;
- CEP5 é dimensão territorial operacional de primeira classe;
- PK do CEP5 = `(cod_municipal, cep5)`;
- CEP5 servirá como granularidade territorial fina para futuros contratos de concorrência e demografia;
- PRIMARY -> REPLICA é a única direção automática de dados;
- Paper é autônomo e não depende de outro projeto.

---

## 20. O que ainda NÃO está decidido

Ainda não existe decisão vigente sobre:

- chave canônica de escola;
- chave canônica de cliente;
- relação INEP x Protheus;
- regras para identificar concorrentes;
- raio/geometria de concorrência;
- uso exato do CEP5 na seleção de concorrentes;
- metodologia demográfica por CEP5;
- market share;
- mensalidade;
- perfil socioeconômico;
- potencial de consumo;
- Melhor Oferta;
- Zero Estoque;
- proposta;
- prospecção/renovação;
- fórmulas e pesos comerciais.

Tudo isso deve nascer de nova definição explícita.

---

## 21. Diretórios oficiais

```text
AGENTS.md
README.md

database/v2/
  0000_reset_legacy.sql
  0001_foundation.sql
  0002_geografia_dtb_2025_cep5.sql
  README.md

docs/architecture/
docs/governance/
docs/data-contracts/
docs/replication/
docs/testing/

src/
  infraestrutura React/Vite
  UI genérica
  integração Supabase

supabase/config.toml
```

---

## 22. Não descalibrar

- Não reutilizar regras legadas automaticamente.
- Não recuperar regra de outro projeto.
- Não consultar outro banco como atalho para o Paper.
- Não usar outro projeto como transporte de dados.
- Não restaurar `.lovable/plan/` como especificação.
- Não restaurar migrations antigas como V2.
- Não assumir chaves sem contrato.
- Não criar DDL permanente fora do GitHub.
- Não usar prompts no Lovable como mecanismo permanente de implementação.
- Não transformar a REPLICA em origem de escrita.
- Não trocar `config.toml` para `vevm...` sem evidência nova.
- Não expor secrets.
- Não liberar dataset sem QA objetivo.
- Não declarar paridade sem contagem + checksum.
- Não depender da memória de um chat para decisão estrutural.

---

## 23. Ponto exato de retomada

```text
1. Ler README.md + AGENTS.md.
2. Trabalhar somente no CIT/Paper.
3. Não consultar outros projetos como referência operacional.
4. DTB 2025 já está concluído.
5. Retomar a carga do CEP5.xlsx.
6. Carregar 24.905 associações em dim_cep5 no PRIMARY.
7. Validar PK/FK/aliases/cobertura.
8. Replicar para a REPLICA do Paper.
9. Confirmar contagem + checksum.
10. Remover helpers temporários.
11. Registrar QA e atualizar este README.
12. Só depois iniciar o próximo domínio.
```

---

## 24. Documentação complementar

- `AGENTS.md`
- `database/v2/README.md`
- `docs/architecture/README.md`
- `docs/governance/sources-of-truth.md`
- `docs/governance/change-workflow.md`
- `docs/data-contracts/geografia-dtb-2025-cep5.md`
- `docs/replication/lovable-to-supabase.md`
- `docs/testing/foundation-v2-2026-09-15.md`
- `docs/testing/business-rules-reset-2026-09-15.md`
