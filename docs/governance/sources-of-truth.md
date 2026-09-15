# Fontes da verdade — Paper Comercial V2

## GitHub
Fonte oficial de código, DDL, contratos, regras aprovadas, testes e documentação. Regras removidas do estado atual não voltam a ser válidas por existirem no histórico.

## Lovable Cloud
Runtime e banco operacional PRIMARY. Mudanças permanentes entram pela branch Git conectada, não por prompts ao agente do Lovable.

## Supabase externo
`vevmnoxbjdkibdwfygfn` é a REPLICA externa confirmada. Nunca origina reparo automático para o PRIMARY.

## `supabase/config.toml`
Contém `chwsmkdkgdgocnbcyvmq`. Não trocar por `vevmnoxbjdkibdwfygfn`. O ID é tratado como identificador técnico provável do lado PRIMARY/Lovable, mas essa natureza não foi confirmada administrativamente porque a conexão Supabase externa não tem permissão sobre ele.

## Figma
Time `CIT` é o workspace visual oficial. `SIGMA` é apenas nome antigo/incorreto. Figma não define regra de negócio.

## ChatGPT
Orquestração e QA. Nenhuma decisão permanente depende somente do chat.

## Conflitos

1. GitHub x conversa: prevalece o estado versionado aprovado.
2. PRIMARY x REPLICA: PRIMARY é autoritativo.
3. História Git x branch atual: branch atual define o que é vigente; histórico não reativa regra removida.
4. Figma x código: Figma referencia UX/UI; GitHub contém a implementação executável.
