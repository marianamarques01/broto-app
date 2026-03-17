import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { colors, fonts } from '@/theme/tokens';

export function HeaderAuth() {
    const router = useRouter();
    const { status } = useAuth();

    const handleSignOut = useCallback(async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.replace('/(auth)/login');
    }, [router]);

    if (status !== 'authenticated') return null;

    return (
        <Pressable
            onPress={handleSignOut}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 8,
                minHeight: 44,
                minWidth: 44,
            }}
        >
            <LogOut size={16} color={colors.text.muted} />
            <Text style={{ fontSize: 14, fontFamily: fonts.sans, color: colors.text.muted }}>Sair</Text>
        </Pressable>
    );
}
