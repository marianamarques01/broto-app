/**
 * Client Supabase tipado para edge functions.
 * [REVISAR] Regenerar `supabase/database.types.ts` com CLI quando Docker/credenciais estiverem OK.
 */
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { Database } from '../../database.types.ts'

export type { Database }
export type TypedSupabaseClient = SupabaseClient<Database>

export function createTypedClient(url: string, key: string): TypedSupabaseClient {
  return createClient<Database>(url, key)
}

export function createTypedServiceRoleClient(): TypedSupabaseClient {
  return createTypedClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

export function createTypedAnonClient(authHeader: string): TypedSupabaseClient {
  return createClient<Database>(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
}
