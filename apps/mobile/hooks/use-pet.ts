import { api } from '@/lib/api-client';
import { createCachedHook } from './create-cached-hook';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

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

export const FASE_EMOJI: Record<PetData['fase'], string> = {
    semente: '\u{1F331}',
    muda: '\u{1F33F}',
    planta: '\u{1FAB4}',
    flor: '\u{1F338}',
    especial: '\u{1F333}',
};

export const FASE_LABEL: Record<PetData['fase'], string> = {
    semente: 'Semente',
    muda: 'Muda',
    planta: 'Planta',
    flor: 'Florindo',
    especial: 'Especial',
};

const { useHook, refresh, refreshIfStale } = createCachedHook<PetData>(
    () => api.get<PetData>('/api/pet/me'),
);

export const refreshPet = refresh;

export function usePet() {
    const { data, loading, refresh: r } = useHook();
    useFocusEffect(
        useCallback(() => {
            refreshIfStale();
        }, []),
    );
    return { pet: data, loading, refresh: r };
}
