import { assert, assertEquals, assertGreater } from 'jsr:@std/assert@1'
import type { ChatCompletionMessage } from './openai-chat.ts'
import type { ChatCompleter } from './redacao-correct-core.ts'
import { runRedacaoCorrect } from './redacao-correct-core.ts'
import type { EnemReferenceSearchChunk } from './enem-reference-search.ts'

/** Amostras sintéticas para calibração — não reproduzem redações oficiais INEP. */

export const REDACAO_FRACA = [
  'A educacao e importante pra sociedade.',
  'Os jovem nao estuda direito.',
  'O governo deve ajuda mais.',
  'Isso e um problema grande.',
  'Precisa melhora a escola.',
  'As pessoa sofre com isso.',
  'Fim do texto.',
].join('\n')

export const REDACAO_MEDIANA = [
  'Nos últimos anos, o acesso à educação de qualidade tornou-se um desafio central no Brasil.',
  'Diversos fatores explicam essa situação, entre eles a desigualdade social e a falta de investimento.',
  'Segundo dados recentes, milhões de estudantes ainda enfrentam infraestrutura precária nas escolas públicas.',
  'Esse cenário compromete o desenvolvimento intelectual e limita oportunidades futuras.',
  'Além disso, a formação docente deficiente agrava o problema, pois professores não recebem apoio adequado.',
  'Dessa forma, fica evidente que a educação precisa ser prioridade nas políticas públicas nacionais.',
  'Portanto, é necessário discutir soluções que garantam aprendizagem significativa para todos.',
  'Uma proposta seria ampliar investimentos em tecnologia e bibliotecas nas escolas.',
  'Outra medida importante é valorizar a carreira do professor com salários compatíveis.',
  'Assim, o país poderia reduzir desigualdades e formar cidadãos mais preparados.',
  'Em síntese, investir em educação é investir no futuro da nação.',
  'Diante disso, cabe ao Estado, à sociedade e às famílias atuarem de forma conjunta.',
  'Somente com esforço coletivo será possível superar as barreiras atuais.',
  'Por isso, a transformação educacional deve ser tratada como urgência democrática.',
  'Conclui-se que a melhoria da educação depende de ações concretas e contínuas.',
].join('\n')

export const REDACAO_FORTE = [
  'A democratização do ensino de qualidade constitui um dos maiores desafios contemporâneos do Brasil.',
  'Historicamente, a exclusão educacional reproduziu desigualdades estruturais, especialmente entre jovens de periferias urbanas.',
  'Nesse contexto, dados do Censo Escolar revelam déficits persistentes em conectividade, bibliotecas e laboratórios nas escolas públicas.',
  'Tais limitações restringem o repertório sociocultural dos estudantes e enfraquecem a argumentação exigida no ENEM.',
  'Ademais, a precarização docente — com baixos salários e jornadas exaustivas — compromete a mediação pedagógica.',
  'Conforme Paulo Freire, educar exige diálogo e reconhecimento da realidade vivida; sem isso, a escola permanece bancária e ineficaz.',
  'Paralelamente, políticas pontuais de merenda e transporte, embora necessárias, não substituem planejamento de longo prazo.',
  'Assim, torna-se imperioso articular investimento público, participação comunitária e avaliação transparente de resultados.',
  'Nesse sentido, a sociedade civil pode fiscalizar recursos e propor currículos contextualizados às demandas locais.',
  'Outrossim, universidades públicas podem ampliar programas de formação continuada para professores da rede básica.',
  'Dessa maneira, fortalece-se a Competência II, ao relacionar repertório sociológico ao tema proposto.',
  'Portanto, superar o problema demanda reconhecer a educação como direito fundamental e condição de cidadania.',
  'Conclui-se que apenas uma reforma estrutural, com financiamento estável, permitirá equidade de oportunidades.',
  'Diante do exposto, propõe-se que o Ministério da Educação, por meio de convênios com estados e municípios,',
  'implemente, nos próximos cinco anos, programa nacional de modernização de infraestrutura escolar,',
  'destinando recursos do Fundeb à ampliação de bibliotecas, laboratórios e conectividade em escolas públicas,',
  'com o objetivo de reduzir desigualdades educacionais e ampliar o acesso ao conhecimento científico,',
  'mediante auditorias semestrais conduzidas por conselhos escolares e publicação de indicadores de impacto.',
  'Essa intervenção respeita os direitos humanos ao garantir aprendizagem digna e inclusiva para todos os estudantes.',
  'Logo, cabe ao poder público, em parceria com a sociedade, executar medidas permanentes — não apenas retóricas.',
  'Somente assim o país transformará a escola em espaço de emancipação e justiça social.',
  'Em última análise, investir em educação é consolidar democracia, inovação e dignidade humana.',
  'Por conseguinte, adiar essa agenda significa perpetuar a injustiça intergeracional que o ENEM denuncia.',
  'É necessário, portanto, agir agora com responsabilidade fiscal e compromisso ético com as novas gerações.',
  'A escrita dissertativa exige, afinal, compromisso entre diagnóstico rigoroso e proposta viável de mudança.',
].join('\n')

type QualityProfile = 'fraca' | 'mediana' | 'forte'

const NOTAS_POR_QUALIDADE: Record<
  QualityProfile,
  Record<'I' | 'II' | 'III' | 'IV' | 'V', number>
> = {
  fraca: { I: 40, II: 40, III: 40, IV: 40, V: 0 },
  mediana: { I: 80, II: 120, III: 80, IV: 80, V: 80 },
  forte: { I: 160, II: 160, III: 160, IV: 160, V: 160 },
}

function createMockCompleter(profile: QualityProfile): ChatCompleter {
  const notas = NOTAS_POR_QUALIDADE[profile]

  return async (messages: ChatCompletionMessage[]) => {
    const system = messages.find((m) => m.role === 'system')?.content ?? ''

    if (system.includes('fatores de ANULAÇÃO') || system.includes('fatores de anulação')) {
      return {
        content: JSON.stringify({ detectado: false, motivos: [], detalhes: '' }),
        model: 'mock-gpt-test',
      }
    }

    const competenciaMatch = system.match(/Competência ([IV]+)/)
    const competencia = (competenciaMatch?.[1] ?? 'I') as keyof typeof notas

    return {
      content: JSON.stringify({
        competencia,
        nota: notas[competencia],
        justificativa: `Nota mock para perfil ${profile}.`,
        marcacoes: [],
      }),
      model: 'mock-gpt-test',
    }
  }
}

const MOCK_RAG_CHUNK: EnemReferenceSearchChunk = {
  id: 'chunk-1',
  document_id: 'doc-1',
  similarity: 0.9,
  chunk_text: 'Critério normativo de exemplo.',
  metadata: { section: 'matriz_referencia', competencia: 'I' },
}

async function mockSearchChunks(
  _admin: unknown,
  params: { match_section?: string | null; match_competence?: string | null },
): Promise<EnemReferenceSearchChunk[]> {
  const section = params.match_section ?? 'matriz_referencia'
  const competencia = params.match_competence ?? 'I'
  return [
    {
      ...MOCK_RAG_CHUNK,
      metadata: { section, competencia },
    },
  ]
}

function createMockSupabase(params: {
  redacaoId: string
  texto: string
  linhaCount: number
  userId?: string
}) {
  const temaId = '11111111-1111-4111-8111-111111111111'
  const orgId = '22222222-2222-4222-8222-222222222222'
  const userId = params.userId ?? '33333333-3333-4333-8333-333333333333'

  const redacao = {
    id: params.redacaoId,
    user_id: userId,
    organization_id: orgId,
    class_id: null,
    tema_id: temaId,
    texto: params.texto,
    imagem_url: null,
    modo: 'digitado',
    linha_count: params.linhaCount,
    tempo_segundos: null,
    status: 'enviada',
    created_at: new Date().toISOString(),
  }

  const tema = {
    id: temaId,
    organization_id: null,
    titulo: 'Desafios da educação pública no Brasil',
    textos_motivadores: [
      {
        ordem: 1,
        titulo: 'Contexto',
        conteudo: 'A educação básica enfrenta desafios de infraestrutura e equidade.',
      },
    ],
    eixo_tematico: 'educacao',
    dificuldade: 'medio',
    ano_referencia: null,
    ativo: true,
    created_by: null,
    created_at: new Date().toISOString(),
  }

  const tables: Record<string, unknown[]> = {
    redacoes: [{ ...redacao, redacao_temas: tema }],
    redacao_correcoes: [],
    redacao_competence_snapshots: [],
  }

  return {
    from(table: string) {
      const state: {
        filters: Array<(row: Record<string, unknown>) => boolean>
        updatePayload?: Record<string, unknown>
        upsertPayload?: Record<string, unknown>
        selectAfterWrite?: boolean
      } = { filters: [] }

      const api = {
        select(_cols?: string) {
          return api
        },
        eq(col: string, val: unknown) {
          state.filters.push((row) => row[col] === val)
          return api
        },
        update(payload: Record<string, unknown>) {
          state.updatePayload = payload
          return api
        },
        upsert(payload: Record<string, unknown>, _opts?: { onConflict?: string }) {
          state.upsertPayload = payload
          return api
        },
        insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
          const rows = Array.isArray(payload) ? payload : [payload]
          const list = (tables[table] ?? []) as Record<string, unknown>[]
          tables[table] = [...list, ...rows]
          return api
        },
        maybeSingle() {
          return Promise.resolve(api.single())
        },
        single() {
          if (table === 'redacoes') {
            const rows = (tables.redacoes ?? []) as Record<string, unknown>[]
            const row = rows.find((r) => state.filters.every((f) => f(r)))
            if (!row) return Promise.resolve({ data: null, error: { message: 'not found' } })
            if (state.updatePayload) {
              Object.assign(row, state.updatePayload)
            }
            return Promise.resolve({ data: row, error: null })
          }

          if (table === 'redacao_correcoes' && state.upsertPayload) {
            const saved = {
              id: 'correcao-1',
              ...state.upsertPayload,
            }
            tables.redacao_correcoes = [saved]
            return Promise.resolve({ data: saved, error: null })
          }

          return Promise.resolve({ data: null, error: { message: 'unsupported' } })
        },
        then(onFulfilled?: (value: unknown) => unknown) {
          if (table === 'redacao_competence_snapshots' && state.filters.length === 0) {
            return Promise.resolve({ error: null }).then(onFulfilled)
          }
          if (table === 'redacoes' && state.updatePayload) {
            const rows = tables.redacoes as Record<string, unknown>[]
            for (const row of rows) {
              if (state.filters.every((f) => f(row))) {
                Object.assign(row, state.updatePayload)
              }
            }
            return Promise.resolve({ error: null }).then(onFulfilled)
          }
          return Promise.resolve({ error: null }).then(onFulfilled)
        },
      }

      return api
    },
  }
}

function computeStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

Deno.test('runRedacaoCorrect: texto < 7 linhas é determinístico (sem LLM)', async () => {
  const redacaoId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  let llmCalls = 0
  const completer: ChatCompleter = async () => {
    llmCalls += 1
    return { content: '{}', model: 'mock' }
  }

  const admin = createMockSupabase({
    redacaoId,
    texto: 'curto',
    linhaCount: 4,
  })

  const result = await runRedacaoCorrect({
    adminClient: admin as never,
    openAiKey: 'test-key',
    redacaoId,
    chatCompleter: completer,
    searchChunks: mockSearchChunks,
  })

  assertEquals(llmCalls, 0)
  assertEquals(result.skipped_llm, true)
  assertEquals(result.correcao.nota_total, 0)
  assert(result.correcao.fatores_zero.detectado)
  assert(result.correcao.fatores_zero.motivos.includes('texto_curto'))
})

Deno.test('runRedacaoCorrect: perfis fraca/mediana/forte diferenciam nota_total', async () => {
  const profiles: Array<{ id: string; texto: string; linhas: number; perfil: QualityProfile }> = [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      texto: REDACAO_FRACA,
      linhas: 7,
      perfil: 'fraca',
    },
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      texto: REDACAO_MEDIANA,
      linhas: 15,
      perfil: 'mediana',
    },
    {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      texto: REDACAO_FORTE,
      linhas: 25,
      perfil: 'forte',
    },
  ]

  const totals: number[] = []

  for (const item of profiles) {
    const admin = createMockSupabase({
      redacaoId: item.id,
      texto: item.texto,
      linhaCount: item.linhas,
    })

    const result = await runRedacaoCorrect({
      adminClient: admin as never,
      openAiKey: 'test-key',
      redacaoId: item.id,
      chatCompleter: createMockCompleter(item.perfil),
      searchChunks: mockSearchChunks,
    })

    totals.push(result.correcao.nota_total)
    assertEquals(result.correcao.prompt_version, 'redacao-correct-v1.0')
    assertEquals(result.correcao.modelo_usado, 'mock-gpt-test')
    assert(Array.isArray(result.correcao.rag_chunks_used))
  }

  assertGreater(totals[1], totals[0])
  assertGreater(totals[2], totals[1])
})

Deno.test('consistência mock: mesma redação 10× produz σ=0 por competência', async () => {
  const redacaoId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  const competenciaTotals: Record<'I' | 'II' | 'III' | 'IV' | 'V', number[]> = {
    I: [],
    II: [],
    III: [],
    IV: [],
    V: [],
  }

  for (let i = 0; i < 10; i++) {
    const admin = createMockSupabase({
      redacaoId: `${redacaoId.slice(0, 34)}${i.toString().padStart(2, '0')}`,
      texto: REDACAO_MEDIANA,
      linhaCount: 15,
    })

    const result = await runRedacaoCorrect({
      adminClient: admin as never,
      openAiKey: 'test-key',
      redacaoId: `${redacaoId.slice(0, 34)}${i.toString().padStart(2, '0')}`,
      chatCompleter: createMockCompleter('mediana'),
      searchChunks: mockSearchChunks,
    })

    competenciaTotals.I.push(result.correcao.nota_competencia_i)
    competenciaTotals.II.push(result.correcao.nota_competencia_ii)
    competenciaTotals.III.push(result.correcao.nota_competencia_iii)
    competenciaTotals.IV.push(result.correcao.nota_competencia_iv)
    competenciaTotals.V.push(result.correcao.nota_competencia_v)
  }

  for (const comp of ['I', 'II', 'III', 'IV', 'V'] as const) {
    const sigma = computeStdDev(competenciaTotals[comp])
    assertEquals(sigma, 0, `σ competência ${comp} deve ser 0 com mock determinístico`)
  }
})
