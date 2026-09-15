# Fontes da verdade — Paper Comercial V2

## GitHub
Fonte oficial de codigo, DDL, migrations V2, contratos, regras, testes e documentacao. Em conflito entre conversa/prompts e repositorio, prevalece o estado versionado aprovado.

## Lovable Cloud
Runtime da aplicacao e banco operacional PRIMARY. Nao e fonte oficial de documentacao. Alteracoes permanentes de codigo nao devem ser feitas por mensagens ao agente do Lovable; entram pela branch Git conectada.

## Supabase externo
Projeto `vevmnoxbjdkibdwfygfn`. Papel oficial: REPLICA independente, auditoria e consultas auxiliares. Nao deve originar escrita automatica para o PRIMARY.

## Figma
Referencia visual e UX. O codigo versionado no GitHub e a implementacao executavel.

## ChatGPT
Orquestracao, implementacao assistida, pesquisa, auditoria e QA. Nenhuma decisao deve depender exclusivamente da memoria de um chat; decisoes permanentes precisam ser promovidas ao GitHub.

## Regras de conflito

1. GitHub x banco: GitHub define o schema esperado; divergencia deve ser investigada antes de escrever.
2. PRIMARY x REPLICA: PRIMARY e autoritativo; reparo sempre PRIMARY -> REPLICA.
3. Figma x codigo: a decisao aprovada deve ser sincronizada entre ambos; regra de negocio estrutural fica documentada no GitHub.
4. README legado x V2: migrations e regras legadas sao evidencia historica, nao instrucao automatica para reconstruir o banco.
