# Student model — Bayesian Knowledge Tracing (BKT)

Modelo de domínio por tópico usado no Broto para estimar **P(Know)** — a probabilidade de o aluno dominar um tópico ENEM após cada resposta.

## Onde entra no produto

| Camada | Uso |
|--------|-----|
| `bkt.ts` | Função pura `updatePKnow` — fonte de verdade no `@broto/shared` |
| `supabase/functions/_shared/bkt.ts` | Cópia espelhada para deploy Deno (manter sincronizada) |
| `topic_performance.p_know` | Persistência por `(user_id, topico_value)` |
| `answer-question` | Lê prior, aplica BKT, grava novo `p_know` no upsert |
| `build-priority.ts` | Prioriza tópicos fracos por menor `pKnow` quando disponível |
| `user-progress` | Mescla `p_know` da tabela no payload `TopicoStat.pKnow` |

## Parâmetros default

| Parâmetro | Valor | Significado |
|-----------|-------|-------------|
| `pLearn` | 0.1 | Chance de aprender após uma tentativa |
| `pGuess` | 0.2 | Acerto por chute quando não domina |
| `pSlip` | 0.1 | Erro por descuido quando domina |
| Prior (`p_know` inicial) | 0.3 | Cold start em tópicos novos (migration) |

## Priorização no banco de questões

Quando `TopicoStat.pKnow` existe:

- Tópico “fraco” se `pKnow ≤ Q_BANK_WEAK_ACCURACY_PCT_MAX / 100` (0.62)
- Ordenação ascendente por `pKnow` (menor = mais urgente)

Fallback (sem `pKnow` ou dados legados): critérios anteriores com `accuracyPct` e os mesmos thresholds de amostra mínima.

## Testes

```bash
npm run test:shared -- bkt
```
