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
export type EnemReferenceDocumentsRow =
  Database['public']['Tables']['enem_reference_documents']['Row']
export type EnemReferenceDocumentsInsert =
  Database['public']['Tables']['enem_reference_documents']['Insert']
export type EnemReferenceEmbeddingsRow =
  Database['public']['Tables']['enem_reference_embeddings']['Row']
export type EnemReferenceEmbeddingsInsert =
  Database['public']['Tables']['enem_reference_embeddings']['Insert']
export type QuestionTopicMappingRow = Database['public']['Tables']['question_topic_mapping']['Row']
export type RedacaoTemasRow = Database['public']['Tables']['redacao_temas']['Row']
export type RedacaoTemasInsert = Database['public']['Tables']['redacao_temas']['Insert']
export type RedacoesRow = Database['public']['Tables']['redacoes']['Row']
export type RedacoesInsert = Database['public']['Tables']['redacoes']['Insert']
export type RedacaoCorrecoesRow = Database['public']['Tables']['redacao_correcoes']['Row']
export type RedacaoCorrecoesInsert = Database['public']['Tables']['redacao_correcoes']['Insert']
export type RedacaoRepertoriosRow = Database['public']['Tables']['redacao_repertorios']['Row']
export type RedacaoRepertoriosInsert = Database['public']['Tables']['redacao_repertorios']['Insert']
export type RedacaoRevisoesHumanasRow =
  Database['public']['Tables']['redacao_revisoes_humanas']['Row']
export type RedacaoCompetenceSnapshotsRow =
  Database['public']['Tables']['redacao_competence_snapshots']['Row']
export type FlashcardReviewsRow = Database['public']['Tables']['flashcard_reviews']['Row']
export type FlashcardReviewsInsert = Database['public']['Tables']['flashcard_reviews']['Insert']
export type StreakFreezeEventsRow = Database['public']['Tables']['streak_freeze_events']['Row']
export type StreakFreezeEventsInsert =
  Database['public']['Tables']['streak_freeze_events']['Insert']
export type EngagementSnapshotsClassRow =
  Database['public']['Tables']['engagement_snapshots_class']['Row']
export type EngagementSnapshotsOrgRow =
  Database['public']['Tables']['engagement_snapshots_org']['Row']
export type StudentFollowUpsRow = Database['public']['Tables']['student_follow_ups']['Row']
export type StudentFollowUpsInsert = Database['public']['Tables']['student_follow_ups']['Insert']
ALIASES_EOF

echo "Tipos regenerados em ${TYPES_FILE} (aliases Row reaplicados)."
