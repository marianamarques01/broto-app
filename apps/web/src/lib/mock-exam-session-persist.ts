export const MOCK_EXAM_SAVE_ERROR_MESSAGE = 'Não foi possível salvar o resultado. Tente novamente.'

export const MOCK_EXAM_PROGRESS_SAVE_ERROR_MESSAGE =
  'Não foi possível salvar o progresso. Tente novamente.'

/** Tenta uma vez; em falha, repete uma vez antes de propagar o erro. */
export async function patchWithOneRetry<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request()
  } catch (firstErr) {
    try {
      return await request()
    } catch {
      throw firstErr
    }
  }
}
