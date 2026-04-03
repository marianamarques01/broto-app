# 01-03 Summary

## Novo glob de formatacao

`format` e `format:check` foram atualizados para:

`prettier --check "apps/*/src/**/*.{ts,tsx}" "apps/mobile/{app,hooks,lib,components,contexts,theme}/**/*.{ts,tsx}" "packages/*/src/**/*.{ts,tsx}" "supabase/functions/**/*.ts"`

## Prova de cobertura mobile

- `npm run format:check` passou a listar arquivos de `apps/mobile/...` imediatamente apos a mudanca de glob.
- Antes do commit de formatacao, o comando listou dezenas de arquivos mobile; na execucao da fase, o volume observado foi consistente com **48 arquivos mobile** tocados no commit de formatacao subsequente.

## Prova de regras ESLint ativas

Apos incluir os novos blocos em `eslint.config.mjs`, `npm run lint` reportou erros de `@typescript-eslint/no-floating-promises`, por exemplo:

- `apps/admin/src/contexts/AdminAuthContext.tsx` (`no-floating-promises`)
- `apps/web/src/contexts/AuthContext.tsx` (`no-floating-promises`)

Tambem nao houve erro de parsing de configuracao (`Parsing error`).

## Commits

- `5045c933` - glob do Prettier atualizado para incluir mobile
- `1aedaf69` - regras ESLint adicionadas (`no-restricted-imports` + `no-floating-promises`)
