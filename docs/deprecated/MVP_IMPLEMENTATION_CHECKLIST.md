# Broto — Checklist de implementação do MVP (ENEM26)

**Fonte de verdade estratégica:** [QUESTIONS.md](./QUESTIONS.md)  
**Diagnóstico do repo (opcional):** [SYSTEM_UNDERSTANDING.md](./SYSTEM_UNDERSTANDING.md)  


**Data de síntese:** 2026-05-14

---

## Como usar este documento

1. Tratar itens marcados **P0** como bloqueadores de “MVP alinhado ao QUESTIONS.md”.
2. Itens **P1/P2** podem ser paralelizados quando não há dependência explícita.
3. Coluna **MVP** distingue: obrigatório, melhoria aceita no MVP, pós-MVP.
4. Resolver ou registrar decisões na seção **[Ambiguidades](#ambiguidades-a-fechar)** antes de codar o trecho afetado.
5. Antes de merge relevante, passar o olho em **[Verificação no código](#verificação-no-código-perguntas-para-o-time)**.

---

## North star do MVP

1. Produto: estudo gamificado **B2C para o vestibulando**, com posicionamento **mobile-first**, mas **entrega do MVP apenas na web**.
2. Canal único operado pelo time: **ENEM26** — sem foco em receita, pricing ou multi-tenant B2B elaborado neste ciclo.
3. Métrica-âncora: funil **cadastro → onboarding completo → primeiro simulado**.
4. Promessa no MVP: **ferramentas sólidas e ritmo livre** — não “plano pedagógico inteligente” completo; visão de plano guiado fica para depois.
5. Experiência: **Home como hub** (o que fiz hoje, fraquezas, próxima ação, simulado); **Routine** como plano do dia; rota **Progress** (`/progress`) **fora do foco** neste ciclo.
6. Núcleo técnico: **toda resposta persistida** para histórico e estado por questão; **simulado** e **banco** como pilares; **Study Area** com conteúdo **estático versionado no Git**, **sem NotebookLM em produção** para esse fluxo.

---

## Ordem sugerida de execução (dependências)

```text
P0: Funil signup → (FOCO) onboarding → primeiro simulado (mensurável)
     ↓
P0: Navegação / rotas — ocultar ou redirecionar Progress; hub Home + Routine
     ↓
P1: Gamificação (XP + streak), missões (servidor + XP real), streak UTC
     ↓
P1: Study Area estático — contrato atual, sem LM em prod
     ↓
P2: Conquistas passivas, pet cosmético, chat stateless, CSS modular incremental
     ↓
P3: Limpeza mobile não-crítica, doc React 18/19, observabilidade mínima
```

---

## Checklist de implementação

Legenda: **P** = prioridade (P0 crítico, P1 alto, P2 médio, P3 baixo).  
**MVP:** Obrig. = obrigatório alinhado ao doc; Melh. = melhoria ou dívida aceita no MVP; Pós = explicitamente depois do MVP.

| ID | Item | Área | Tipo | MVP | P | Dependências / notas |
|----|------|------|------|-----|---|------------------------|
| F-01 | Garantir fluxo mensurável **signup → onboarding → primeiro simulado** (CTA, bloqueios, estados vazios tratados) | web, shared | feature, UX | Obrig. | P0 | Instrumentação mínima do funil (evento, dashboard interno ou planilha no início) |
| F-02 | **Remover do caminho principal** a jornada **Progress**: esconder links, ou redirecionar `/progress` → Home (definir em [Ambiguidades](#ambiguidades-a-fechar)) | web | feature, remoção escopo | Obrig. | P0 | F-01 em parte |
| F-03 | **Home** como hub: estudo hoje, onde estou fraco, próxima ação clara, simulado — não painel analítico profundo | web | feature, UX | Obrig. | P0 | — |
| F-04 | **Routine** coerente como “plano do dia” em relação ao hub | web | feature | Obrig. | P1 | F-03 |
| G-01 | Gamificação ativa só **XP + streak**; **fase, humor, moedas** congelados / fora da UX do MVP | web, shared, Supabase | refatoração, UX | Obrig. | P1 | Não prometer economia com moedas na UI |
| G-02 | **Streak:** dia canônico **UTC**; perda **sem grace period**; copy honesta sobre “meia-noite” vs percepção local | shared, Supabase | dados, copy | Obrig. | P1 | Timezone no perfil = pós-MVP |
| G-03 | **Missões:** persistência **server-side**, **XP real**; arquitetura preparada para metas semanais/mensuais; **“3 por dia” = placeholder** | Supabase, shared, web | dados, feature | Obrig. | P1 | Validar implementação atual vs “servidor” |
| G-04 | **Conquistas:** modo **honras passivas**; catálogo **global**; sem loop de celebração pesado | web | feature, UX | Melh. | P2 | Alvo pós-MVP: celebração, badge forte |
| G-05 | **Pet:** evolução cosmética; nome por aluno; **fase só visual**; sem “vida” reativa; **moedas** sem uso ativo, coluna pode existir | web, DB | feature, dados | Obrig. | P2 | Não expor comportamento zumbi |
| G-06 | **Broto Chat:** **stateless**, tira-dúvidas pontuais, sem memória longa obrigatória | web, Edge, serviço | feature | Obrig. | P2 | — |
| C-01 | **Study Area:** conteúdo **estático no repo**; **nenhuma** chamada NotebookLM em produção para esse fluxo; curadoria versionada | web, shared | feature, conteúdo | Obrig. | P1 | Manter contrato (ex.: `StudyPackage`, mocks em shared) |
| C-02 | **Catálogo tópicos:** não reescrever modelo; **documentar** fontes (DB, TS, onboarding) e hierarquia plana | docs, shared | refatoração leve | Melh. | P2 | Evolução incremental |
| C-03 | Unificar leituras com tipo **`Student`** em `@broto/shared` onde fizer sentido + **`UserProfile` / user-me** | shared | refatoração | Obrig. | P2 | Reduz dois “alunos” no código |
| C-04 | **Histórico:** manter agregações atuais; **não** introduzir timeline canônica de eventos agora | Supabase | dados | Melh. | P3 | — |
| C-05 | **Notificações:** sem investimento MVP | — | escopo | Pós | — | — |
| C-06 | **Materiais:** biblioteca solta; **sem** novas entidades trilha/Aula/Módulo | admin, DB | escopo | Pós | — | — |
| B-01 | **B2B / pricing / multi-tenant elaborado:** fora do foco MVP | — | escopo | Pós | — | — |
| T-01 | **LGPD:** mínimo viável e auditável (bases, retenção, acesso ao titular, segredos em env, auth nas functions, validação em escritas) | Supabase, processo | dados, segurança | Obrig. | P1 | — |
| T-02 | **Anti-fraude pesada:** dívida explícita, não bloqueia lançamento do funil | Supabase | segurança | Dívida | P2 | Implementar quando risco justificar |
| U-01 | **Fragmentar `app.css`** por área/feature; refatoração incremental; **sem** migrar web inteiro para Tailwind sem decisão | web | refatoração | Melh. | P2 | Priorizar módulos do MVP |
| U-02 | Componentes **achievements / heatmap / routine performance** — **manter**, versionados, **integrados ao fluxo** (não descartar como experimento) | web | feature | Obrig. | P2 | Alinhamento: “passivo” vs “integrado ao fluxo” |
| M-01 | **Mobile:** fora do critério de aceite; reduzir superfície morta em vez de paridade fantasma | mobile | refatoração, limpeza | Melh. / dívida | P3 | — |
| M-02 | **React 18 vs 19:** aceitar divergência; **documentar** no repositório | docs | processo | Melh. | P3 | — |
| O-01 | **Testes E2E amplos / analytics sofisticado:** nível adequado ao MVP; evoluir após validar funil | ops | processo | Melh. | P3 | — |

---

## Ambiguidades a fechar

| ID | Tema | Opções | Decisão (preencher) |
|----|------|--------|---------------------|
| A-01 | Rota `/progress` | (a) Redirecionar 301/302 para Home (b) Página “em breve” (c) Remover rota | |
| A-02 | Missões “server-side” | Definir critério: apenas API persiste? Eventos obrigatórios? Migração de estado local? | |
| A-03 | Métrica do funil | Onde medir: produto analytics, eventos client-side, manual? | |
| A-04 | Conquistas “passivas” vs **integrados ao fluxo** (F6) | Definir “integrado” = visível na Home vs só em Progress dedicado removido | |

---

## Verificação no código (perguntas para o time)

Cruzar com o estado real do monorepo ao implementar:

1. **Navegação:** `Sidebar`, `MobileTabBar` ou rotas protegidas ainda expõem **Progress**? Alinhar com F-02.
2. **Perfil:** fluxos usam só **`user-me`** como fonte canônica do perfil no web, ou ainda há `supabase.from('users')` paralelo? (risco de divergência.)
3. **Missões:** persistência é majoritariamente **servidor** ou ainda **cliente + adapter**?
4. **Study Area:** garantir **zero** dependência de runtime NotebookLM neste fluxo no MVP.
5. **Pet / gamificação:** UI não deve refletir **moedas / fase / humor** como gameplay ativo se estão congelados (G-01, G-05).

---

## Conflitos documento ↔ repo (para não regredir)

| Tema | O que o QUESTIONS.md pede | Cuidado no código |
|------|---------------------------|-------------------|
| Progress | Não usar jornada Progress no MVP | Router pode ainda listar rota — sync com F-02 |
| Mobile | Fora do MVP | `apps/mobile` existe; não misturar critério de “pronto” com web |
| NotebookLM | Sem LM em produção no conteúdo Study Area | Serviço e chat podem existir — escopo Study Area separado |
| Gamificação | Só XP + streak ativos | DB e APIs podem expor colunas antigas — não reativar na UI sem decisão |
| `user-me` vs query direta | Unificar identidade aluno (C4) | Dois caminhos de perfil no web geram bugs no funil |

---

## Riscos e mitigações

| Risco | Mitigação sugerida |
|-------|-------------------|
| Mobile no repositório sem ser MVP | Documentar em README ou este arquivo; não exigir paridade; podar código morto quando seguro |
| Streak UTC vs percepção local | Copy clara; backlog timezone no perfil |
| Scope creep NotebookLM no Study Area | Code review explícito: LM só pós-MVP para fonte de conteúdo Study Area |
| Monólito `app.css` | Quebra incremental por feature tocada; evitar +500 linhas soltas no mesmo arquivo |
| Duas fontes de perfil no web | Priorizar `user-me` e remover leituras paralelas aos poucos |
| “Honras passivas” vs “integrados ao fluxo” | Fechar A-04; evitar dois times interpretando F6 diferente |
| Colunas zumbi (moedas, humor) | Não atualizar na UI; se API mudar, documentar como inativo |

---

## Pós-MVP (lembrar, não implementar agora)

- Timeline canônica de eventos (“o que o aluno fez quando”).
- Trilhas, entidade Aula, Módulos no conteúdo.
- Notificações in-app / push / e-mail.
- Multi-tenant B2B, pricing.
- Anti-fraude pesada quando o risco justificar.
- Loop forte de conquistas (modal, compartilhamento).
- Paridade mobile e notebook LM como **fonte** do Study Area (mantendo contrato UI).

---

## Changelog deste documento

| Data | Alteração |
|------|-----------|
| 2026-05-14 | Versão inicial derivada do QUESTIONS.md e checklist de alinhamento |
