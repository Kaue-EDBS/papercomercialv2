# Zerar o banco e reconstruir a partir das carteiras

Apagar todas as tabelas atuais e recomeçar a ingestão, tendo a base de carteiras dos consultores como tabela central. As demais bases entram depois, uma por vez, sempre ligadas a ela.

## Etapa 1 — Limpeza total

Apagar todas as tabelas hoje existentes, incluindo as de acesso (você confirmou "apagar tudo mesmo"):

- carteiras_escolas_v3 (e a visão vw_carteiras_etapa_2_1)
- censo_escolas_privadas_ativas
- enem_medias_municipio
- densidade_demografica_cep5
- cadastros, profiles, user_roles, telemetry_events
- funções e gatilhos ligados a essas tabelas (criação de perfil no cadastro, verificação de papel, importação e validação de carteiras)

Consequência: o login por e-mail e os papéis de administrador param de existir até recarregarmos a base de cadastros. As telas que hoje leem essas tabelas ficam sem dados até a nova carga — nenhuma tela será alterada nesta rodada.

## Etapa 2 — Carteiras dos consultores (tabela principal)

Aguardo o seu arquivo/SQL de carteiras. Ao recebê-lo, crio a tabela exatamente como o pacote definir, com as chaves que sustentam os relacionamentos:

- Código Protheus da escola
- Código INEP da escola
- Município + código do município
- CEP5
- Consultor e gerente responsáveis

Índices nesses cinco pontos, para que as junções com as demais bases sejam rápidas.

## Etapa 3 — Relacionamentos das bases seguintes

| Base | Liga-se à carteira por |
|---|---|
| Demográfica / potencial de consumo | Município primeiro e, dentro dele, o CEP5 |
| Censo Escolar 2024 e 2025 | Código INEP |
| Médias do ENEM | Código do município |

- **Demográfica**: chave composta município + CEP5, na ordem que você descreveu — a consulta filtra o município e só então busca o CEP5, evitando CEP5 repetido entre cidades.
- **Censo**: uma única tabela com uma coluna de ano, chave por escola + ano, permitindo comparar 2024 com 2025.
- **ENEM**: chave por ano + código do município.

Cada base entra em uma rodada própria, com validação e contagem de registros ao final, e um relatório de quantas escolas da carteira encontraram par em cada base.

## Etapa 4 — Acesso

Depois das cargas, recriamos cadastros, perfis e papéis a partir do arquivo de cadastros, restaurando o login por e-mail e a regra de que cada consultor enxerga apenas a própria carteira.

## Detalhes técnicos

- Migration única de limpeza com DROP TABLE ... CASCADE nas tabelas do schema public, DROP das funções (`handle_new_user`, `has_role`, `import_cadastros`, `reset_carteiras_escolas_v3`, `validar_carteiras_escolas_v3`, `touch_updated_at`) e do gatilho `on_auth_user_created` em auth.users; o tipo `app_role` é removido junto e recriado na etapa de acesso.
- Usuários já criados em auth.users não são apagados (schema gerenciado), mas ficam sem perfil/papel até a Etapa 4.
- Toda tabela nova em public recebe GRANT explícito para `authenticated`/`service_role`, RLS habilitada e políticas de leitura autenticada; escrita apenas por papel de serviço/administrador.
- Colunas de código (Protheus, INEP, município, CEP5) sempre como texto, preservando zeros à esquerda; o município normalizado por código do IBGE quando disponível, com o nome como apoio.
- Carga em lotes via ferramenta de dados, idempotente (tabela zerada e recarregada por completo a cada ingestão).

## Fora do escopo agora

Nenhuma mudança de tela, nenhum ajuste no fluxo do paper, e os planos anteriores de Material Próprio e Didático e Apoio seguem suspensos.
