import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

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

interface UseProgressReturn {
    progress: ProgressData | null;
    loading: boolean;
}

export function useProgress(): UseProgressReturn {
    const [progress, setProgress] = useState<ProgressData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<ProgressData>('/api/user/progress')
            .then(data => setProgress(data))
            .catch(() => setProgress(null))
            .finally(() => setLoading(false));
    }, []);

    return { progress, loading };
}
