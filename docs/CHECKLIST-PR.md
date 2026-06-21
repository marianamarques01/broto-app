# Checklist de PR — Broto

Use em **todo** pull request antes de merge.

---

## 1. Contexto (agente ou humano)

- [ ] Li `CONTEXT.md`
- [ ] Sei em qual módulo estou (web / admin / shared / supabase)
- [ ] Se multi-tenant: consultei `docs/multi-tenant/`

---

## 2. Gates automáticos

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:shared    # ou npm run test
npm run build
```

- [ ] Todos verdes

---

## 3. Arquitetura

- [ ] Lógica reutilizável está em `packages/shared` (não duplicada)
- [ ] `packages/shared` não importa React / React Native / Expo
- [ ] Nenhum import entre `apps/web` ↔ `apps/admin`
- [ ] Arquivos novos < 400 linhas (ou justificativa)

---

## 4. Segurança

- [ ] Nenhum secret no diff (`.env`, service role, API keys)
- [ ] Edge function usa `authz.ts` + `cors.ts`
- [ ] Input validado em endpoints novos/alterados
- [ ] HTML de questões sanitizado com DOMPurify (web)
- [ ] Mudança de schema tem migration + verificação RLS

---

## 5. Testes

- [ ] Lógica nova em shared tem teste Vitest
- [ ] Edge function nova/alterada tem `Deno.test` (quando aplicável)
- [ ] Testei manualmente o fluxo feliz

---

## 6. Produção (se PR de deploy/config)

- [ ] `.env.example` atualizado
- [ ] `ALLOWED_ORIGINS` considerado
- [ ] Documentação em `docs/` se mudou contrato de API

---

## Referências rápidas

| Arquivo | Propósito |
|---------|-----------|
| `CONTEXT.md` | Índice mestre |
| `.planning/PRODUCTION-ROADMAP.md` | Etapas + prompts |
| `.cursor/rules/*.mdc` | Regras para agentes |
| `docs/multi-tenant/` | Permissões e RLS |
