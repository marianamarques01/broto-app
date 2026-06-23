export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          organization_id: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          organization_id?: string | null
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_profiles_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      classes: {
        Row: {
          access_code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          notebook_id: string | null
          notebook_status: string
          organization_id: string
          rag_enabled: boolean
        }
        Insert: {
          access_code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          notebook_id?: string | null
          notebook_status?: string
          organization_id: string
          rag_enabled?: boolean
        }
        Update: {
          access_code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notebook_id?: string | null
          notebook_status?: string
          organization_id?: string
          rag_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'classes_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      chat_logs: {
        Row: {
          answer: string
          class_id: string | null
          created_at: string
          id: string
          model_used: string | null
          question: string
          response_time_ms: number | null
          session_id: string
          source: string
          topic_key: string | null
          turn_index: number
          user_id: string
          was_helpful: boolean | null
        }
        Insert: {
          answer: string
          class_id?: string | null
          created_at?: string
          id?: string
          model_used?: string | null
          question: string
          response_time_ms?: number | null
          session_id: string
          source?: string
          topic_key?: string | null
          turn_index?: number
          user_id: string
          was_helpful?: boolean | null
        }
        Update: {
          answer?: string
          class_id?: string | null
          created_at?: string
          id?: string
          model_used?: string | null
          question?: string
          response_time_ms?: number | null
          session_id?: string
          source?: string
          topic_key?: string | null
          turn_index?: number
          user_id?: string
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'chat_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      data_quality_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          question_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          question_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          question_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'data_quality_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          enrolled_at: string | null
          id: string
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          enrolled_at?: string | null
          id?: string
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          enrolled_at?: string | null
          id?: string
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'enrollments_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          area_key: string
          card_id: string
          created_at: string | null
          difficulty: number
          due: string
          elapsed_days: number
          id: string
          lapses: number
          last_review: string | null
          reps: number
          scheduled_days: number
          stability: number
          state: number
          topic_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area_key: string
          card_id: string
          created_at?: string | null
          difficulty?: number
          due?: string
          elapsed_days?: number
          id?: string
          lapses?: number
          last_review?: string | null
          reps?: number
          scheduled_days?: number
          stability?: number
          state?: number
          topic_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area_key?: string
          card_id?: string
          created_at?: string | null
          difficulty?: number
          due?: string
          elapsed_days?: number
          id?: string
          lapses?: number
          last_review?: string | null
          reps?: number
          scheduled_days?: number
          stability?: number
          state?: number
          topic_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flashcard_reviews_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      materials: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          index_status: string
          organization_id: string
          source_url: string
          title: string
          type: string
          uploaded_by: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          index_status?: string
          organization_id: string
          source_url: string
          title: string
          type: string
          uploaded_by: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          index_status?: string
          organization_id?: string
          source_url?: string
          title?: string
          type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'materials_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'materials_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      material_embeddings: {
        Row: {
          chunk_index: number
          chunk_text: string
          chunk_tokens: number | null
          class_id: string
          created_at: string
          embedding: string | null
          id: string
          material_id: string
          metadata: Json
          organization_id: string | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          chunk_tokens?: number | null
          class_id: string
          created_at?: string
          embedding?: string | null
          id?: string
          material_id: string
          metadata?: Json
          organization_id?: string | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          chunk_tokens?: number | null
          class_id?: string
          created_at?: string
          embedding?: string | null
          id?: string
          material_id?: string
          metadata?: Json
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'material_embeddings_class_id_fkey'
            columns: ['class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'material_embeddings_material_id_fkey'
            columns: ['material_id']
            isOneToOne: false
            referencedRelation: 'materials'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'material_embeddings_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          left_at: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          left_at?: string | null
          organization_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          left_at?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_memberships_invited_by_fkey'
            columns: ['invited_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_memberships_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_memberships_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_public: boolean
          logo_url: string | null
          name: string
          owner_id: string | null
          slug: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          is_public?: boolean
          logo_url?: string | null
          name: string
          owner_id?: string | null
          slug: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_public?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          slug?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          created_at: string
          energia: number
          fase: Database['public']['Enums']['pet_fase']
          humor: number
          id: string
          moedas: number
          nivel: number
          nome: string | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          energia?: number
          fase?: Database['public']['Enums']['pet_fase']
          humor?: number
          id?: string
          moedas?: number
          nivel?: number
          nome?: string | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          energia?: number
          fase?: Database['public']['Enums']['pet_fase']
          humor?: number
          id?: string
          moedas?: number
          nivel?: number
          nome?: string | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: 'pets_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      practice_sessions: {
        Row: {
          completed_at: string | null
          config: Json
          created_at: string
          id: string
          kind: string
          progress: Json | null
          question_ids: Json
          summary: Json | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          kind?: string
          progress?: Json | null
          question_ids?: Json
          summary?: Json | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          config?: Json
          created_at?: string
          id?: string
          kind?: string
          progress?: Json | null
          question_ids?: Json
          summary?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'practice_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
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
        Update: {
          question_id?: string
          topico_value?: string
        }
        Relationships: []
      }
      signup_defaults: {
        Row: {
          default_class_id: string
          id: number
          updated_at: string
        }
        Insert: {
          default_class_id: string
          id?: number
          updated_at?: string
        }
        Update: {
          default_class_id?: string
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'signup_defaults_default_class_id_fkey'
            columns: ['default_class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
      tenants: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      topic_performance: {
        Row: {
          accuracy_pct: number | null
          area_key: string | null
          id: string
          last_practiced: string | null
          mastery_level: string | null
          p_know: number
          topico_value: string
          total_answered: number
          total_correct: number
          user_id: string
        }
        Insert: {
          accuracy_pct?: number | null
          area_key?: string | null
          id?: string
          last_practiced?: string | null
          mastery_level?: string | null
          p_know?: number
          topico_value: string
          total_answered?: number
          total_correct?: number
          user_id: string
        }
        Update: {
          accuracy_pct?: number | null
          area_key?: string | null
          id?: string
          last_practiced?: string | null
          mastery_level?: string | null
          p_know?: number
          topico_value?: string
          total_answered?: number
          total_correct?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'topic_performance_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_question_answers: {
        Row: {
          acertou: boolean
          answer: string | null
          answer_area_key: string | null
          area_key: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          mistake_type: string | null
          question_id: string
          session_id: string | null
          tempo_resposta: number | null
          topico_value: string | null
          user_id: string
        }
        Insert: {
          acertou: boolean
          answer?: string | null
          answer_area_key?: string | null
          area_key?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          mistake_type?: string | null
          question_id: string
          session_id?: string | null
          tempo_resposta?: number | null
          topico_value?: string | null
          user_id: string
        }
        Update: {
          acertou?: boolean
          answer?: string | null
          answer_area_key?: string | null
          area_key?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          mistake_type?: string | null
          question_id?: string
          session_id?: string | null
          tempo_resposta?: number | null
          topico_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_question_answers_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'practice_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_question_answers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      streak_freeze_events: {
        Row: {
          created_at: string
          freeze_number: number
          id: string
          streak_at_time: number
          user_id: string
        }
        Insert: {
          created_at?: string
          freeze_number: number
          id?: string
          streak_at_time: number
          user_id: string
        }
        Update: {
          created_at?: string
          freeze_number?: number
          id?: string
          streak_at_time?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'streak_freeze_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          cidade: string | null
          cpf: string | null
          created_at: string
          current_class_id: string | null
          current_organization_id: string | null
          curso_desejado: string | null
          data_enem: string | null
          data_nascimento: string | null
          dias_disponiveis: Json | null
          email: string
          estado: string | null
          faculdade_desejada: string | null
          horas_disponiveis_por_dia: number
          id: string
          image: string | null
          last_study_date: string | null
          meta_nota: number | null
          meta_redacao: number | null
          nivel_por_area: Json | null
          nivel_redacao: string | null
          nome: string
          nota_enem_anterior: number | null
          onboarding_done: boolean
          onboarding_profile: Json | null
          onboarding_routine_banner_shown: boolean
          onboarding_completed_at: string | null
          periodo_preferido: string | null
          streak: number
          streak_freezes: number
          strong_areas: string[]
          target_score: number | null
          total_freezes_earned: number
          telefone: string | null
          updated_at: string
          weak_areas: string[]
          hours_per_day: number
          exam_date: string | null
        }
        Insert: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          current_class_id?: string | null
          current_organization_id?: string | null
          curso_desejado?: string | null
          data_enem?: string | null
          data_nascimento?: string | null
          dias_disponiveis?: Json | null
          email: string
          estado?: string | null
          exam_date?: string | null
          faculdade_desejada?: string | null
          horas_disponiveis_por_dia?: number
          hours_per_day?: number
          id: string
          image?: string | null
          last_study_date?: string | null
          meta_nota?: number | null
          meta_redacao?: number | null
          nivel_por_area?: Json | null
          nivel_redacao?: string | null
          nome: string
          nota_enem_anterior?: number | null
          onboarding_completed_at?: string | null
          onboarding_done?: boolean
          onboarding_profile?: Json | null
          onboarding_routine_banner_shown?: boolean
          periodo_preferido?: string | null
          streak?: number
          streak_freezes?: number
          strong_areas?: string[]
          target_score?: number | null
          total_freezes_earned?: number
          telefone?: string | null
          updated_at?: string
          weak_areas?: string[]
        }
        Update: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          current_class_id?: string | null
          current_organization_id?: string | null
          curso_desejado?: string | null
          data_enem?: string | null
          data_nascimento?: string | null
          dias_disponiveis?: Json | null
          email?: string
          estado?: string | null
          exam_date?: string | null
          faculdade_desejada?: string | null
          horas_disponiveis_por_dia?: number
          hours_per_day?: number
          id?: string
          image?: string | null
          last_study_date?: string | null
          meta_nota?: number | null
          meta_redacao?: number | null
          nivel_por_area?: Json | null
          nivel_redacao?: string | null
          nome?: string
          nota_enem_anterior?: number | null
          onboarding_completed_at?: string | null
          onboarding_done?: boolean
          onboarding_profile?: Json | null
          onboarding_routine_banner_shown?: boolean
          periodo_preferido?: string | null
          streak?: number
          streak_freezes?: number
          strong_areas?: string[]
          target_score?: number | null
          total_freezes_earned?: number
          telefone?: string | null
          updated_at?: string
          weak_areas?: string[]
        }
        Relationships: [
          {
            foreignKeyName: 'fk_users_current_class'
            columns: ['current_class_id']
            isOneToOne: false
            referencedRelation: 'classes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_class_ids: { Args: never; Returns: string[] }
      app_rls_class_org_id: {
        Args: { p_class_id: string; p_require_active?: boolean }
        Returns: string
      }
      app_rls_is_active_staff_in_org: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      app_rls_user_has_active_enrollment_in_class: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      match_material_chunks: {
        Args: {
          match_class_id: string
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          chunk_text: string
          id: string
          material_id: string
          metadata: Json
          similarity: number
        }[]
      }
      rpc_class_join: {
        Args: { p_access_code: string; p_user_id: string }
        Returns: Json
      }
      rpc_onboard_new_user_default_org: {
        Args: { p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      pet_fase: 'semente' | 'muda' | 'planta' | 'flor' | 'especial'
      user_role: 'student' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      pet_fase: ['semente', 'muda', 'planta', 'flor', 'especial'],
      user_role: ['student', 'admin'],
    },
  },
} as const

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
export type FlashcardReviewsRow = Database['public']['Tables']['flashcard_reviews']['Row']
export type FlashcardReviewsInsert = Database['public']['Tables']['flashcard_reviews']['Insert']
export type StreakFreezeEventsRow = Database['public']['Tables']['streak_freeze_events']['Row']
export type StreakFreezeEventsInsert =
  Database['public']['Tables']['streak_freeze_events']['Insert']
