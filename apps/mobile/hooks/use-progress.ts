import { api } from '@/lib/api-client';
import { createCachedHook } from './create-cached-hook';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export interface TopicoStat {
    value: string;
    label: string;
    totalAnswered: number;
    totalCorrect: number;
    accuracyPct: number;
}

export interface AreaStat {
    value: string;
    label: string;
    totalAnswered: number;
    totalCorrect: number;
    accuracyPct: number;
    topicos: TopicoStat[];
}

export interface ProgressData {
    totalAnswered: number;
    totalCorrect: number;
    accuracyPct: number;
    areas: AreaStat[];
}

const { useHook, refresh, refreshIfStale } = createCachedHook<ProgressData>(
    () => api.get<ProgressData>('/api/user/progress'),
);

export const refreshProgress = refresh;

export function useProgress() {
    const { data, loading, refresh: r } = useHook();
    useFocusEffect(
        useCallback(() => {
            refreshIfStale();
        }, []),
    );
    return { progress: data, loading, refresh: r };
}
