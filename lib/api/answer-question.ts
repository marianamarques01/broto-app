import { api } from '@/lib/api-client';

export interface SubmitAnswerPayload {
    questionId: string;
    isCorrect: boolean;
    timeSpentSec?: number;
}

export async function submitAnswer(
    payload: SubmitAnswerPayload,
): Promise<void> {
    await api.post('/api/answer/question', { ...payload });
}
