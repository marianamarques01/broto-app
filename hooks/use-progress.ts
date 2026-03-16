import { api } from '@/lib/api-client';
import { createCachedHook } from './create-cached-hook';

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

const { useHook, refresh } = createCachedHook<ProgressData>(
    () => api.get<ProgressData>('/api/user/progress'),
);

export const refreshProgress = refresh;

export function useProgress() {
    const { data, loading, refresh: r } = useHook();
    return { progress: data, loading, refresh: r };
}
