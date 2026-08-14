# Carteiras V3 no banco — carga inicial

Subir a base de carteiras (34.524 escolas, 76 carteiras, 72 campos) para o banco, sem mexer no funcionamento atual do app. Os arquivos JSON de carteira continuam onde estão e a tela "Minha Carteira" segue funcionando como hoje.

## O que será feito

1. **Criar a tabela de carteiras** aplicando integralmente o SQL entregue (`carteiras_supabase.sql`), sem reescrever:
   - tabela `carteiras_escolas_v3` com os 72 campos, todos os códigos como texto (zeros à esquerda preservados);
   - validações de UF, CEP, CEP5, DDD, telefone, CNPJ, coordenadas, contrato e contagens;
   - índices por consultor, gerente, escola, UF/município, CEP5 e alvos comerciais;
   - view de apresentação `vw_carteiras_etapa_2_1` com telefone formatado, total de alunos e marcação de código repetido;
   - funções administrativas de reset e validação, restritas ao papel de serviço;
   - sem chave única em `cod_protheus` (a fonte tem 13 códigos repetidos, 14 linhas excedentes).

2. **Regras de acesso** conforme o pacote: ninguém sem login lê nada, nenhuma escrita pelo app; Consultor vê apenas as escolas em que o código dele bate com o código do responsável pela carteira; Diretor e Administrador veem tudo; Gerente e Supervisor ficam sem leitura até a regra hierárquica da Etapa 2.2 ser definida.

3. **Importar os 34.524 registros** a partir do `carteiras_v3.json` do pacote, em lotes, direto no banco. O JSON de 65 MB não entra no projeto nem na pasta pública — é lido apenas do arquivo enviado durante a carga.

4. **Validar a carga** e reportar os números: 34.524 registros, 34.510 escolas distintas, 76 carteiras, 13 códigos repetidos, além de contagem por consultor e de registros sem telefone/coordenadas.

## O que NÃO muda agora

- Nenhuma tela é alterada; nada de login nesta rodada.
- `public/data/carteiras/*.json` e o manifest permanecem intactos.
- A carteira demo `Kaue Pastrello` não é afetada.

## Detalhes técnicos

- A migration é o conteúdo do `carteiras_supabase.sql` aplicado byte a byte, com um ajuste apenas se algum comando for rejeitado pela plataforma (ex.: `revoke` em papéis gerenciados) — nesse caso o equivalente permitido é usado e informado.
- A importação usa a ferramenta de dados do banco em lotes (~1.000 linhas por lote), não o script `importar_carteiras_supabase.mjs`, pois a chave de serviço não fica disponível neste ambiente. O efeito é o mesmo: tabela zerada e recarregada integralmente.
- `carteiras_por_consultor_v3.zip` e `manifest_carteiras_v3.json` não são usados nesta etapa; ficam de reserva para quando a Etapa 2.1 passar a ler do banco.

## Pendências registradas para a próxima fase

- Regra de leitura para Gerente e Supervisor (Etapa 2.2).
- Destino da carteira técnica `Vendedor Padrão PE` (hoje visível só para Diretor/Administrador).
- Consolidação dos 13 códigos de escola repetidos.
- Ligação de `cep5` com a base demográfica.
