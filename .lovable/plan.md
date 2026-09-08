# Zerar os dados do aplicativo

Hoje o app não lê nada do banco: todas as telas se alimentam de arquivos de planilha convertidos que ficam dentro do próprio projeto (193 MB em `public/data`). Antes da nova ingestão, esses arquivos saem e o código deixa de consultá-los.

## O que sai

Arquivos de dados removidos do projeto:

- Setorização 2026, base de consultores e todas as carteiras individuais (incluindo o manifesto e a carteira fake Kaue Pastrello)
- Censo escolar (arquivo único, índice por INEP e os arquivos por UF)
- Base demográfica (JSON e CSV)
- Latitude/longitude por código Protheus
- Potencial de consumo
- Renda por faixa etária

## O que muda no código

Cada leitura de arquivo local vira um ponto de conexão vazio, aguardando o banco:

| Trecho | Situação nova |
|---|---|
| Setorização, consultores, manifesto e carteira | Retornam lista vazia, sem carregamento infinito |
| Censo e demográfica | Retornam vazio; a busca por escola informa "nenhuma base carregada" |
| Lat/long, potencial de consumo, renda por faixa etária | Retornam vazio |

Comportamento visível:

- O login por código Protheus deixa de encontrar qualquer consultor e exibe aviso de base indisponível (nenhuma tela é apagada).
- A busca por INEP/Protheus não retorna escolas e mostra estado vazio, em vez de erro ou tela em branco.
- As páginas do paper e a rota `/apresentacao/:inep` continuam existindo, exibindo estado vazio.
- Exportações de PDF/PPTX permanecem no código, apenas sem dados para exportar.

Nenhuma tela, layout ou regra de cálculo é apagada — só a fonte de dados.

## Detalhes técnicos

- `rm -rf public/data`; o script `scripts/split-censo.js` fica marcado como obsoleto (sem entrada de dados).
- Hooks ajustados: `useSetorizacao`, `useConsultores`, `useCarteiraManifest`, `useCarteira`, `useApresentacaoData`, `useDataLoader`, `useLatLongProtheus`, `usePotencialConsumo`, `useRendaFaixaEtaria` — mesma assinatura pública (mesmos campos de retorno), sem `fetch`, `loading: false`, dados vazios, com comentário apontando a futura origem no banco.
- Tipos em `src/lib/types.ts` e a lógica de `src/lib/analysis.ts` permanecem intactos, para as consultas ao banco reaproveitarem tudo.
- Build de produção validado ao final.

## Próximo passo (fora deste escopo)

Criar a tabela principal de carteiras dos consultores e religar os hooks, um a um, às consultas do banco.
