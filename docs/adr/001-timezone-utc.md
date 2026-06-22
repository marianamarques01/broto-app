# ADR 001: UTC everywhere para "dia" do produto

## Status

Aceito

## Contexto

O Broto define o "dia" do aluno em vários pontos do sistema:

- **Streak e missões diárias** — servidor e `@broto/shared` usam `todayUtcISO()` (data calendário UTC).
- **Rotina semanal** — `hojeIdx()` em `packages/shared/src/routine/generate-routine.ts` usava `Date.getDay()` (timezone local do dispositivo).

Para alunos no Brasil (UTC−3), isso gerava divergência: às 21h local a rotina já marcava "amanhã" enquanto streak e missões ainda contavam como "hoje".

## Decisão

**UTC everywhere** para qualquer lógica de "qual dia é hoje" no produto (streak, missões, rotina, heatmaps, bônus diário).

Implementação no cliente: preferir `getUTCDay()`, `todayUtcISO()` e equivalentes em vez de APIs locais (`getDay()`, `toLocaleDateString` sem timezone explícito).

## Consequências

### Positivas

- Comportamento consistente entre web, edge functions e `@broto/shared`.
- Um único critério de virada de dia — alinhado ao servidor.
- Menos bugs de "missão completa mas rotina no dia errado".

### Negativas

- Para usuários em UTC−3 (Brasil), o "dia" do produto muda às **21h horário local**, não à meia-noite local.
- UX pode parecer estranha para quem espera calendário local; documentar em suporte/FAQ se necessário.

## Rationale

**Consistência > conveniência de timezone local.** Misturar UTC no backend e local no frontend produz estados impossíveis de explicar ao usuário. Preferimos um deslocamento previsível (21h no Brasil) a dois relógios diferentes no mesmo app.

## Consumidores de `hojeIdx()`

| Local | Uso |
|-------|-----|
| `packages/shared/src/routine/generate-routine.ts` | `ehHoje` / `ehPassado` na rotina semanal |
| `apps/web/src/lib/routine.ts` | Re-export para a UI — herda UTC via shared |

Nenhum consumidor mantém timezone local; todos passam pelo shared.

## Referências

- `packages/shared/src/utils/today-utc-iso.ts`
- `packages/shared/src/daily-missions/core.ts`
- `supabase/functions/_shared/calendar-day.ts`
