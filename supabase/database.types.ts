/**
 * [REVISAR] Regenerar com Supabase CLI quando Docker ou credenciais DB estiverem disponíveis:
 *
 *   supabase gen types typescript --local > supabase/database.types.ts
 *   # ou remoto:
 *   supabase gen types typescript --linked > supabase/database.types.ts
 *
 * Stub manual derivado das migrações em `supabase/migrations/` — cobre tabelas usadas pelas edge functions.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nome: string
          telefone: string | null
          cpf: string | null
          cidade: string | null
          estado: string | null
          data_nascimento: string | null
          data_enem: string | null
          horas_disponiveis_por_dia: number
          image: string | null
          onboarding_done: boolean
          onboarding_profile: Json | null
          streak: number
          last_study_date: string | null
          current_class_id: string | null
          current_organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nome: string
          telefone?: string | null
          cpf?: string | null
          cidade?: string | null
          estado?: string | null
          data_nascimento?: string | null
          data_enem?: string | null
          horas_disponiveis_por_dia?: number
          image?: string | null
          onboarding_done?: boolean
          onboarding_profile?: Json | null
          streak?: number
          last_study_date?: string | null
          current_class_id?: string | null
          current_organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      pets: {
        Row: {
          id: string
          user_id: string
          nivel: number
          xp: number
          fase: string
          humor: number
          energia: number
          moedas: number
          nome: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nivel?: number
          xp?: number
          fase?: string
          humor?: number
          energia?: number
          moedas?: number
          nome?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['pets']['Insert']>
      }
      user_question_answers: {
        Row: {
          id: string
          user_id: string
          question_id: string
          acertou: boolean
          tempo_resposta: number | null
          session_id: string | null
          answer_area_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          acertou: boolean
          tempo_resposta?: number | null
          session_id?: string | null
          answer_area_key?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_question_answers']['Insert']>
      }
      practice_sessions: {
        Row: {
          id: string
          user_id: string
          kind: string
          config: Json
          question_ids: Json
          summary: Json | null
          progress: Json | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          kind?: string
          config?: Json
          question_ids: Json
          summary?: Json | null
          progress?: Json | null
          created_at?: string
          completed_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['practice_sessions']['Insert']>
      }
      topic_performance: {
        Row: {
          id: string
          user_id: string
          topico_value: string
          total_answered: number
          total_correct: number
          accuracy_pct: number | null
          last_practiced: string | null
          mastery_level: string | null
          area_key: string | null
        }
        Insert: {
          id?: string
          user_id: string
          topico_value: string
          total_answered?: number
          total_correct?: number
          accuracy_pct?: number | null
          last_practiced?: string | null
          mastery_level?: string | null
          area_key?: string | null
        }
        Update: Partial<Database['public']['Tables']['topic_performance']['Insert']>
      }
      question_topic_mapping: {
        Row: {
          question_id: string
          topico_value: string
        }
        Insert: {
          question_id: string
          topico_value: string
        }
        Update: Partial<Database['public']['Tables']['question_topic_mapping']['Insert']>
      }
      organization_memberships: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: string
          status: string
          invited_by: string | null
          joined_at: string | null
          left_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: string
          status?: string
          invited_by?: string | null
          joined_at?: string | null
          left_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['organization_memberships']['Insert']>
      }
      classes: {
        Row: {
          id: string
          organization_id: string
          name: string
          is_active: boolean
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      rpc_class_join: {
        Args: { p_user_id: string; p_access_code: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
  }
}

/** Aliases de linha usados nas edge functions. */
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
