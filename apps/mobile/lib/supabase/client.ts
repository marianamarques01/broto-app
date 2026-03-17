import {
    createClient as createSupabaseClient,
    SupabaseClient,
} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
    if (supabaseInstance) return supabaseInstance;
    supabaseInstance = createSupabaseClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storage: AsyncStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false,
            },
        },
    );
    return supabaseInstance;
}
