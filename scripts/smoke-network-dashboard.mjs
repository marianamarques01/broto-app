#!/usr/bin/env node
/**
 * Smoke test automatizável — painel rede (API).
 * Uso: npm run smoke:network
 *
 * Carrega automaticamente apps/admin/.env e apps/web/.env (se existirem).
 * Variáveis explícitas no shell têm prioridade.
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

const root = resolve(import.meta.dirname, '..')
loadEnvFile(resolve(root, 'apps/admin/.env'))
loadEnvFile(resolve(root, 'apps/web/.env'))

const SUPABASE_URL = (
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  ''
).replace(/\/$/, '')
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
const EMAIL = process.env.NETWORK_DEMO_EMAIL ?? 'rede@demo'
const PASSWORD = process.env.NETWORK_DEMO_PASSWORD ?? 'BrotoDemo2026!'

/** UUID fixo do seed — supabase/scripts/seed-network-demo.sql */
const NETWORK_ORG_ID = 'b0e00000-0000-4000-8000-000000000100'

const FORBIDDEN_KEYS = ['"nome"', '"userId"', '"studentId"', '"atRiskAlerts"']

function fail(message) {
  console.error(`[smoke:network] FAIL: ${message}`)
  process.exit(1)
}

function ok(message) {
  console.log(`[smoke:network] OK: ${message}`)
}

async function main() {
  if (!SUPABASE_URL || !ANON_KEY) {
    fail(
      'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em apps/admin/.env (ou exporte no shell)',
    )
  }

  if (ANON_KEY === 'your-anon-key-here' || ANON_KEY.length < 20) {
    fail('VITE_SUPABASE_ANON_KEY inválida — copie a anon key do Supabase Dashboard → Settings → API')
  }

  if (!PASSWORD) {
    console.warn('[smoke:network] SKIP: NETWORK_DEMO_PASSWORD não definido — smoke API ignorado')
    process.exit(0)
  }

  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })

  if (!loginRes.ok) {
    const body = await loginRes.text()
    fail(`Login falhou (${loginRes.status}): ${body}`)
  }

  const { access_token: token } = await loginRes.json()
  if (!token) fail('Login sem access_token')

  ok(`Login ${EMAIL}`)

  const apiUrl = `${SUPABASE_URL}/functions/v1/engagement-network-get?networkOrgId=${NETWORK_ORG_ID}`
  const apiRes = await fetch(apiUrl, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      Origin: process.env.SMOKE_ORIGIN ?? 'http://localhost:5174',
    },
  })

  const payload = await apiRes.json().catch(() => ({}))
  if (!apiRes.ok) {
    fail(`engagement-network-get ${apiRes.status}: ${JSON.stringify(payload)}`)
  }

  ok('engagement-network-get 200')

  const serialized = JSON.stringify(payload)
  for (const key of FORBIDDEN_KEYS) {
    if (serialized.includes(key)) {
      fail(`Payload expõe PII: ${key}`)
    }
  }

  ok('Payload sem nomes de aluno')

  const schools = payload?.view?.schools ?? []
  if (schools.length < 1) {
    fail('Nenhuma escola no payload — aplicar seed-network-demo.sql?')
  }

  ok(`${schools.length} escola(s) no comparativo`)

  const hasRisk = schools.every((s) => typeof s.abandonmentRiskIndex === 'number')
  if (!hasRisk) fail('abandonmentRiskIndex ausente em alguma escola')

  ok('Índice de risco presente em todas as escolas')
  console.log('[smoke:network] Todos os checks passaram')
}

main().catch((err) => fail(String(err)))
