import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const { access_code } = await req.json()
    if (!access_code?.trim()) {
      return new Response(JSON.stringify({ error: "access_code é obrigatório" }), { status: 400 })
    }

    // Buscar turma pelo código
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, name, organization_id, is_active")
      .eq("access_code", access_code.toUpperCase().trim())
      .eq("is_active", true)
      .single()

    if (classError || !classData) {
      return new Response(JSON.stringify({ error: "Código inválido ou turma inativa" }), { status: 404 })
    }

    // Matricular aluno
    const { error: enrollError } = await supabase
      .from("enrollments")
      .upsert({
        class_id: classData.id,
        student_id: user.id,
        status: "active"
      }, { onConflict: "class_id,student_id" })

    if (enrollError) {
      return new Response(JSON.stringify({ error: "Erro ao matricular" }), { status: 500 })
    }

    // Atualizar current_class_id no users
    await supabase
      .from("users")
      .update({ current_class_id: classData.id })
      .eq("id", user.id)

    return new Response(
      JSON.stringify({ success: true, class: classData }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
