---
phase: 260506-sjk-criar-card-de-progresso-semanal-no-dashb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/src/components/home/HomeWeeklyProgressCard.tsx
  - apps/web/src/pages/Home.tsx
  - apps/web/src/styles/app.css
autonomous: true
requirements:
  - QUICK-260506-SJK
must_haves:
  truths:
    - "No dashboard Broto Web, o usuário vê um novo card chamado \"Seu progresso esta semana\" ao lado do card \"Seu Broto\" em telas com espaço horizontal."
    - "Em telas estreitas, o card de progresso semanal empilha abaixo do HomePetBanner sem quebrar o layout atual."
    - "O card usa dados mockados isolados no próprio componente, sem nova biblioteca e sem acoplar dados falsos a hooks ou pacotes compartilhados."
  artifacts:
    - path: "apps/web/src/components/home/HomeWeeklyProgressCard.tsx"
      provides: "Componente visual do card de progresso semanal com mock local"
      exports: ["HomeWeeklyProgressCard"]
    - path: "apps/web/src/pages/Home.tsx"
      provides: "Wiring do novo card no hero do dashboard"
      contains: "HomeWeeklyProgressCard"
    - path: "apps/web/src/styles/app.css"
      provides: "Estilos responsivos do novo card e ajuste do hero de solo para duas colunas"
      contains: "broto-weekly-progress-card"
  key_links:
    - from: "apps/web/src/pages/Home.tsx"
      to: "apps/web/src/components/home/HomeWeeklyProgressCard.tsx"
      via: "import named export and render inside .broto-dashboard-hero"
      pattern: "import \\{ HomeWeeklyProgressCard \\}.*HomeWeeklyProgressCard"
    - from: "apps/web/src/pages/Home.tsx"
      to: "apps/web/src/styles/app.css"
      via: "classes .broto-dashboard-hero, .broto-dashboard-hero__aside and .broto-weekly-progress-card"
      pattern: "broto-dashboard-hero__aside"
---

<objective>
Criar um card de dashboard Broto Web chamado "Seu progresso esta semana" para ocupar o espaço horizontal vazio ao lado do HomePetBanner/"Seu Broto".

Purpose: melhorar a densidade informativa do topo do dashboard sem alterar a arquitetura de dados nem introduzir dependências.
Output: um componente novo com mock local, renderizado no hero da Home, com CSS responsivo compatível com o layout atual.
</objective>

<execution_context>
@$HOME/.cursor/get-shit-done/workflows/execute-plan.md
@$HOME/.cursor/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@apps/web/src/pages/Home.tsx
@apps/web/src/components/home/HomePetBanner.tsx
@apps/web/src/styles/app.css
@apps/web/package.json

<interfaces>
Use os padrões atuais do Broto Web:

```typescript
// apps/web/src/pages/Home.tsx
export function Home() {
  // ...
  return (
    <div className="broto-home-dashboard">
      {/* ... */}
      <div className="broto-dashboard-hero broto-dashboard-hero--solo">
        <HomePetBanner />
      </div>
      {/* ... */}
    </div>
  )
}
```

```typescript
// apps/web/src/components/home/HomePetBanner.tsx
export function HomePetBanner() {
  return (
    <section className="broto-home-pet-banner broto-home-pet-banner--square">
      {/* card do Broto */}
    </section>
  )
}
```

```css
/* apps/web/src/styles/app.css */
.broto-dashboard-hero {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 22px;
  align-items: stretch;
  min-width: 0;
}

@media (min-width: 720px) {
  .broto-dashboard-hero {
    display: grid;
    grid-template-columns: minmax(292px, 336px) minmax(0, 1fr);
    gap: 22px;
    align-items: stretch;
  }
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Criar o card de progresso semanal</name>
  <files>apps/web/src/components/home/HomeWeeklyProgressCard.tsx</files>
  <action>
    Criar `HomeWeeklyProgressCard` como function declaration com named export, seguindo o estilo web existente: imports mínimos, sem biblioteca nova e sem default export.

    Manter os dados mockados isolados no próprio arquivo em uma constante `WEEKLY_PROGRESS_MOCK`, com valores simples e fáceis de substituir depois, por exemplo:
    - meta semanal: 25 questões
    - questões concluídas: 18
    - acertos: 13
    - tempo estudado: "4h 20min"
    - sequência visual de 7 dias com estados `done`, `active`, `upcoming`

    Renderizar uma `<section className="broto-weekly-progress-card" aria-labelledby="broto-weekly-progress-title">` com:
    - kicker curto, por exemplo "Resumo da semana"
    - título exatamente "Seu progresso esta semana"
    - indicador principal de progresso em porcentagem calculado localmente
    - barra de progresso com `role="progressbar"`, `aria-valuemin`, `aria-valuemax` e `aria-valuenow`
    - métricas compactas de questões, acertos e tempo
    - trilha de 7 dias sem usar datas reais nem buscar API

    Não usar `any`, não exportar os mocks, não tocar em hooks (`useProgress`, `usePet`, `useUser`) e não adicionar strings em inglês na UI.
  </action>
  <verify>
    <automated>npm run typecheck --workspace=@broto/web</automated>
  </verify>
  <done>
    `HomeWeeklyProgressCard` existe, compila, usa mock local apenas no próprio arquivo e expõe o título "Seu progresso esta semana".
  </done>
</task>

<task type="auto">
  <name>Task 2: Renderizar o card ao lado do HomePetBanner</name>
  <files>apps/web/src/pages/Home.tsx</files>
  <action>
    Importar `HomeWeeklyProgressCard` de `@/components/home/HomeWeeklyProgressCard`.

    No hero do dashboard, substituir o wrapper atual `className="broto-dashboard-hero broto-dashboard-hero--solo"` por `className="broto-dashboard-hero"` para reativar o grid de duas colunas já existente em `app.css`.

    Renderizar o novo card ao lado do `HomePetBanner` usando o contêiner já previsto pelo CSS:

    ```tsx
    <div className="broto-dashboard-hero">
      <HomePetBanner />
      <div className="broto-dashboard-hero__aside">
        <HomeWeeklyProgressCard />
      </div>
    </div>
    ```

    Preservar o `PetCard` legado oculto exatamente como está, sem mover hooks existentes e sem alterar `HomeRightSidebar`.
  </action>
  <verify>
    <automated>npm run typecheck --workspace=@broto/web</automated>
  </verify>
  <done>
    A Home renderiza `HomePetBanner` e `HomeWeeklyProgressCard` no mesmo hero, sem a classe `broto-dashboard-hero--solo`, mantendo o card legado oculto no DOM.
  </done>
</task>

<task type="auto">
  <name>Task 3: Estilizar o card e preservar responsividade</name>
  <files>apps/web/src/styles/app.css</files>
  <action>
    Adicionar estilos BEM-like com prefixo `broto-weekly-progress-card` próximos aos estilos do `broto-home-pet-banner`, usando somente CSS variables e padrões já presentes no arquivo.

    O layout deve:
    - ficar empilhado em mobile pelo `flex-direction: column` existente de `.broto-dashboard-hero`
    - ocupar a segunda coluna a partir de `min-width: 720px` via `.broto-dashboard-hero__aside`
    - alinhar altura com o card do Broto em desktop, usando `height: 100%`, `min-height` compatível com os 280px já usados no banner e sem `position: fixed`
    - não depender da classe `broto-dashboard-hero--solo` para o novo comportamento
    - manter os ajustes grandes existentes em `@media (min-width: 1100px)` sem transformar `.broto-dashboard-hero` em `display: contents`

    Incluir variantes de tema claro em `:root[data-theme="light"]` para o novo card, espelhando a abordagem do `broto-home-pet-banner`: fundo claro, borda discreta e texto com tokens `--text-*`.

    Não remover estilos antigos do `broto-dashboard-hero--solo` a menos que isso seja necessário para evitar conflito; se ficarem sem uso, deixe-os para minimizar risco.
  </action>
  <verify>
    <automated>npm run build --workspace=@broto/web</automated>
  </verify>
  <done>
    O card aparece ao lado do HomePetBanner em telas médias/desktop, empilha em telas estreitas, respeita tema claro/escuro e o build do web passa.
  </done>
</task>

</tasks>

<verification>
Executar:

```bash
npm run typecheck --workspace=@broto/web
npm run build --workspace=@broto/web
```

Opcionalmente abrir o dashboard em `npm run dev --workspace=@broto/web` e conferir:
1. O título "Seu progresso esta semana" aparece no topo do dashboard.
2. Em largura desktop, o novo card ocupa o espaço ao lado do card "Seu Broto".
3. Em largura mobile/tablet estreita, os cards ficam empilhados sem overflow horizontal.
4. O restante da Home e a sidebar continuam no mesmo lugar.
</verification>

<success_criteria>
- Um único card novo de progresso semanal foi adicionado ao dashboard Broto Web.
- O card usa mock local isolado e não introduz bibliotecas.
- O layout atual do dashboard é preservado, apenas deixando de ser "solo" no hero do Broto.
- `npm run typecheck --workspace=@broto/web` e `npm run build --workspace=@broto/web` passam.
</success_criteria>

<output>
Após concluir a execução, criar `.planning/quick/260506-sjk-criar-card-de-progresso-semanal-no-dashb/260506-sjk-SUMMARY.md`.
</output>
