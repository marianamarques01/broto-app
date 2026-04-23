import { useEffect } from 'react'
import { View } from 'react-native'
import { Tabs, useRouter } from 'expo-router'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import {
  House,
  BookOpenText,
  GraduationCap,
  ChartDonut,
  CalendarCheck,
} from 'phosphor-react-native'
import { colors } from '@/theme/tokens'
import { useUser } from '@/hooks/useUser'
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher'
import { TabIcon } from '@/components/TabIcon'
import { BrotoChatFab } from '@/components/BrotoChatFab'
import { MobileTabBar } from '@/components/MobileTabBar'

export default function TabsLayout() {
  const router = useRouter()
  const { user, loading } = useUser()

  useEffect(() => {
    if (loading) return
    if (user && !user.onboardingDone) {
      router.replace('/onboarding')
    }
  }, [loading, user, router])

  return (
    <View style={{ flex: 1 }}>
      <OrganizationSwitcher />
      <Tabs
        initialRouteName="index"
        tabBar={(props: BottomTabBarProps) => <MobileTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            boxShadow: 'none',
          },
          tabBarActiveTintColor: colors.cta.gradientEnd,
          tabBarInactiveTintColor: colors.text.muted,
        }}
      >
        {/** Ordem: Estudo + Progresso | Início | Rotina + Banco (mesmo padrão do print). */}
        <Tabs.Screen
          name="study"
          options={{
            title: 'Estudo',
            tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
              <TabIcon
                focused={focused}
                Icon={BookOpenText}
                activeColor={color}
                indicator="bare"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progresso',
            tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
              <TabIcon
                focused={focused}
                Icon={ChartDonut}
                activeColor={color}
                indicator="bare"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
              <TabIcon focused={focused} Icon={House} activeColor={color} indicator="bare" />
            ),
          }}
        />
        <Tabs.Screen
          name="routine"
          options={{
            title: 'Rotina',
            tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
              <TabIcon
                focused={focused}
                Icon={CalendarCheck}
                activeColor={color}
                indicator="bare"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="questions"
          options={{
            title: 'Banco',
            tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
              <TabIcon
                focused={focused}
                Icon={GraduationCap}
                activeColor={color}
                indicator="bare"
              />
            ),
          }}
        />
      </Tabs>
      <BrotoChatFab />
    </View>
  )
}
