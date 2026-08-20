# Base ENEM 2025 — médias municipais no banco

Criar uma tabela dedicada exclusivamente às médias municipais do ENEM 2025 e carregar os 1.805 municípios do pacote enviado. Nenhuma alteração de frontend ou de qualquer estrutura existente.

## O que será feito

1. **Nova tabela `enem_medias_municipio`** — isolada, sem relação com as tabelas atuais (carteiras, cadastros, perfis). Guarda por município: ano, código IBGE (7 dígitos), nome, UF, total de participantes, médias de Ciências da Natureza, Ciências Humanas, Linguagens, Matemática, das 5 competências da redação e da redação total — cada média acompanhada da quantidade de notas usadas no cálculo.

2. **Regras de acesso** — leitura liberada para qualquer usuário autenticado (base pública do INEP, sem dado pessoal). Escrita apenas por processos administrativos internos; ninguém altera pelo app.

3. **Carga dos dados** — inserção dos 1.805 municípios em lotes, de forma idempotente: rodar de novo apenas atualiza os valores, sem duplicar. Chave: ano + código do município, então uma edição futura do ENEM entra na mesma tabela sem conflito.

4. **Validação** — conferir a contagem final (1.805 linhas, ano 2025) e comparar uma amostra de municípios grandes com o arquivo de origem.

## Detalhes técnicos

- Migração: `CREATE TABLE public.enem_medias_municipio` com PK `(ano, codigo_municipio)`, índice em `(uf, municipio)` e índice em `codigo_municipio` para junção futura com `carteiras_escolas_v3.cod_municipio`.
- Colunas de média em `numeric(6,1)`, nulas quando não houve nota; contadores `n_*` inteiros NOT NULL.
- `GRANT SELECT` para `authenticated`, `GRANT ALL` para `service_role`; RLS habilitado com política de leitura para `authenticated`.
- Carga feita como operação de dados (não migração), a partir do `enem_2025_medias_municipio_completo.json` do pacote, com `ON CONFLICT (ano, codigo_municipio) DO UPDATE`.
- O arquivo bruto não é copiado para o repositório; os dados ficam apenas no banco.

## Fora do escopo

Nenhuma tela, hook, consulta ou exportação usa a tabela ainda — o consumo no paper (comparativo de desempenho por município) fica para uma etapa seguinte.