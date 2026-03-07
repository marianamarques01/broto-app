import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export interface UserProfile {
    id: string;
    nome: string;
    email: string;
    image: string | null;
    onboardingDone: boolean;
    dataEnem: string | null;
    horasDisponiveisPorDia: number;
}

interface UseUserReturn {
    user: UserProfile | null;
    loading: boolean;
}

export function useUser(): UseUserReturn {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<UserProfile>('/api/user/me')
            .then(data => setUser(data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    return { user, loading };
}
