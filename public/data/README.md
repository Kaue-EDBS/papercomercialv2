# Dados do Paper Comercial

Este diretório guarda os JSONs estáticos que alimentam o app. Todos são gerados
por scripts versionados em `/scripts/` — não edite à mão.

## Arquivos

| Arquivo | Origem | Como regenerar |
|---|---|---|
| `censo_escolar.json` | Censo Escolar INEP (anual) | pipeline externo |
| `censo_by_uf/*.json` | Split do censo por UF | `node scripts/split-censo.js` |
| `censo_inep_index.json` | Índice INEP → UF | gerado junto com o split |
| `base_demografica.json` | IBGE + IDH municipal | pipeline externo |
| `setorizacao_2026.json` | Planilha de Setorização Comercial | reprocessar XLSX |
| `carteiras/*.json` | Derivado da Setorização, um por consultor | junto com a setorização |
| `carteiras/manifest.json` | Lista de consultores + metadata | junto com a setorização |
| `base_consultores.json` | Lista canônica de consultores ativos | manual |
| `potencial_consumo.json` | Cálculo de potencial por município | pipeline externo |

## Validação

Antes de cada deploy:

```bash
npm run validate:data
```

Confere campos obrigatórios, contagens razoáveis e presença das carteiras do
manifest. Falha com exit != 0 se algo estiver fora — adequado para CI.

## Periodicidade

- Censo escolar: anual (INEP)
- Setorização: a cada mudança de carteira
- Demográfica / potencial: anual

Ao regenerar a setorização, atualize `carteiras/` no mesmo commit.