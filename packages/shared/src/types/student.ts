export type Student = {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  current_class_id?: string
  onboarding_done: boolean
  hours_per_day: number
  created_at: string
}

export type AdminProfile = {
  id: string
  email: string
  full_name: string
  organization_id: string
  role: 'owner' | 'teacher' | 'org_admin' | 'network_admin' | 'broto_admin'
  created_at: string
}

export type UserRole = 'student' | 'admin'
