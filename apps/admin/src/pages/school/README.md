# Export PDF — painel Escola (MVP)

## Abordagem

O botão **Exportar PDF** usa `window.print()` com CSS `@media print` em `org-report-print.css`.
Não há edge function `org-report-export` nesta wave — PDF server-side fica para INST-12 v2.

## Smoke test manual

1. Login como `org_admin` ou `owner` com snapshots de engajamento.
2. Acesse `/escola` → aba **Visão geral**.
3. Clique **Exportar PDF**.
4. No diálogo de impressão do navegador:
   - Destino: **Salvar como PDF**
   - Verifique: logo Broto, nome da org, métricas, ranking de turmas, alertas (se houver).
5. Login como `teacher` → `/escola` deve redirecionar para `/` (gate de role).
6. Cross-tenant: coordenador org A não vê dados org B (RLS + `requireMembership` na API).

## Formato CSV (importação)

```csv
email,nome,turma_codigo
aluno@escola.com,João Silva,ABC123
```

Endpoint: `POST org-students-import` com body `{ organizationId, rows }`.

## Próximo passo (v2)

- Edge `org-report-export` com pdf-lib e identidade visual da org
- Watermark + data de geração automática no PDF server-side
