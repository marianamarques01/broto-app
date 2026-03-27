import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').filter(Boolean)

/** topico_value (slug) → área ENEM + rótulo do tópico (alinhado ao app) */
const TOPICO: Record<string, { area: string; label: string }> = {
  'interpretacao-texto': { area: 'linguagens', label: 'Interpretação de Texto' },
  literatura: { area: 'linguagens', label: 'Literatura Brasileira' },
  gramatica: { area: 'linguagens', label: 'Gramática e Norma Culta' },
  'generos-textuais': { area: 'linguagens', label: 'Gêneros Textuais' },
  'variacoes-linguisticas': { area: 'linguagens', label: 'Variações Linguísticas' },
  'historia-brasil': { area: 'ciencias-humanas', label: 'História do Brasil' },
  'geografia-politica': { area: 'ciencias-humanas', label: 'Geografia Política' },
  filosofia: { area: 'ciencias-humanas', label: 'Filosofia' },
  sociologia: { area: 'ciencias-humanas', label: 'Sociologia' },
  'geografia-fisica': { area: 'ciencias-humanas', label: 'Geografia Física' },
  genetica: { area: 'ciencias-natureza', label: 'Genética' },
  ecologia: { area: 'ciencias-natureza', label: 'Ecologia' },
  'quimica-organica': { area: 'ciencias-natureza', label: 'Química Orgânica' },
  termodinamica: { area: 'ciencias-natureza', label: 'Termodinâmica' },
  citologia: { area: 'ciencias-natureza', label: 'Citologia' },
  funcoes: { area: 'matematica', label: 'Funções' },
  'geometria-plana': { area: 'matematica', label: 'Geometria Plana' },
  probabilidade: { area: 'matematica', label: 'Probabilidade e Estatística' },
  porcentagem: { area: 'matematica', label: 'Porcentagem e Razão' },
  combinatoria: { area: 'matematica', label: 'Análise Combinatória' },
}

const AREA_ORDER: { value: string; label: string }[] = [
  { value: 'linguagens', label: 'Linguagens' },
  { value: 'ciencias-humanas', label: 'Ciencias Humanas' },
  { value: 'ciencias-natureza', label: 'Ciencias da Natureza' },
  { value: 'matematica', label: 'Matematica' },
]

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allowed =
    ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)
      ? origin || '*'
      : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

function json(status: number, body: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  })
}

serve(async (req) => {
  const cors = getCorsHeaders(req)

  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    if (req.method !== 'GET') return json(405, { error: 'Method not allowed' }, cors)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(401, { error: 'Unauthorized' }, cors)

    const supabaseAuthed = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseAuthed.auth.getUser()
    if (authError || !user) return json(401, { error: 'Unauthorized' }, cors)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: rows, error } = await supabaseAdmin
      .from('topic_performance')
      .select('topico_value, total_answered, total_correct, accuracy_pct, area_key')
      .eq('user_id', user.id)

    if (error) {
      const { data: rows2, error: err2 } = await supabaseAdmin
        .from('topic_performance')
        .select('topico_value, total_answered, total_correct, accuracy_pct')
        .eq('user_id', user.id)
      if (err2) {
        console.error('user-progress:', err2)
        return json(500, { error: err2.message }, cors)
      }
      return json(200, aggregate(rows2 ?? []), cors)
    }

    return json(200, aggregate(rows ?? []), cors)
  } catch (err) {
    return json(500, { error: String(err) }, cors)
  }
})

type Row = {
  topico_value: string
  total_answered: number
  total_correct: number
  accuracy_pct: number
  area_key?: string | null
}

function aggregate(rows: Row[]) {
  const areaMap = new Map<
    string,
    {
      value: string
      label: string
      totalAnswered: number
      totalCorrect: number
      topicos: Map<
        string,
        {
          value: string
          label: string
          totalAnswered: number
          totalCorrect: number
          accuracyPct: number
        }
      >
    }
  >()

  for (const a of AREA_ORDER) {
    areaMap.set(a.value, {
      value: a.value,
      label: a.label,
      totalAnswered: 0,
      totalCorrect: 0,
      topicos: new Map(),
    })
  }

  const outros = {
    value: 'outros',
    label: 'Outros',
    totalAnswered: 0,
    totalCorrect: 0,
    topicos: new Map<
      string,
      {
        value: string
        label: string
        totalAnswered: number
        totalCorrect: number
        accuracyPct: number
      }
    >(),
  }

  for (const r of rows) {
    const meta = TOPICO[r.topico_value]
    const fromDb = r.area_key && String(r.area_key).trim()
    const resolved =
      fromDb && areaMap.has(fromDb)
        ? fromDb
        : meta?.area && areaMap.has(meta.area)
          ? meta.area
          : null
    const area = resolved ? areaMap.get(resolved)! : outros

    const ta = Number(r.total_answered) || 0
    const tc = Number(r.total_correct) || 0
    const acc = r.accuracy_pct != null ? Number(r.accuracy_pct) : ta > 0 ? (tc / ta) * 100 : 0

    area.totalAnswered += ta
    area.totalCorrect += tc

    const label = meta?.label ?? humanizeTopico(r.topico_value)
    area.topicos.set(r.topico_value, {
      value: r.topico_value,
      label,
      totalAnswered: ta,
      totalCorrect: tc,
      accuracyPct: Math.round(acc * 10) / 10,
    })
  }

  let totalAnswered = 0
  let totalCorrect = 0
  const areas: unknown[] = []

  for (const a of AREA_ORDER) {
    const block = areaMap.get(a.value)!
    totalAnswered += block.totalAnswered
    totalCorrect += block.totalCorrect
    const topicos = [...block.topicos.values()].sort((x, y) => y.totalAnswered - x.totalAnswered)
    const acc =
      block.totalAnswered > 0
        ? Math.round((block.totalCorrect / block.totalAnswered) * 1000) / 10
        : 0
    areas.push({
      value: block.value,
      label: block.label,
      totalAnswered: block.totalAnswered,
      totalCorrect: block.totalCorrect,
      accuracyPct: acc,
      topicos,
    })
  }

  if (outros.topicos.size > 0) {
    totalAnswered += outros.totalAnswered
    totalCorrect += outros.totalCorrect
    const topicos = [...outros.topicos.values()].sort((x, y) => y.totalAnswered - x.totalAnswered)
    const acc =
      outros.totalAnswered > 0
        ? Math.round((outros.totalCorrect / outros.totalAnswered) * 1000) / 10
        : 0
    areas.push({
      value: outros.value,
      label: outros.label,
      totalAnswered: outros.totalAnswered,
      totalCorrect: outros.totalCorrect,
      accuracyPct: acc,
      topicos,
    })
  }

  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 1000) / 10 : 0

  return {
    totalAnswered,
    totalCorrect,
    accuracyPct,
    areas,
  }
}

function humanizeTopico(slug: string): string {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
