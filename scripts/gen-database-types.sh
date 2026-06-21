#!/usr/bin/env bash
# Regenera supabase/database.types.ts a partir do projeto linkado e reaplica aliases Row.
#
# Pré-requisitos:
#   1. Supabase CLI instalado (`brew install supabase/tap/supabase` ou ver docs)
#   2. Login: `supabase login`
#   3. Projeto linkado na raiz do repo: `supabase link --project-ref <ref>`
#   4. Senha do banco na sessão: `export SUPABASE_DB_PASSWORD='...'`
#
# Uso (na raiz do monorepo):
#   ./scripts/gen-database-types.sh
#
# Nunca commitar SUPABASE_DB_PASSWORD nem outros secrets.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TYPES_FILE="${ROOT}/supabase/database.types.ts"
TMP_FILE="${TYPES_FILE}.tmp"

if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
  echo "Erro: defina SUPABASE_DB_PASSWORD antes de regenerar os tipos." >&2
  echo "  export SUPABASE_DB_PASSWORD='sua-senha-do-banco'" >&2
  echo "Requer supabase login e projeto linkado (supabase link)." >&2
  exit 1
fi

cd "${ROOT}"

supabase gen types typescript --linked > "${TMP_FILE}"
mv "${TMP_FILE}" "${TYPES_FILE}"

cat >> "${TYPES_FILE}" << 'ALIASES_EOF'

/** Aliases de linha usados nas edge functions — preservar ao regenerar com CLI. */
export type UsersRow = Database['public']['Tables']['users']['Row']
export type PetsRow = Database['public']['Tables']['pets']['Row']
export type UserQuestionAnswerRow = Database['public']['Tables']['user_question_answers']['Row']
export type UserQuestionAnswerInsert =
  Database['public']['Tables']['user_question_answers']['Insert']
export type PracticeSessionRow = Database['public']['Tables']['practice_sessions']['Row']
export type PracticeSessionInsert = Database['public']['Tables']['practice_sessions']['Insert']
export type TopicPerformanceRow = Database['public']['Tables']['topic_performance']['Row']
export type TopicPerformanceInsert = Database['public']['Tables']['topic_performance']['Insert']
export type OrganizationMembershipRow =
  Database['public']['Tables']['organization_memberships']['Row']
export type ClassesRow = Database['public']['Tables']['classes']['Row']
export type EnrollmentsRow = Database['public']['Tables']['enrollments']['Row']
export type OrganizationsRow = Database['public']['Tables']['organizations']['Row']
export type MaterialsRow = Database['public']['Tables']['materials']['Row']
export type QuestionTopicMappingRow = Database['public']['Tables']['question_topic_mapping']['Row']
ALIASES_EOF

echo "Tipos regenerados em ${TYPES_FILE} (aliases Row reaplicados)."
