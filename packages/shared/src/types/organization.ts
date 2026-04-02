export type Organization = {
  id: string
  name: string
  slug: string
  logo_url?: string
  is_public: boolean
  owner_id: string
  config: OrganizationConfig
  created_at: string
}

export type OrganizationConfig = {
  mascot_name: string
  primary_color: string
  features: {
    chat?: boolean
    flashcards?: boolean
    mind_map?: boolean
    routine?: boolean
    audio_overview?: boolean
  }
}
