# Questões essenciais de produção (teste da aplicação) — Broto · TCC

**Origem:** condensação de `BUSINESS_QUESTIONS.md` (auditoria completa, 260+ perguntas).  
**Escopo:** apenas o necessário para **homologação piloto**, **matriz de testes** e **limitações válidas para dissertação** — não substitui a versão integral para produto/evolução.

**Data:** 2026-04-27

---

## 1. Para que este documento serve no TCC

- **Escopo técnico** do trabalho explícito: o que está **fora** de “implementação blindada”.
- **Hipóteses / limitações** capítulo: confiança no cliente, multi-tenant, LGPD para piloto controlado.
- **Matriz de testes funcionais**: fluxos obrigatórios antes de declarar o sistema “pronto para teste com usuários”.

---

## 2. Ambiente e migrações (bloqueadores operacionais)

- Ambiente de homologação/produção deve refletir a **mesma sequência de migrations** aplicada localmente (`supabase/migrations/`). Divergências históricas (ex.: colunas como `pets.nome`) podem causar erros runtime se o BD não corresponder ao código.
- Existência de valores legados (`question_id='__legacy__'`) pode afetar **interpretação agregados** — importante para relatórios de teste que usem médias por tópico.

**Critério mínimo:** deploy sem erro de schema nas rotas principais (`user-me`, `pet-me`, `answer-question`) após `signup` fresco.

---

## 3. Autenticação e cadastro (teste aplicacional)

| Tema | Impacto para testes |
|------|---------------------|
| E-mail confirmado automaticamente (`email_confirm: true`) | Adequado a piloto; **inadequado** a abertura pública forte sem política posterior. |
| Confirmação de posse de e-mail ausente | Risco real de conta com e-mail alheio — documentar como **limitação** se o TCC usar usuários sintéticos. |
| Cadastro inicial + vínculo automático turma/org pública (ENEM) | Novo usuário sempre entra nesse fluxo; professores também podem receber papel de aluno nessa turma — pode poluir cenários escola-vs-aluno nos testes. |
| Rate limit de signup (memória por isolate) | Efetividade limitada sob escala; para TCC bastam **poucos perfis** e teste manual. |

---

## 4. Fronteira de confiança (segurança — essencial para dissertação)

Estes itens **não bloqueiam** um teste qualitativo fechado, mas **devem ser declarados** como limitação arquitetural:

- **`answer-question`:** o servidor grava `acertou` com base em `isCorrect` enviado pelo cliente; **não** recalcula gabarito no servidor (gabarito está em JSON estático no cliente).
- **`practice-session-complete`:** resumo do simulado vem do cliente; validação do JSON é superficial.
- **Implicação:** confiança em **ranking competitivo global** ou fins de auditoria externos **não** é suportada pelo modelo atual; **estudo guiado personalizado / piloto institucional** é aceitável com este escopo.

Itens relacionados úteis no TCC: enumeração de e-mail (`409`), força bruta em `class-join` teórico, quotas de chat/upload — tratáveis como **trabalhos futuros**, não obrigatórios para “teste da aplicação” em laboratório.

---

## 5. Multi-tenant, turma e contexto

- Histórico de desempenho (`topic_performance`, respostas) **não** é particionado por organização nas tabelas atuais; trocar de contexto institucional não “separa” estatísticas no backend.
- `current_class_id` único por usuário ao dar join em novo código; enrolments antigas podem continuar **active** sem UX de “sair”.
- Turma **desativada** com estudante ainda enrolado pode quebrar leituras (ex.: chat) sem mensagem de produto sempre clara.

**Para matriz de teste:** cenário **único estudante × uma turma** simplifica resultado; cenários troca turma/multi-org só se forem objeto do trabalho.

---

## 6. Consistência tempo / dias (afieta validação perceptual nos testes)

- **Ofensiva (streak, `pet-me`):** uso de dia em **UTC** em trechos server-side.
- **Missões diárias:** armazenamento **local** e “meio-dia” em **timezone do dispositivo**.

**Critério mínimo para TCC:** descrever possível divergência “missões vs streak vs relógio do usuário” como **efeito esperado pela implementação atual**, não necessariamente bug.

---

## 7. Fluxos que o teste deve cobrir obrigatoriamente

1. Cadastro → login → home (ou equivalente pós-autenticação).
2. Onboarding completo **e** fluxo “pular tudo”, se existir.
3. Responder questão fora de simulado (se suportado).
4. Criar simulado / sessão de prática → responder → **finalizar** sessão.
5. Visualizar progresso ou pet (qualquer indicador que o app exponha).
6. Se o escopo do TCC incluir: **entrar em turma por código**; **chat** e/ou **materiais** (dependem de serviço NotebookLM e variáveis de ambiente).

---

## 8. LGPD e uso de dados (mínimo para produção acadêmica / piloto)

- Exclusão de conta / export de dados (portabilidade) **não** estão descritos como implementação completa no monorepo — adequado citar como **fora do escopo** ou **trabalho futuro**, exceto se o comitê exigir (aí vira requisito explícito do TCC).
- Consentimento formal e faixa etária: o documento completo levanta coleta (`data_nascimento`, etc.) sem gate — para **teste com menores**, alinhar com orientador e política institucional; para **adultos voluntários** em piloto controlado, documentar **termo de participação** separado do app se necessário.

---

## 9. Observabilidade e critério de “pronto para teste”

- Não há matriz de analytics produto integrada no sentido enterprise; para o TCC, **log manual / captura de tela / roteiro** costuma bastar.
- Pronto para teste de aplicação = **todos os fluxos da §7** passam em **web e/ou mobile** (conforme escopo do trabalho), **sem erro 500** recorrente nas edge functions usadas, e **documentadas** as limitações da §4 e §6.

---

## 10. O que este documento deixa de fora (ver `BUSINESS_QUESTIONS.md` completo)

Economia do pet (`moedas`), roadmaps de monetização, white-label avançado, rotina pedagógica ideal, paridade i18n/a11y, feature flags, anti-abuso sofisticado, atribuição de tarefas por professor (`class_assignment`), detalhes de governança de schema em 20+ edge cases — **relevantes para produto maduro**, não para fechar escopo de **TCC com teste controlado**.

---

## Referência

Documento base: `BUSINESS_QUESTIONS.md` (raiz do repositório). Itens cruzados de maior peso para produção: **§5 (Security & Abuse)**, **§3 (Flows)**, **§6 (Data Integrity)**, **§7.7 (Legal)** no original.
