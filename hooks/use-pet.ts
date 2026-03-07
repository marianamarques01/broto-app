import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

export interface PetData {
    nivel: number;
    xp: number;
    xpNextLevel: number;
    fase: 'semente' | 'muda' | 'planta' | 'flor' | 'especial';
    humor: number;
    streak: number;
    questoesHoje: number;
    acertosHoje: number;
}

interface UsePetReturn {
    pet: PetData | null;
    loading: boolean;
}

const FASE_EMOJI: Record<PetData['fase'], string> = {
    semente: '🌱',
    muda: '🌿',
    planta: '🪴',
    flor: '🌸',
    especial: '🌳',
};

const FASE_LABEL: Record<PetData['fase'], string> = {
    semente: 'Semente',
    muda: 'Muda',
    planta: 'Planta',
    flor: 'Florindo',
    especial: 'Especial',
};

export { FASE_EMOJI, FASE_LABEL };

export function usePet(): UsePetReturn {
    const [pet, setPet] = useState<PetData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<PetData>('/api/pet/me')
            .then(data => setPet(data))
            .catch(() => setPet(null))
            .finally(() => setLoading(false));
    }, []);

    return { pet, loading };
}
