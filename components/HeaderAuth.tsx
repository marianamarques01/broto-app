import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { createClient } from '@/lib/supabase/client';
import { colors } from '@/theme/tokens';

export function HeaderAuth() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setIsLoggedIn(!!user);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsLoggedIn(!!session?.user);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
    }

    if (isLoggedIn !== true) return null;

    return (
        <Pressable
            onPress={handleSignOut}
            className="flex-row items-center gap-2 rounded-lg px-3 py-2"
        >
            <LogOut size={16} color={colors.text.muted} />
            <Text className="text-sm text-muted-foreground">Sair</Text>
        </Pressable>
    );
}
