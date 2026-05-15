# Summary

- Renderizei os modais informativos de "Dicas" e "Sessão em grupo" via portal no `document.body`.
- Mantive o backdrop e as classes existentes, preservando o visual atual e removendo a dependência do container animado da página para centralização.
- Corrigi imports ausentes no mesmo componente que quebravam o typecheck.
- Validei diagnósticos do arquivo editado e `npm run typecheck --workspace=@broto/web` sem erros.
