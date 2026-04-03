# 01-02 Summary

## O que foi entregue

- Criado `tsconfig.base.json` na raiz com opcoes comuns de TypeScript.
- `apps/web/tsconfig.json`, `apps/admin/tsconfig.json`, `apps/mobile/tsconfig.json` e `packages/shared/tsconfig.json` passaram a estender `../../tsconfig.base.json`.
- Arquivos de re-export de questions foram removidos:
  - `apps/mobile/lib/types/questions.ts`
  - `apps/web/src/lib/types/questions.ts`
- Callers foram atualizados para importar tipos diretamente de `@broto/shared`.

## compilerOptions do tsconfig.base.json

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "moduleResolution": "bundler",
  "strict": true,
  "skipLibCheck": true,
  "noFallthroughCasesInSwitch": true,
  "isolatedModules": true,
  "moduleDetection": "force",
  "noEmit": true,
  "esModuleInterop": true
}
```

## Arquivos de caller atualizados

### Mobile

- `apps/mobile/app/enem-questions.tsx`
- `apps/mobile/components/questions/QuestionPlayer.tsx`
- `apps/mobile/hooks/use-questions-filters.ts`

### Web

- `apps/web/src/components/questions/AreaSelector.tsx`
- `apps/web/src/components/questions/FilterPanel.tsx`
- `apps/web/src/components/questions/QuestionPlayer.tsx`
- `apps/web/src/hooks/useQuestionsFilters.ts`

## Validacoes

- `npx tsc --noEmit --project apps/web/tsconfig.json` passou.
- `npx tsc --noEmit --project apps/mobile/tsconfig.json` passou.
- Busca por `lib/types/questions` sem resultados remanescentes.

## Commits relacionados

- `9f9d8aa0` - consolidacao de tsconfig base
- `c26487be` - remocao dos re-exports e atualizacao dos imports
