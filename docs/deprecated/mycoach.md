## Análise: mycoach-backend → O Broto

Analisei o repositório diretamente. O **mycoach-backend** é um backend **Python/Flask** orientado a IA educacional, enquanto o **Broto** (pela sua descrição) é **TypeScript + React + Supabase multi-tenant**. Não há código do Broto neste workspace, então a avaliação é por **conceitos e lógica de negócio**, não por cópia literal de código.

---

### O que o mycoach-backend é hoje

| Aspecto | MyCoach | Broto (descrito) |
|---|---|---|
| Stack | Python, Flask, JWT manual | TypeScript, React, Supabase |
| Dados | JSON estático (`all_grades.json`, `users.json`) | PostgreSQL + RLS multi-tenant |
| Auth | JWT próprio, login simplificado | Supabase Auth |
| IA | API externa com streaming | Integrações com modelos de IA |
| Adaptação | Baseada em notas/seções fracas | Jornada adaptativa + gamificação |
| Multi-tenant | Não | Sim |

**Módulos principais do backend:**
- Chat contextual (aluno/professor)
- Planos de estudo personalizados
- Simulados adaptativos (modo `weak` / `strong`)
- Acompanhamento de desempenho por seção
- Geração de materiais (resumos, exercícios, aulas)
- Analytics para professores (comparar turmas, alunos, cidades)
- Biblioteca de PDFs + geração de conteúdo a partir de livros
- Integração com Open edX (`projetodesenvolve.online`) para notas

---

### Alto valor para reutilizar/adaptar

#### 1. Lógica de adaptação (portar para TypeScript)

O coração adaptativo do MyCoach está em `services.py` e vale reimplementar no Broto:

```python
# Identificação de áreas fracas (< 70%)
weak_sections = [
    section["subsection_name"] or section["label"]
    for section in course_grade.get("section_breakdown", [])
    if section.get("percent", 0) < 0.7
]
```

Isso alimenta:
- **Planos de estudo** (`generate_study_plan_student`) — teoria/prática/exercícios com tempo configurável
- **Simulados** (`generate_simulado`) — questões focadas em pontos fracos ou de consolidação
- **Recomendação de recursos** (`generate_study_resources`) — materiais por área de dificuldade

**Para o Broto:** traduza isso para Edge Functions ou API TS, persistindo `section_breakdown` e histórico de tentativas no Supabase. A regra de 70% pode virar configuração por tenant ou por matéria ENEM.

#### 2. Templates de prompts (reuso quase direto)

Os prompts já estão bem estruturados em português. Dá para extrair como templates no Broto:

| Função MyCoach | Uso no Broto |
|---|---|
| `generate_simulado` | Geração de questões ENEM (múltipla escolha + dissertativas) |
| `generate_study_plan_student` | Rotinas de estudo personalizadas |
| `generate_study_resources` | Recomendação de conteúdos |
| `generate_lesson` / `generate_teaching_materials` | Resumos e materiais por tópico |
| `handle_chat_message` | Tutor IA com system prompts por papel |

O prompt do simulado, por exemplo, já define estrutura de questão (enunciado, tipo, dificuldade, gabarito) — encaixa bem no fluxo de questões do Broto.

#### 3. Padrão de integração com IA (`call_ai_api`)

```86:130:mycoach-backend/app/services.py
def call_ai_api(payload, user_email, function_name):
    # Log de uso (email, contexto, resumo do prompt, IP)
    # Retry com backoff
    # Streaming habilitado
    response = session.post(API_BASE_URL, json=payload, stream=True, ...)
```

**Adaptar para o Broto:**
- Supabase Edge Function como proxy da IA (esconde API key)
- Log em tabela `ai_usage_logs` com `tenant_id`, `user_id`, `function_name`
- Rate limiting por tenant/usuário (hoje usa Flask-Limiter por IP)
- Streaming via SSE ou Supabase Realtime

#### 4. Modelo de dados de desempenho

Estrutura útil para inspirar schema no Broto:

```json
{
  "course_id": "...",
  "calculated_grade": 65.0,
  "section_breakdown": [
    { "label": "Álgebra", "percent": 0.45, "attempted": true },
    { "label": "Geometria", "percent": 0.82, "attempted": true }
  ]
}
```

No Broto, isso vira algo como:
- `student_performance` (tenant_id, user_id, subject_id, score)
- `topic_mastery` (topic_id, mastery_level, last_attempt)
- Base para gamificação (XP por domínio de tópico)

#### 5. Geração de conteúdo a partir de PDF (`book_service.py`)

Fluxo: extrair texto do PDF → montar prompt → gerar material via IA.

**No Broto:** PDF no Supabase Storage → Edge Function extrai texto → gera resumo/questões → salva em `generated_content`. A lógica de truncar páginas e estruturar o prompt é reaproveitável.

#### 6. Analytics comparativos (conceito)

Funções como `compare_classes`, `compare_students_in_turma`, `get_initial_comparison_data` mostram como agregar dados para dashboards. No Broto multi-tenant, isso vira views SQL com filtro `tenant_id` — útil para visão de coordenadores/escolas.

---

### Reutilizar com adaptação significativa

| Item | O que pegar | O que mudar |
|---|---|---|
| **Auth** | Separação aluno/professor | Supabase Auth + roles + RLS por tenant |
| **Streaming no frontend** | Padrão do `SimuladoModal` (fetch stream + efeito de digitação) | Reescrever em React/TS do Broto |
| **Integração LMS** | Scripts `fetch_data/` (OAuth + gradebook Open edX) | Só se o Broto integrar com LMS externo; senão, descartar |
| **Conteúdo de curso** | Scraping HTML (`get_course_content`) | Substituir por conteúdo ENEM no Supabase Storage ou CMS |
| **Swagger/docs** | Documentação de API | OpenAPI no backend TS ou docs Supabase |

---

### Não reutilizar (ou reescrever do zero)

1. **Stack Flask/Python** — incompatível com a stack TS do Broto
2. **JSON como banco** — não escala para multi-tenant; migrar tudo para PostgreSQL
3. **JWT manual** (`routes.py`) — login de aluno aceita qualquer e-mail válido; inseguro para produção
4. **Credenciais hardcoded** em `services.py` e `fetch_all_grades.py` — nunca portar; usar secrets do Supabase
5. **Lógica específica PD** — usernames `pdita`/`pdbd`, cursos Open edX, cidades Itabira/Bom Despacho
6. **Gamificação** — MyCoach não tem; Broto precisa implementar (XP, badges, streaks, ranking)
7. **Multi-tenant** — MyCoach não isola dados; Broto exige `tenant_id` em todas as tabelas e políticas RLS

---

### Mapa funcional: MyCoach → Broto

```
MyCoach                          Broto (equivalente)
─────────────────────────────────────────────────────
generate_study_plan_student  →   Rotinas de estudo adaptativas
generate_simulado            →   Questões ENEM personalizadas
generate_study_resources     →   Recomendação de conteúdos
section_breakdown < 70%      →   Motor de adaptação por dificuldade
handle_chat_message          →   Tutor IA contextual
generate_book_content        →   Resumos a partir de materiais
compare_* / analytics        →   Dashboard de desempenho (por tenant)
[ausente]                    →   Gamificação
[ausente]                    →   Multi-tenant + RLS
JWT + JSON                   →   Supabase Auth + PostgreSQL
```

---

### Recomendação prática de migração

**Fase 1 — Extrair a inteligência (1–2 dias)**  
Copiar prompts e regras de adaptação (`< 70% = fraco`, modos weak/strong) para um módulo `src/ai/prompts/` no Broto.

**Fase 2 — Edge Functions (3–5 dias)**  
Reimplementar em TypeScript:
- `generateStudyPlan`
- `generateQuestions` (simulado)
- `recommendResources`
- `chatTutor`

Com logging, rate limit e streaming.

**Fase 3 — Schema Supabase (2–3 dias)**  
Tabelas com `tenant_id`: performance, mastery, study_plans, generated_content, ai_usage_logs.

**Fase 4 — UI (referência do frontend MyCoach)**  
O `frontend-app-mycoach` tem modais de simulado, plano de estudo e streaming — bons referenciais de UX, mas reescrever em TS/React do Broto (não copiar o código Open edX/Paragon).

---

### Resumo

O **mycoach-backend não deve ser integrado como serviço** ao Broto (stack e arquitetura diferentes). O que vale a pena é:

- **Reutilizar:** prompts, regras adaptativas, estrutura de desempenho por seção, padrão de proxy IA com logging/streaming, fluxo PDF → conteúdo
- **Adaptar:** analytics, chat por papel, geração de materiais
- **Descartar:** Flask, JSON estático, auth JWT, integração Open edX, lógica específica do Projeto Desenvolve
- **Construir no Broto:** gamificação, multi-tenant, schema ENEM, Supabase Auth/RLS

Se quiser, no próximo passo posso montar um **mapa de Edge Functions + schema Supabase** concretos para portar a lógica adaptativa do MyCoach para o Broto.