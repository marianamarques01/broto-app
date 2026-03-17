import { api } from '@/lib/api-client';
import { createCachedHook } from './create-cached-hook';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export interface UserProfile {
    id: string;
    nome: string;
    email: string;
    image: string | null;
    onboardingDone: boolean;
    dataEnem: string | null;
    horasDisponiveisPorDia: number;
}

const { useHook, refresh } = createCachedHook<UserProfile>(
    () => api.get<UserProfile>('/api/user/me'),
);

export const refreshUser = refresh;

export function useUser() {
    const { data, loading, refresh: r } = useHook();
    useFocusEffect(
        useCallback(() => {
            if (data !== null) r();
        }, [data, r]),
    );
    return { user: data, loading, refresh: r };
}
