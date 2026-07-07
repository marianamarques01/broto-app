-- REDA-01: Módulo de redação ENEM — schema, RLS fail-closed, seed de temas globais.
-- Referência: docs/redacao-arquitetura-motor.md §10, docs/redacao-contexto-dev.md §4.

-- ---------------------------------------------------------------------------
-- redacao_temas
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.redacao_temas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  titulo           text NOT NULL,
  textos_motivadores jsonb NOT NULL DEFAULT '[]'::jsonb,
  eixo_tematico    text NOT NULL,
  dificuldade      text NOT NULL DEFAULT 'medio',
  ano_referencia   int,
  ativo            boolean NOT NULL DEFAULT true,
  created_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT redacao_temas_eixo_check CHECK (
    eixo_tematico IN (
      'educacao', 'saude', 'meio_ambiente', 'tecnologia',
      'trabalho', 'direitos_humanos', 'cultura'
    )
  ),
  CONSTRAINT redacao_temas_dificuldade_check CHECK (
    dificuldade IN ('facil', 'medio', 'dificil')
  ),
  CONSTRAINT redacao_temas_motivadores_array_check CHECK (
    jsonb_typeof(textos_motivadores) = 'array'
  )
);

CREATE INDEX IF NOT EXISTS idx_redacao_temas_org_ativo
  ON public.redacao_temas (organization_id, ativo)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_redacao_temas_global_ativo
  ON public.redacao_temas (eixo_tematico, ativo)
  WHERE organization_id IS NULL;

COMMENT ON TABLE public.redacao_temas IS
  'Temas de redação ENEM. organization_id NULL = tema global Broto; preenchido = tema da org.';

-- ---------------------------------------------------------------------------
-- redacoes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.redacoes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  class_id         uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  tema_id          uuid NOT NULL REFERENCES public.redacao_temas(id) ON DELETE RESTRICT,
  texto            text NOT NULL DEFAULT '',
  imagem_url       text,
  modo             text NOT NULL DEFAULT 'digitado',
  linha_count      int NOT NULL DEFAULT 0,
  tempo_segundos   int,
  status           text NOT NULL DEFAULT 'rascunho',
  created_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT redacoes_modo_check CHECK (
    modo IN ('digitado', 'foto', 'cronometrado')
  ),
  CONSTRAINT redacoes_status_check CHECK (
    status IN ('rascunho', 'enviada', 'corrigindo', 'corrigida', 'erro')
  ),
  CONSTRAINT redacoes_linha_count_check CHECK (
    linha_count >= 0 AND linha_count <= 30
  )
);

CREATE INDEX IF NOT EXISTS idx_redacoes_user_created
  ON public.redacoes (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_redacoes_org_status
  ON public.redacoes (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_redacoes_tema
  ON public.redacoes (tema_id);

COMMENT ON TABLE public.redacoes IS
  'Redações do aluno. Escrita pelo aluno; correção via edge (service_role).';

-- ---------------------------------------------------------------------------
-- redacao_correcoes
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.redacao_correcoes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  redacao_id           uuid NOT NULL UNIQUE REFERENCES public.redacoes(id) ON DELETE CASCADE,
  nota_competencia_i   int NOT NULL DEFAULT 0,
  nota_competencia_ii  int NOT NULL DEFAULT 0,
  nota_competencia_iii int NOT NULL DEFAULT 0,
  nota_competencia_iv  int NOT NULL DEFAULT 0,
  nota_competencia_v   int NOT NULL DEFAULT 0,
  nota_total           int NOT NULL DEFAULT 0,
  justificativa_i      text NOT NULL DEFAULT '',
  justificativa_ii     text NOT NULL DEFAULT '',
  justificativa_iii    text NOT NULL DEFAULT '',
  justificativa_iv     text NOT NULL DEFAULT '',
  justificativa_v      text NOT NULL DEFAULT '',
  marcacoes_inline     jsonb NOT NULL DEFAULT '[]'::jsonb,
  fatores_zero         jsonb NOT NULL DEFAULT '{"detectado": false, "motivos": []}'::jsonb,
  prompt_version       text NOT NULL DEFAULT '',
  modelo_usado         text NOT NULL DEFAULT '',
  rag_chunks_used      jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT redacao_correcoes_nota_i_check CHECK (
    nota_competencia_i IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_correcoes_nota_ii_check CHECK (
    nota_competencia_ii IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_correcoes_nota_iii_check CHECK (
    nota_competencia_iii IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_correcoes_nota_iv_check CHECK (
    nota_competencia_iv IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_correcoes_nota_v_check CHECK (
    nota_competencia_v IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_correcoes_nota_total_check CHECK (
    nota_total >= 0 AND nota_total <= 1000
  ),
  CONSTRAINT redacao_correcoes_marcacoes_array_check CHECK (
    jsonb_typeof(marcacoes_inline) = 'array'
  )
);

CREATE INDEX IF NOT EXISTS idx_redacao_correcoes_redacao
  ON public.redacao_correcoes (redacao_id);

COMMENT ON TABLE public.redacao_correcoes IS
  'Correção IA por redação (1:1). Escrita exclusiva via service_role (redacao-correct).';

-- ---------------------------------------------------------------------------
-- redacao_revisoes_humanas (calibração — Wave 3)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.redacao_revisoes_humanas (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correcao_id           uuid NOT NULL REFERENCES public.redacao_correcoes(id) ON DELETE CASCADE,
  revisor_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  nota_humana_i         int,
  nota_humana_ii        int,
  nota_humana_iii       int,
  nota_humana_iv        int,
  nota_humana_v         int,
  notas_ia_reveladas_em timestamptz,
  comentario            text,
  created_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT redacao_revisoes_nota_i_check CHECK (
    nota_humana_i IS NULL OR nota_humana_i IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_revisoes_nota_ii_check CHECK (
    nota_humana_ii IS NULL OR nota_humana_ii IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_revisoes_nota_iii_check CHECK (
    nota_humana_iii IS NULL OR nota_humana_iii IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_revisoes_nota_iv_check CHECK (
    nota_humana_iv IS NULL OR nota_humana_iv IN (0, 40, 80, 120, 160, 200)
  ),
  CONSTRAINT redacao_revisoes_nota_v_check CHECK (
    nota_humana_v IS NULL OR nota_humana_v IN (0, 40, 80, 120, 160, 200)
  )
);

CREATE INDEX IF NOT EXISTS idx_redacao_revisoes_correcao
  ON public.redacao_revisoes_humanas (correcao_id);

CREATE INDEX IF NOT EXISTS idx_redacao_revisoes_revisor
  ON public.redacao_revisoes_humanas (revisor_id);


-- ---------------------------------------------------------------------------
-- redacao_repertorios
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.redacao_repertorios (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  class_id          uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  tipo              text NOT NULL,
  titulo            text NOT NULL,
  conteudo          text NOT NULL,
  eixo_tematico     text,
  competencia_alvo  text,
  tags              text[] NOT NULL DEFAULT '{}',
  ativo             boolean NOT NULL DEFAULT true,
  created_by        uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT redacao_repertorios_tipo_check CHECK (
    tipo IN ('dica', 'repertorio', 'modelo_estrutura', 'conectivos', 'proposta_intervencao')
  ),
  CONSTRAINT redacao_repertorios_eixo_check CHECK (
    eixo_tematico IS NULL OR eixo_tematico IN (
      'educacao', 'saude', 'meio_ambiente', 'tecnologia',
      'trabalho', 'direitos_humanos', 'cultura'
    )
  ),
  CONSTRAINT redacao_repertorios_competencia_check CHECK (
    competencia_alvo IS NULL OR competencia_alvo IN ('I', 'II', 'III', 'IV', 'V')
  )
);

CREATE INDEX IF NOT EXISTS idx_redacao_repertorios_org_ativo
  ON public.redacao_repertorios (organization_id, ativo);

CREATE INDEX IF NOT EXISTS idx_redacao_repertorios_class
  ON public.redacao_repertorios (class_id)
  WHERE class_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_redacao_repertorios_updated_at ON public.redacao_repertorios;
CREATE TRIGGER trg_redacao_repertorios_updated_at
  BEFORE UPDATE ON public.redacao_repertorios
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

COMMENT ON TABLE public.redacao_repertorios IS
  'Conteúdo pedagógico de redação criado por professor (org ou turma).';

-- ---------------------------------------------------------------------------
-- redacao_competence_snapshots (evolução + rotina)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.redacao_competence_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  competencia text NOT NULL,
  nota        int NOT NULL,
  redacao_id  uuid NOT NULL REFERENCES public.redacoes(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT redacao_snapshots_competencia_check CHECK (
    competencia IN ('I', 'II', 'III', 'IV', 'V')
  ),
  CONSTRAINT redacao_snapshots_nota_check CHECK (
    nota IN (0, 40, 80, 120, 160, 200)
  )
);

CREATE INDEX IF NOT EXISTS idx_redacao_snapshots_user_comp_created
  ON public.redacao_competence_snapshots (user_id, competencia, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_redacao_snapshots_redacao
  ON public.redacao_competence_snapshots (redacao_id);

COMMENT ON TABLE public.redacao_competence_snapshots IS
  'Série temporal de notas por competência. Escrita via service_role após correção.';

-- ---------------------------------------------------------------------------
-- RLS — fail-closed (docs/redacao-arquitetura-motor.md §10)
-- ---------------------------------------------------------------------------

ALTER TABLE public.redacao_temas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redacao_correcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redacao_revisoes_humanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redacao_repertorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redacao_competence_snapshots ENABLE ROW LEVEL SECURITY;

-- redacao_temas: global (autenticados) | org (alunos org) | staff escreve org
DROP POLICY IF EXISTS "mt_redacao_tema_select_global" ON public.redacao_temas;
CREATE POLICY "mt_redacao_tema_select_global"
  ON public.redacao_temas
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL
    AND ativo = true
  );

DROP POLICY IF EXISTS "mt_redacao_tema_select_org" ON public.redacao_temas;
CREATE POLICY "mt_redacao_tema_select_org"
  ON public.redacao_temas
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND ativo = true
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = redacao_temas.organization_id
        AND om.status = 'active'
    )
  );

DROP POLICY IF EXISTS "mt_redacao_tema_staff_all" ON public.redacao_temas;
CREATE POLICY "mt_redacao_tema_staff_all"
  ON public.redacao_temas
  FOR ALL
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND public.app_rls_is_active_staff_in_org(redacao_temas.organization_id)
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND public.app_rls_is_active_staff_in_org(redacao_temas.organization_id)
  );

-- redacoes: aluno próprio + staff da turma
DROP POLICY IF EXISTS "mt_redacao_select_owner" ON public.redacoes;
CREATE POLICY "mt_redacao_select_owner"
  ON public.redacoes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "mt_redacao_insert_owner" ON public.redacoes;
CREATE POLICY "mt_redacao_insert_owner"
  ON public.redacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = redacoes.organization_id
        AND om.status = 'active'
    )
  );

DROP POLICY IF EXISTS "mt_redacao_update_owner" ON public.redacoes;
CREATE POLICY "mt_redacao_update_owner"
  ON public.redacoes
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "mt_redacao_select_staff" ON public.redacoes;
CREATE POLICY "mt_redacao_select_staff"
  ON public.redacoes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      INNER JOIN public.enrollments e
        ON e.student_id = redacoes.user_id
        AND e.status = 'active'
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );

-- redacao_correcoes: leitura espelha redacoes; escrita só service_role
DROP POLICY IF EXISTS "mt_redacao_correcao_select_owner" ON public.redacao_correcoes;
CREATE POLICY "mt_redacao_correcao_select_owner"
  ON public.redacao_correcoes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.redacoes r
      WHERE r.id = redacao_correcoes.redacao_id
        AND r.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "mt_redacao_correcao_select_staff" ON public.redacao_correcoes;
CREATE POLICY "mt_redacao_correcao_select_staff"
  ON public.redacao_correcoes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.redacoes r
      INNER JOIN public.enrollments e
        ON e.student_id = r.user_id
        AND e.status = 'active'
      INNER JOIN public.organization_memberships om
        ON om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE r.id = redacao_correcoes.redacao_id
    )
  );

-- redacao_revisoes_humanas: fail-closed (staff Broto via service_role na edge)
COMMENT ON TABLE public.redacao_revisoes_humanas IS
  'Calibração cega. RLS fail-closed para authenticated; acesso via service_role.';

-- redacao_repertorios: alunos org/turma leem; teacher+ escreve
DROP POLICY IF EXISTS "mt_redacao_repertorio_select_student" ON public.redacao_repertorios;
CREATE POLICY "mt_redacao_repertorio_select_student"
  ON public.redacao_repertorios
  FOR SELECT
  TO authenticated
  USING (
    ativo = true
    AND EXISTS (
      SELECT 1 FROM public.organization_memberships om
      WHERE om.user_id = (SELECT auth.uid())
        AND om.organization_id = redacao_repertorios.organization_id
        AND om.status = 'active'
    )
    AND (
      redacao_repertorios.class_id IS NULL
      OR public.app_rls_user_has_active_enrollment_in_class(redacao_repertorios.class_id)
    )
  );

DROP POLICY IF EXISTS "mt_redacao_repertorio_staff_all" ON public.redacao_repertorios;
CREATE POLICY "mt_redacao_repertorio_staff_all"
  ON public.redacao_repertorios
  FOR ALL
  TO authenticated
  USING (
    public.app_rls_is_active_staff_in_org(redacao_repertorios.organization_id)
  )
  WITH CHECK (
    public.app_rls_is_active_staff_in_org(redacao_repertorios.organization_id)
  );

-- redacao_competence_snapshots: aluno próprio + staff
DROP POLICY IF EXISTS "mt_redacao_snapshot_select_owner" ON public.redacao_competence_snapshots;
CREATE POLICY "mt_redacao_snapshot_select_owner"
  ON public.redacao_competence_snapshots
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "mt_redacao_snapshot_select_staff" ON public.redacao_competence_snapshots;
CREATE POLICY "mt_redacao_snapshot_select_staff"
  ON public.redacao_competence_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_memberships om
      INNER JOIN public.enrollments e
        ON e.student_id = redacao_competence_snapshots.user_id
        AND e.status = 'active'
        AND om.organization_id = public.app_rls_class_org_id(e.class_id, true)
      WHERE om.user_id = (SELECT auth.uid())
        AND om.status = 'active'
        AND om.role IN ('teacher', 'org_admin', 'owner')
    )
  );

-- ---------------------------------------------------------------------------
-- Seed: ≥8 temas globais (textos motivadores próprios — não reproduzir INEP)
-- ---------------------------------------------------------------------------

INSERT INTO public.redacao_temas (
  id, organization_id, titulo, textos_motivadores, eixo_tematico, dificuldade, ano_referencia, ativo
) VALUES
(
  'a1000001-0000-4000-8000-000000000001',
  NULL,
  'A persistência do analfabetismo funcional no Brasil contemporâneo',
  '[
    {"ordem": 1, "titulo": "Dados recentes", "conteudo": "Estudos indicam que milhões de brasileiros concluem a escola sem dominar leitura e escrita funcionais, o que limita oportunidades no mercado de trabalho e na vida cidadã."},
    {"ordem": 2, "titulo": "Tecnologia e exclusão", "conteudo": "A digitalização de serviços públicos e privados torna ainda mais visível a distância entre quem domina a linguagem escrita e quem depende de terceiros para compreender documentos básicos."}
  ]'::jsonb,
  'educacao', 'medio', NULL, true
),
(
  'a1000001-0000-4000-8000-000000000002',
  NULL,
  'O acesso desigual à saúde mental entre jovens brasileiros',
  '[
    {"ordem": 1, "titulo": "Demanda crescente", "conteudo": "Relatos de ansiedade e depressão entre estudantes aumentaram nas últimas décadas, mas o atendimento especializado continua concentrado em grandes centros urbanos."},
    {"ordem": 2, "titulo": "Estigma social", "conteudo": "Muitos jovens evitam buscar ajuda por medo de rotulação, o que agrava o sofrimento psíquico e impacta desempenho escolar e relações familiares."}
  ]'::jsonb,
  'saude', 'medio', NULL, true
),
(
  'a1000001-0000-4000-8000-000000000003',
  NULL,
  'Os desafios da gestão de resíduos sólidos nas cidades brasileiras',
  '[
    {"ordem": 1, "titulo": "Lixões e aterros", "conteudo": "Apesar de avanços legislativos, parte significativa do lixo urbano ainda é destinada de forma inadequada, contaminando solos, rios e comunidades periféricas."},
    {"ordem": 2, "titulo": "Economia circular", "conteudo": "Iniciativas de reciclagem e cooperativas de catadores mostram que é possível reduzir impactos ambientais, mas dependem de investimento e políticas públicas consistentes."}
  ]'::jsonb,
  'meio_ambiente', 'medio', NULL, true
),
(
  'a1000001-0000-4000-8000-000000000004',
  NULL,
  'A regulação do uso de inteligência artificial e proteção de dados pessoais',
  '[
    {"ordem": 1, "titulo": "Algoritmos no cotidiano", "conteudo": "Sistemas automatizados influenciam recomendações de conteúdo, triagem de currículos e concessão de crédito, muitas vezes sem transparência sobre critérios utilizados."},
    {"ordem": 2, "titulo": "Riscos e oportunidades", "conteudo": "Especialistas debatem como equilibrar inovação tecnológica com direitos à privacidade, combate a vieses discriminatórios e educação digital da população."}
  ]'::jsonb,
  'tecnologia', 'dificil', NULL, true
),
(
  'a1000001-0000-4000-8000-000000000005',
  NULL,
  'A precarização do trabalho na era das plataformas digitais',
  '[
    {"ordem": 1, "titulo": "Novos vínculos", "conteudo": "Aplicativos de transporte, entrega e serviços conectam milhões de trabalhadores a clientes, mas muitos operam sem carteira assinada, férias ou proteção previdenciária."},
    {"ordem": 2, "titulo": "Flexibilidade versus segurança", "conteudo": "Defensores destacam autonomia e renda imediata; críticos apontam jornadas extensas, instabilidade de ganhos e dificuldade de organização coletiva."}
  ]'::jsonb,
  'trabalho', 'medio', NULL, true
),
(
  'a1000001-0000-4000-8000-000000000006',
  NULL,
  'A violência contra populações LGBTQIA+ no espaço público brasileiro',
  '[
    {"ordem": 1, "titulo": "Dados alarmantes", "conteudo": "Organizações da sociedade civil registram centenas de mortes e agressões anuais motivadas por preconceito de gênero e orientação sexual, com subnotificação em várias regiões."},
    {"ordem": 2, "titulo": "Educação e representatividade", "conteudo": "Campanhas de conscientização e políticas de inclusão escolar são apontadas como caminhos para reduzir discriminação, embora enfrentem resistência em diferentes contextos sociais."}
  ]'::jsonb,
  'direitos_humanos', 'dificil', NULL, true
),
(
  'a1000001-0000-4000-8000-000000000007',
  NULL,
  'A erosão do patrimônio cultural popular frente à homogeneização midiática',
  '[
    {"ordem": 1, "titulo": "Tradições locais", "conteudo": "Festas, cantigas, culinária e ofícios transmitidos por gerações perdem espaço diante de fluxos globais de entretenimento e consumo padronizado."},
    {"ordem": 2, "titulo": "Memória e identidade", "conteudo": "Museus comunitários, projetos de documentação oral e políticas de fomento cultural buscam preservar saberes locais, mas enfrentam subfinanciamento crônico."}
  ]'::jsonb,
  'cultura', 'medio', NULL, true
),
(
  'a1000001-0000-4000-8000-000000000008',
  NULL,
  'A inclusão de estudantes com deficiência na educação básica pública',
  '[
    {"ordem": 1, "titulo": "Marco legal", "conteudo": "A legislação brasileira prevê matrícula na rede regular e atendimento educacional especializado, porém a implementação varia entre municípios e estados."},
    {"ordem": 2, "titulo": "Barreiras estruturais", "conteudo": "Falta de profissionais de apoio, arquitetura escolar inacessível e formação docente insuficiente ainda impedem a participação plena de muitos alunos."}
  ]'::jsonb,
  'educacao', 'medio', NULL, true
)
ON CONFLICT (id) DO NOTHING;
