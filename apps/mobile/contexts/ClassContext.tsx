import { createContext, useEffect, useState, type ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { createClient } from '@/lib/supabase/client'
import type { Class, Organization } from '@broto/shared'

type ClassContextType = {
  currentClass: Class | null
  organization: Organization | null
  loading: boolean
  error: string | null
}

export const ClassContext = createContext<ClassContextType | null>(null)

function formatClassLoadError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    const m = (err as { message: string }).message.trim()
    if (m) return m
  }
  return 'Não foi possível carregar os dados da turma.'
}

export function ClassProvider({ children }: { children: ReactNode }) {
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      const supabase = createClient()
      const { data: userData, error: authErr } = await supabase.auth.getUser()
      if (authErr) {
        if (alive) {
          setError(formatClassLoadError(authErr))
          setLoading(false)
        }
        return
      }

      const user = userData?.user
      if (!user) {
        if (alive) {
          setError(null)
          setLoading(false)
        }
        return
      }

      // Single query: get user's class + organization via join
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('current_class_id, classes:current_class_id(*, organizations(*))')
        .eq('id', user.id)
        .single()

      if (profileError) {
        if (alive) {
          setCurrentClass(null)
          setOrganization(null)
          setError(formatClassLoadError(profileError))
          setLoading(false)
        }
        return
      }

      const classRow = (profile as Record<string, unknown> | null)?.classes as Record<
        string,
        unknown
      > | null

      if (alive) {
        setError(null)
        if (classRow) {
          setCurrentClass(classRow as unknown as Class)
          setOrganization((classRow.organizations as Organization) ?? null)
        } else {
          setCurrentClass(null)
          setOrganization(null)
        }
        setLoading(false)
      }
    }

    load().catch((err) => {
      if (alive) {
        setCurrentClass(null)
        setOrganization(null)
        setError(formatClassLoadError(err))
        setLoading(false)
      }
    })

    return () => {
      alive = false
    }
  }, [])

  return (
    <ClassContext.Provider value={{ currentClass, organization, loading, error }}>
      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}
      {children}
    </ClassContext.Provider>
  )
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(180, 40, 40, 0.2)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,100,100,0.35)',
  },
  bannerText: {
    color: '#ffb4b4',
    fontSize: 13,
    textAlign: 'center',
  },
})
