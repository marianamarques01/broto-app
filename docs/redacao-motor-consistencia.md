# Consistência do motor de correção — REDA-03

**Prompt version:** `redacao-correct-v1.0`  
**Temperatura:** `0.1`  
**Meta inicial:** σ < 20 pontos por competência (mesma redação, N=10)

---

## Testes automatizados (CI)

Os testes Deno em `supabase/functions/_shared/redacao-correct-core_test.ts` cobrem:

| Cenário                        | O que valida                                    |
| ------------------------------ | ----------------------------------------------- |
| Texto &lt; 7 linhas            | Fator zero determinístico, **0 chamadas LLM**   |
| Perfis fraca / mediana / forte | `nota_total` crescente com mock calibrado       |
| Consistência mock 10×          | σ = 0 por competência (pipeline determinístico) |

Rodar:

```bash
npm run test:functions
```

---

## Teste live com OpenAI (pré-lançamento)

Quando a Cartilha estiver indexada e `OPENAI_API_KEY` disponível:

```bash
export OPENAI_API_KEY=sk-...
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...

# Submeter a mesma redacao_id 10× e registrar notas (script manual ou painel interno)
```

Registrar em tabela:

| Execução | I   | II  | III | IV  | V   | Total |
| -------- | --- | --- | --- | --- | --- | ----- |
| 1        |     |     |     |     |     |       |
| …        |     |     |     |     |     |       |
| 10       |     |     |     |     |     |       |

Calcular desvio padrão (σ) por competência. **Gate de lançamento:** σ &lt; 20 pts/competência.

---

## Amostras de calibração interna

Textos sintéticos em `redacao-correct-core_test.ts` (não reproduzem redações oficiais INEP):

- `REDACAO_FRACA` — 7 linhas, erros graves, proposta ausente
- `REDACAO_MEDIANA` — 15 linhas, estrutura básica
- `REDACAO_FORTE` — 25 linhas, repertório + proposta estruturada

---

## Audit trail persistido

Cada correção grava em `redacao_correcoes`:

- `prompt_version`
- `modelo_usado`
- `rag_chunks_used` (ids + similarity + step)

Isso permite auditar se a correção usou trechos da Cartilha INEP.
