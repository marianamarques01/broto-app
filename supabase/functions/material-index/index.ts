import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SERVICE_URL = Deno.env.get("NOTEBOOKLM_SERVICE_URL")!
const SERVICE_SECRET = Deno.env.get("SERVICE_SECRET") ?? Deno.env.get("NOTEBOOKLM_INTERNAL_SECRET") ?? ""

const INDEX_TIMEOUT_MS = 55_000

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function serviceHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(SERVICE_SECRET ? { Authorization: `Bearer ${SERVICE_SECRET}` } : {}),
  }
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    // Auth check — verify caller is an admin of the class's organization
    const authHeader = req.headers.get("Authorization")
    if (authHeader) {
      const supabaseAuthed = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user }, error: authError } = await supabaseAuthed.auth.getUser()
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
      }
      // Note: deeper org-level authorization should be added when admin_profiles
      // are fully enforced (check user.id is admin of the material's org)
    }

    const { material_id, class_id } = await req.json()

    // Input validation
    if (!material_id || !class_id) {
      return new Response(JSON.stringify({ error: "material_id e class_id são obrigatórios" }), { status: 400 })
    }
    if (!UUID_RE.test(material_id) || !UUID_RE.test(class_id)) {
      return new Response(JSON.stringify({ error: "IDs devem ser UUIDs válidos" }), { status: 400 })
    }

    // Fetch material
    const { data: material, error: matError } = await supabase
      .from('materials')
      .select('title, type, source_url')
      .eq('id', material_id)
      .single()

    if (matError || !material) {
      return new Response(JSON.stringify({ error: 'Material não encontrado' }), { status: 404 })
    }

    // Mark as indexing
    await supabase
      .from('materials')
      .update({ index_status: 'indexing' })
      .eq('id', material_id)

    // Fetch class
    const { data: cls } = await supabase
      .from('classes')
      .select('notebook_id, notebook_status, name')
      .eq('id', class_id)
      .single()

    if (!cls) {
      await supabase.from('materials').update({ index_status: 'failed' }).eq('id', material_id)
      return new Response(JSON.stringify({ error: 'Turma não encontrada' }), { status: 404 })
    }

    // Create notebook if class doesn't have one yet
    if (!cls.notebook_id) {
      const createRes = await fetch(`${SERVICE_URL}/notebook/create`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({ class_id, class_name: cls.name }),
      })

      if (!createRes.ok) {
        await supabase.from('materials').update({ index_status: 'failed' }).eq('id', material_id)
        return new Response(JSON.stringify({ error: 'Erro ao criar notebook' }), { status: 500 })
      }

      const { notebook_id } = await createRes.json()
      await supabase.from('classes').update({ notebook_id, notebook_status: 'indexing' }).eq('id', class_id)
    }

    // Build indexing payload
    const sourcePayload: Record<string, string> = { class_id }

    if (material.type === 'text') {
      sourcePayload.source_type = 'text'
      sourcePayload.text = material.source_url
      sourcePayload.title = material.title
    } else {
      sourcePayload.source_type = 'url'
      sourcePayload.url = material.source_url
    }

    // Send for indexing with timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), INDEX_TIMEOUT_MS)

    try {
      const indexRes = await fetch(`${SERVICE_URL}/notebook/add-source`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify(sourcePayload),
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (!indexRes.ok) {
        await supabase.from('materials').update({ index_status: 'failed' }).eq('id', material_id)
        return new Response(JSON.stringify({ error: 'Erro ao indexar' }), { status: 500 })
      }

      await supabase.from('materials').update({ index_status: 'indexed' }).eq('id', material_id)
      await supabase.from('classes').update({ notebook_status: 'ready' }).eq('id', class_id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err) {
      clearTimeout(timer)

      if (err instanceof DOMException && err.name === 'AbortError') {
        // Timeout — mark as pending (not indexed) so it can be retried
        await supabase.from('materials').update({ index_status: 'pending' }).eq('id', material_id)

        return new Response(JSON.stringify({
          success: false,
          error: 'Timeout — indexação pode estar em andamento. Material voltou para pendente.',
        }), {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw err
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
