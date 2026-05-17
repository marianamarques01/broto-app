# QUESTIONS.md

**Broto EdTech — Perguntas estratégicas para alinhamento antes da próxima refatoração**
Data: 2026-05-14
Companheiro deste documento: `SYSTEM_UNDERSTANDING.md`

> Este documento **não** lista questões técnicas isoladas (essas já estão em `BUSINESS_QUESTIONS.md` com 260 perguntas catalogadas). Aqui ficam as **perguntas estruturantes** — as que, respondidas, mudam o jeito de modelar todo o sistema.
>
> Estrutura por seções. Cada pergunta vem com:
> - **Contexto** (por que essa pergunta importa)
> - **Pergunta**
> - **Implicações** (o que muda dependendo da resposta)
> - **Resposta (MVP):** Decisões baseadas no direcionamento atual.

---

## Seção A — Identidade do produto (perguntas de fundo)

Essas perguntas decidem **o que o Broto é**. Tudo abaixo derivam delas.

### A1. Qual dos três produtos é o produto principal?
**Contexto:** o monorepo carrega três produtos (estudante mobile, estudante web, admin B2B) com graus de polimento diferentes. O web hoje tem mais features (achievements, heatmap, mistakes, performance series, recent mistakes), o mobile está em delay, o admin é minimalista.

**Pergunta:** o Broto, em um pitch de 30 segundos, é
- (a) "um app de estudo gamificado para o vestibulando individual" (B2C, mobile-first)
- (b) "uma plataforma escolar para cursinhos e escolas usarem com seus alunos" (B2B/B2B2C, admin-first)
- (c) "um assistente IA personalizado para ENEM" (chat/coach-first)
- (d) outra coisa

**Resposta:** (a) App de estudo gamificado para o vestibulando individual (B2C, **mobile-first** como posicionamento de produto). **MVP:** entrega somente **web**; mobile fica fora de escopo até pós-MVP.

### A2. Qual é a métrica-âncora?
**Pergunta:** se você tivesse **uma** métrica para olhar todo dia, qual seria?
- (a) Questões respondidas / aluno / dia
- (b) Streak médio (dias consecutivos)
- (c) DAU / MAU (engajamento puro)
- (d) Taxa de finalização de simulado
- (e) Tempo médio de sessão
- (f) Conversão signup → onboarding completo → primeiro simulado
- (g) NPS do professor (para B2B)

**Resposta:** (f) Conversão **signup → onboarding completo → primeiro simulado** — funil simples que prova que o aluno entrou, configurou e experimentou o core do produto.

### A3. Para quem o Broto fala — vestibulando solo, escola particular, cursinho popular, EAD?
**Pergunta:** liste 1-3 personas, com prioridade. Ex: "P1: aluno 17 anos preparando ENEM solo. P2: cursinho de bairro com 30-100 alunos. P3: escola particular."

**Resposta:** **MVP — uma persona dominante:** aluno preparando ENEM de forma independente (B2C, signup aberto). Conteúdo alinhado ao **ENEM padrão**; gamificação “livre” (sem amarrar a um plano pedagógico rígido). **Uma turma/canal:** **ENEM26**, controlado por vocês, reunindo alunos em treino focado no ENEM antes de multi-tenant ou outras ofertas.

### A4. Existe uma proposta de valor pedagógica clara (algoritmo de aprendizagem)?
**Pergunta:** o Broto promete ao aluno
- (a) "estude pelo nosso plano e você melhora" (precisa pedagogia real)
- (b) "use os recursos que quiser, no seu ritmo" (não promete plano; foco em ferramentas)
- (c) "deixa a IA decidir" (NotebookLM gera a rotina; precisa contrato e UI nova)

**Resposta:** **Visão de produto:** (a) “estude pelo nosso plano e você melhora” — isso exige pedagogia e continuidade reais. **MVP:** comunicar e entregar (b) **“use os recursos que quiser, no seu ritmo”** — sem prometer plano inteligente; foco em **ferramentas sólidas** (banco, simulado, rotina/dia quando existir, etc.) até a camada pedagógica amadurecer.

### A5. Que role o Broto Chat tem hoje vs deveria ter?
**Pergunta:** o chat é
- (a) "tira dúvidas pontuais sobre matéria" — pode ser stateless
- (b) "coach de estudo, lembra do meu histórico" — precisa de histórico nosso, persona, contexto
- (c) "assistente da turma/professor" — limitado ao notebook da turma, conhece materiais
- (d) feature opcional/promocional que pode sair

**Resposta:** (a) **Tira dúvidas pontuais de matéria** — pode ser **stateless** no MVP (sem obrigação de memória longa do histórico do aluno no modelo de conversa).

---

## Seção B — Engine de gamificação

Hoje XP, streak, fase, humor, missões, conquistas são features paralelas sem engine. Isso é a maior fonte de "confusão" arquitetural.

### B1. Existe uma engine ou é uma colcha?
**Pergunta:** queremos
- (a) consolidar tudo numa **"engine de gamificação"** server-side (uma função que recebe evento "answered_question" e dispara todos os efeitos)
- (b) manter como features soltas, decidir caso a caso o que persiste
- (c) reduzir o escopo (ex: matar fase/humor/moedas; ficar só XP + streak)

**Resposta:** (c) **Reduzir escopo:** tratar fase, humor, moedas e afins como **fora do MVP** ou congelados; manter **XP + streak** como eixo de gamificação, com regras simples e pouca superfície de bug.

### B2. XP — propósito real e fórmula
**Pergunta:**
- O XP é **moeda interna** (vai virar economia com `moedas`)?
- Ou é **só feedback de progresso** (faz nível subir e ponto final)?
- Existe **cap diário** ou XP é farmável?
- O **nível tem teto** (40, 100, infinito)?

**Resposta:** XP é **feedback de progresso** (nível, sensação de evolução), **não economia jogável** no MVP. Fórmula e teto podem ser **simples e revistas depois**; prioridade é previsibilidade e pouca complexidade (sem farm agressivo, sem moedas ativas).

### B3. Streak — definição canônica de "dia"
**Pergunta:** o "dia" do Broto é
- (a) UTC (server canônico, simples, divergente da percepção)
- (b) local do device (várias TZ; aluno viajante quebra)
- (c) timezone do aluno fixada no perfil (precisa coletar)
- (d) timezone da organização (B2B; escola decide)

E o streak quebra
- (e) ao não estudar 1 dia
- (f) tem grace period (1 dia de "tolerância")
- (g) pode ser recuperado com algum mecanismo (moeda, anúncio, escolha consciente)

**Resposta:** **Dia canônico:** (a) **UTC** — uma regra só no servidor, fácil de auditar. **Quebra de streak:** (e) **um dia sem estudo quebra** — sem grace period no MVP (pode evoluir depois). Aceita-se que a percepção “meia-noite” do aluno pode divergir do calendário UTC até haver timezone no perfil.

### B4. Missões diárias — server ou cliente, persistem ou não?
**Pergunta:**
- Missões devem persistir server-side?
- Missões dão XP de verdade ou são copy/cosmético?
- O conjunto de 3 missões/dia é a regra final ou um placeholder?
- Existem missões semanais? mensais?

**Resposta:** Tratar missões como **domínio de produto**, não só copy na UI. **Persistência server-side**; **XP real** (integrado ao mesmo sistema de eventos que o restante da gamificação). O bloco **“3 missões por dia”** atual é **placeholder** — o modelo de longo prazo inclui **metas semanais e mensais** (além do diário). Arquitetar já pensando nessa extensão, mesmo que o catálogo inicial seja mínimo.

### B5. Conquistas (achievements) — produto ou cosmético?
**Pergunta:**
- Conquistas são produto (com modal de celebração, badge persistido, compartilhamento)?
- Ou são "honras" passivas que só aparecem se o aluno olhar?
- Quem define o catálogo (org? plataforma global)?
- Existe paridade mobile?

**Resposta:** **Estado alvo:** conquistas como produto — modal de celebração, badge persistido, eventual compartilhamento. **MVP:** rebaixar para **“honras” passivas** (visíveis quem procurar), sem investir no loop de celebração. **Catálogo:** **plataforma global** (não por organização). **Paridade mobile:** fora do MVP — só **web**.

### B6. Pet — qual é o papel?
**Pergunta:**
- O pet **evolui** com o aluno (cosmético) ou **reage** (humor, fome, sono)?
- O nome do pet é por aluno ou por org (white-label `mascot_name`)?
- A fase é **só visual** ou **destrava features** (ex: "Broto flor pode acessar X")?
- A economia (`moedas`) tem futuro real ou removemos a coluna?

**Resposta:** Pet **evolui com o aluno** (cosmético): **nome por aluno**; **fase apenas visual** (não destrava feature). **Sem “vida” reativa no MVP** (humor, fome, sono) — mas **manter no modelo/dados** o gancho para evolução e reação futuros. Coluna **moedas:** manter para **economia futura**; **sem uso ativo** no MVP.

---

## Seção C — Modelagem de domínio (o que está implícito virar explícito)

### C1. "Sessão de estudo" como conceito unificado?
**Pergunta:**
- Toda atividade (simulado, banco, prática livre) deveria virar uma "sessão"?
- Ou só simulado é sessão, e prática livre é fluxo contínuo?
- Como o aluno percebe "comecei, parei, continuo"?

**Resposta:** **Navegação livre:** busca, filtros, aleatório, exploração — o aluno não fica preso a “sessão nomeada” para praticar. **Obrigatório:** **toda resposta persistida** — alimenta histórico agregado (acertos, erros, volume) e **estado por questão** (já respondida / resultado) para sinalização quando o aluno voltar ao banco. Ou seja: UX fluida, **progresso sempre rastreado**.

### C2. Catálogo de tópicos/áreas: onde mora a fonte canônica?
**Pergunta:**
- A relação questão → área → tópico → subtópico é **plana** (tags) ou **hierárquica** (árvore)?
- Onde essa árvore vive de forma canônica?

**Resposta:** Não há **um único catálogo** “oficial” além do que o sistema já materializa: **DB** com vínculo **questão ↔ tópico**; **TypeScript** com rótulos de área exibíveis; **onboarding** ainda mistura convenções de chave (curtas/longas). Hierarquia **plana** hoje. **MVP:** não reescrever isso — **documentar** e evoluir incrementalmente.

### C3. "Material" — sair de PDF/URL/YouTube/text para "conteúdo estruturado"?
**Pergunta:**
- Vamos suportar **trilhas** (sequência ordenada de materiais)?
- **Aula** (entidade com título, descrição, conteúdo, ordem na trilha)?
- **Módulo** (agrupamento de aulas, ex: "Termodinâmica")?
- Ou ficamos no modelo "biblioteca solta" e o NotebookLM faz o trabalho?

**Resposta:** **Pós-MVP:** trilhas (sequência ordenada), **Aula** (título, descrição, conteúdo, ordem) e **Módulo** (agrupamento, ex.: “Termodinâmica”). **MVP:** permanece o modelo atual (**biblioteca / agregação solta** + conteúdo guiado onde já existir); sem novas entidades de curso ainda.

### C4. "Aluno" — identidade unificada vs shapes por consumidor
**Pergunta:**
- O `Student` no `@broto/shared` é (a) o shape canônico, (b) uma proposta abandonada, ou (c) precisa ser refeito?
- Quais campos são obrigatórios vs opcionais?

**Resposta:** **Canônico no código hoje:** `UserProfile` e a resposta de **`user-me`**. No MVP, usar também o tipo **`Student`** em `@broto/shared` onde fizer sentido para **unificar** leituras de aluno (evitar dois “tipos de aluno” sem necessidade).

### C5. "Histórico do aluno" — uma timeline ou várias visões?
**Pergunta:**
- Vamos criar uma **timeline canônica de eventos** ("o que o aluno fez quando")?
- Ou cada visão continua agregando direto das tabelas?

**Resposta:** Manter **agregações atuais** (tabelas/fontes existentes) no MVP. **Futuro:** introduzir uma **timeline canônica de eventos** (“o que o aluno fez e quando”) quando o custo de manutenção justificar.

### C6. "Notificação" — entidade ou ainda não?
**Pergunta:**
- Vamos começar com **notificações in-app** apenas (sino, contador)?
- Push mobile? Email transacional?

**Resposta:** Sem investimento em notificações no MVP (comportamento atual). **Futuro:** in-app, e eventualmente push/e-mail, quando houver política e conteúdo claros.

---

## Seção D — Multi-tenant e B2B

### D1 a D4. Resumo de B2B, Pricing, Multi-tenant
**Pergunta Geral:** Multi-tenant, perfil do professor, pricing, etc.

**Resposta:** **MVP:** apenas o canal **ENEM26** sob controle de vocês, para alunos treinarem para o ENEM. **Sem foco em receita** por ora (sem pricing, sem multi-tenant B2B elaborado). Multi-tenant, perfil de professor e pricing podem ficar para depois que o core estiver estável.

---

## Seção E — Trust, segurança, integridade

### E1 a E4. Trust model, LGPD, Privacidade
**Resposta geral (E):** No MVP, preferir o **mínimo viável e auditável:** boas práticas de **LGPD** (bases legais, retenção consciente, acesso ao titular), **segredos só em env**, auth nas Edge Functions, **validação de input** onde há escrita. **Anti-fraude / integridade pesada** (ex.: RLS “invisível”, modelos de gabarito sofisticados) fica **explícita como dívida** — implementar quando o risco justificar, não bloqueando o lançamento do funil ENEM26.

---

## Seção F — Sobre o que está visível e está sendo refatorado AGORA

### F1. Home — o que essa tela quer dizer?
**Pergunta:** quando o aluno abre o app, o que ele **precisa** ver primeiro?

**Resposta:** Priorizar, na abertura: **(a)** quanto estudei / fiz hoje; **(b)** onde estou mais fraco; **(c)** próxima ação clara (“o que fazer agora”); **(e)** próximo simulado ou continuidade de simulado — alinhado a um **hub**, não a um painel analítico profundo.

### F2. Progress vs Home vs Routine — três telas ou uma?
**Pergunta:** essas três rotas existem porque...

**Resposta:** Conceitualmente, **(a)** três jornadas: **Home** = hub; **Progress** = análise profunda; **Routine** = plano do dia. A confusão atual é sobretudo de **layout/navegação**. **MVP:** **não usar** a rota **Progress** (`/progress`) — foco em Home + Routine (e fluxos que levam a banco/simulado).

### F3. `StudyArea` no web (1718 linhas) — o que é esse pedaço?
**Pergunta:**
- Essa tela é central ou colcha de retalhos?
- Mocks são roadmap ou wishlist?

**Resposta:** **Alvo de produto:** resumo, flashcards, mapa mental e questões de prática no fluxo guiado — no futuro com **NotebookLM (ou serviço)** em runtime. **MVP:** conteúdo **estático no repositório**, mesmo **contrato** que hoje (ex.: `StudyPackage`: resumo, flashcards, `practiceQuestions`, mind map — dados espelhados em `packages/shared/src/study-area-mock.ts`). **Processo:** curadoria manual assistida por IA, **versionada no Git**; **nenhuma** chamada ao NotebookLM em produção ainda. **Pós-MVP:** trocar a **fonte** (estático → API) mantendo a UI/contrato compatíveis; cuidar de **cobertura** (pacote por tópico no hub), **slugs alinhados** a `getStudyTopicCatalog` / `topic_performance`, e **LGPD/custo** (cache, timeout, o que é on-demand vs pré-gerado).

### F4. Mobile `(tabs)/questions.tsx` vs `study-area.tsx` — duas implementações
**Pergunta:** Qual deveria sobreviver?

**Resposta:** Mobile **fora do MVP**; não há obrigação de manter duas implementações agora. **Direção:** reduzir superfície não usada (inclusive removendo/encolhendo código morto) em vez de manter paridade fantasma.

### F5. CSS de 17.944 linhas — manter ou quebrar?
**Pergunta:**
- Vamos quebrar em arquivos por feature/módulo? Migrar para Tailwind?

**Resposta:** **Quebrar** o monólito (`app.css`) por **área ou feature**, **refatorar** com critério de legibilidade e reutilização, e **subir qualidade** incrementalmente — sem migrar o web inteiro para Tailwind no MVP salvo decisão explícita.

### F6. Achievements untracked + Heatmap untracked + RoutineAreaPerformance untracked
**Pergunta:** Esses três arquivos são parte de um plano explícito ou devem ser descartados?

**Resposta:** Fazem parte de uma entrega intencional; **devem permanecer** no produto — **versionadas** e integradas ao fluxo (não descartar como experimento solto).

---

## Seção G — Mobile vs Web: o gap declarado ou não

### G1. Mobile é versão reduzida do web ou produto-irmão?
**Resposta:** **MVP = web apenas.** Mobile não é entrega nem critério de aceite neste ciclo; pode ficar congelado ou removido do caminho crítico conforme a estratégia do time.

### G2. React 18 vs React 19 — convergir ou aceitar?
**Resposta:** **Aceitar a divergência** entre apps (React 18 no web/admin vs 19 no mobile): **documentar** no repositório e não gastar energia em sincronização prematura enquanto o mobile estiver fora do MVP.

---

## Seção H e I — Operações, testes, observabilidade e limpeza acumulada

**Resposta geral (H e I):** Manter **nível de operações/testes/observabilidade** adequado ao MVP — sem compromisso com E2E amplo ou analytics sofisticado agora; **colunas ou features “zumbi”** permanecem inativas mas documentadas. **Planejar** evolução (testes automatizados, métricas de produto, limpeza de dívida) **após** validar o funil ENEM26.
