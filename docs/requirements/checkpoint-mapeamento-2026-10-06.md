# Checkpoint — mapeamento inicial de lógica do Paper Comercial V2

Data: 06/10/2026
Repositório: Kaue-EDBS/papercomercialv2
Eixo: lógica de programação inicial
Estado: EM ANDAMENTO

## Regra do eixo

Este primeiro eixo será construído por mapeamento guiado de até 100 perguntas, cobrindo entradas, saídas, atores, estados, transições e exceções dos fluxos principais.

Os demais eixos também serão construídos por mapeamentos, com até 50 perguntas por eixo.

## Decisões consolidadas — 1 a 10

### 1. Objetivo central
O Paper Comercial V2 tem como ação principal consultar uma escola específica e entregar informações que apoiem a preparação e a condução da visita comercial.

A escola é a entidade central do fluxo principal.

### 2. Formas de localizar uma escola
O usuário pode localizar uma escola por:
- COD_PROTHEUS
- COD_INEP
- CD_ESCOLA
- NOME ESCOLA

### 3. Busca por nome na rota /filtragem
A busca por nome ocorre de forma hierárquica:
1. UF começa liberada.
2. Município começa bloqueado.
3. O usuário pode abrir a lista de UFs, rolar ou digitar com autocomplete.
4. Após selecionar a UF, o sistema libera somente os municípios daquela UF.
5. O usuário seleciona o município por lista ou autocomplete.
6. Somente então aparece o campo Nome da Escola.
7. O campo de escola usa autocomplete restrito ao recorte UF + Município.
8. Se o autocomplete resolver, o usuário seleciona a escola diretamente.
9. Se não resolver, o sistema exibe uma tabela.

Tabela:
| NOME ESCOLA | COD_PROTHEUS | COD_INEP | CD_ESCOLA |
|---|---|---|---|

Transições:
- UF_DISPONIVEL -> UF_SELECIONADA
- UF_SELECIONADA -> MUNICIPIO_DISPONIVEL
- MUNICIPIO_DISPONIVEL -> MUNICIPIO_SELECIONADO
- MUNICIPIO_SELECIONADO -> BUSCANDO_ESCOLA
- BUSCANDO_ESCOLA -> ESCOLA_SELECIONADA, quando o autocomplete resolve
- BUSCANDO_ESCOLA -> TABELA_ESCOLAS, quando o autocomplete não resolve
- TABELA_ESCOLAS -> ESCOLA_SELECIONADA, ao escolher uma linha

Regras de limpeza:
- trocar UF limpa Município e Escola;
- trocar Município limpa Escola.

### 4. Busca rápida por código
Na rota /filtragem haverá uma busca rápida por código no topo.

O usuário pode informar COD_PROTHEUS, COD_INEP ou CD_ESCOLA sem selecionar UF e Município previamente.

Se houver uma única correspondência, o sistema preenche automaticamente UF, Município e Escola e leva o fluxo a ESCOLA_SELECIONADA.

### 5. Código duplicado ou ambíguo
Se COD_PROTHEUS, COD_INEP ou CD_ESCOLA retornar mais de uma escola:
- o sistema não escolhe uma linha silenciosamente;
- exibe tabela de resultados;
- apresenta aviso discreto de duplicidade/inconsistência;
- permite escolher a escola e continuar;
- a ocorrência deve ficar disponível para futura correção/auditoria.

### 6. Escola fora da carteira
O consultor pode acessar e gerar a apresentação completa de uma escola fora da própria carteira, desde que registre uma justificativa.

Fluxo:
ESCOLA_FORA_DA_CARTEIRA -> MOTIVO_OBRIGATORIO -> MOTIVO_REGISTRADO -> ACESSO_LIBERADO

Registrar pelo menos:
- usuário;
- data/hora;
- escola consultada;
- carteira associada/origem;
- motivo informado.

### 7. Formato da justificativa
Campo de texto livre obrigatório.

### 8. Validação da justificativa
- mínimo de 20 caracteres;
- máximo de 500 caracteres.

O sistema não libera a apresentação enquanto a justificativa não estiver válida.

### 9. Aprovação do acesso excepcional
Após registrar um motivo válido, o acesso é liberado imediatamente.

Não há aprovação prévia de gestor ou admin.

### 10. Recorrência da justificativa
O motivo é exigido em toda nova consulta a uma escola fora da carteira, mesmo para o mesmo consultor e a mesma escola.

Não existe autorização permanente derivada de justificativas anteriores.

## Estados adicionados ao mapeamento
- UF_DISPONIVEL
- UF_SELECIONADA
- MUNICIPIO_DISPONIVEL
- MUNICIPIO_SELECIONADO
- BUSCANDO_ESCOLA
- TABELA_ESCOLAS
- ESCOLA_FORA_DA_CARTEIRA
- MOTIVO_OBRIGATORIO
- MOTIVO_REGISTRADO
- ACESSO_LIBERADO

## Ponto exato de retomada

Pergunta 11/100 — em que momento o sistema deve pedir a justificativa de acesso a escola fora da carteira?

Opções ainda não decididas:
A. Assim que o usuário seleciona a escola fora da carteira, antes de carregar qualquer dado.
B. Permitir abrir a análise e exigir o motivo apenas antes de gerar a apresentação.
C. Mostrar somente dados básicos da escola e exigir o motivo para liberar os demais blocos.

Nenhuma opção foi aprovada.

Ao retomar, continuar diretamente pela Pergunta 11/100, sem refazer as decisões 1 a 10.
