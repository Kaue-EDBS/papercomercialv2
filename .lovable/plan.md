# Censo Escolar 2025 — escolas privadas ativas no banco

Criar no banco uma tabela exclusiva para o Censo Escolar 2025 (rede privada, em atividade) e carregar os 42.454 registros do pacote enviado. Apenas backend — nenhuma tela, hook ou consulta do app é alterada, seguindo o mesmo padrão das cargas do ENEM e da densidade demográfica.

## O que será criado

Tabela `censo_escolas_privadas_ativas`, com 125 campos conforme o dicionário do pacote:

- Identificação: ano do censo, código e nome da escola (INEP), código e nome do município, rede, dependência, categoria da escola privada, localização (urbana/rural e diferenciada), situação de funcionamento
- Infraestrutura: biblioteca, laboratórios, quadras, pátio, parque, piscina, salas de arte/música/dança, salas utilizadas e climatizadas
- Equipamentos e tecnologia: TV, som, DVD, lousa digital, multimídia, desktops, notebooks e tablets para alunos (com quantidades), internet para aprendizagem
- Material pedagógico: multimídia, infantil, científico, musical, jogos, artístico, desportivo, educação especial e demais categorias
- Processo seletivo e reservas de vaga, redes sociais, órgãos colegiados, educação ambiental
- Oferta de etapas: creche, pré-escola, fundamental I e II, médio (todas as formas), EJA e profissional, em turmas comuns e em classes especiais exclusivas

Três campos previstos no dicionário (`in_material_esp_quilombola`, `in_material_esp_indigena`, `in_material_esp_nao_utiliza`) não existem na fonte 2025 e ficam nulos em todos os registros — mantidos no schema para compatibilidade com edições futuras.

## Regras de integridade e acesso

- Chave: ano do censo + código da escola, permitindo adicionar anos futuros sem conflito
- Travas garantindo que só entrem escolas da rede privada e em atividade
- Índices por município, categoria da escola privada e localização
- Leitura liberada apenas para usuários autenticados (base pública do INEP, sem dado pessoal); nenhuma escrita pelo app — a carga é feita por processo administrativo

## Carga dos dados

Importação dos 42.454 registros do JSON do pacote, em lotes, de forma idempotente (rodar de novo atualiza, não duplica). Validação final: contagem de 42.454 linhas para 2025, códigos de escola distintos sem duplicidade e amostra de municípios grandes comparada ao arquivo de origem.

## Detalhes técnicos

- DDL aplicada byte a byte a partir de `censo_escolas_privadas_ativas_2025.sql` do pacote (PK `(nu_ano_censo, co_entidade)`, CHECKs de `co_rede = 2` e `tp_situacao_funcionamento = 1`, três índices).
- Complemento na mesma migração: `GRANT SELECT` para `authenticated`, `GRANT ALL` para `service_role`, RLS habilitada e política de leitura para autenticados.
- Carga como operação de dados (não migração), lendo o JSON do pacote com `ON CONFLICT (nu_ano_censo, co_entidade) DO UPDATE`.
- O arquivo bruto (134 MB) não entra no repositório; os dados ficam apenas no banco.

## Fora do escopo

Nenhum uso dos dados no frontend nesta etapa — o cruzamento com carteiras/censo atual do paper (infraestrutura como diferencial competitivo) fica para uma etapa seguinte.
