import { api } from '@/lib/api-client';
import { refreshPet } from '@/hooks/use-pet';
import { refreshProgress } from '@/hooks/use-progress';

export interface SubmitAnswerPayload {
    questionId: string;
    isCorrect: boolean;
    timeSpentSec?: number;
}

export async function submitAnswer(
    payload: SubmitAnswerPayload,
): Promise<void> {
    await api.post('/api/answer/question', { ...payload });
    // Invalidate caches so pet XP and progress update across all tabs
    refreshPet();
    refreshProgress();
}
