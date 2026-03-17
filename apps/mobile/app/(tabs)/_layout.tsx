import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    House,
    BookOpenText,
    Brain,
    ChartDonut,
    CalendarCheck,
} from 'phosphor-react-native';
import { colors } from '@/theme/tokens';
import { useUser } from '@/hooks/use-user';
import { TabIcon } from '@/components/TabIcon';

export default function TabsLayout() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, loading } = useUser();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (user && !user.onboardingDone) {
            router.replace('/onboarding');
        }
        setChecked(true);
    }, [loading, user, router]);

    if (!checked) return null;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: '#031A11',
                    borderTopWidth: 0,
                    paddingTop: 14,
                    paddingBottom: insets.bottom,
                    height: 70 + insets.bottom,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: '#DFCC00',
                tabBarInactiveTintColor: colors.text.muted,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={House} />
                    ),
                }}
            />
            <Tabs.Screen
                name="study"
                options={{
                    title: 'Estudar',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={BookOpenText} />
                    ),
                }}
            />
            <Tabs.Screen
                name="questions"
                options={{
                    title: 'Questões',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={Brain} />
                    ),
                }}
            />
            <Tabs.Screen
                name="progress"
                options={{
                    title: 'Progresso',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={ChartDonut} />
                    ),
                }}
            />
            <Tabs.Screen
                name="routine"
                options={{
                    title: 'Rotina',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} Icon={CalendarCheck} />
                    ),
                }}
            />
        </Tabs>
    );
}
