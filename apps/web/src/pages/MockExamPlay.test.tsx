import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Question } from '@broto/shared'
import { MOCK_EXAM_SAVE_ERROR_MESSAGE } from '@/lib/mock-exam-session-persist'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const patchMock = vi.fn()
const postMock = vi.fn()

vi.mock('@/lib/api-client', () => ({
  api: {
    patch: (...args: unknown[]) => patchMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
}))

vi.mock('@/hooks/useClass', () => ({
  useClass: () => ({ organization: { slug: 'test-org' } }),
}))

vi.mock('@/components/layout/TopBar', () => ({
  TopBar: () => <div data-testid="top-bar" />,
}))

vi.mock('@/components/questions/QuestionPlayer', () => ({
  QuestionPlayer: () => <div data-testid="question-player" />,
}))

vi.mock('@/components/mock-exam/MockExamSessionProgressPanel', () => ({
  MockExamSessionProgressPanel: ({
    onFinalize,
    allAnswered,
    finalizing,
  }: {
    onFinalize: () => void
    allAnswered: boolean
    finalizing?: boolean
  }) => (
    <button type="button" onClick={onFinalize} disabled={!allAnswered || finalizing}>
      Finalizar
    </button>
  ),
}))

vi.mock('@/components/mock-exam/MockExamSessionExitModal', () => ({
  MockExamSessionExitModal: () => null,
}))

vi.mock('@/lib/mvp-funnel', () => ({
  trackMvpFunnelStep: vi.fn(),
}))

import { MockExamPlay } from './MockExamPlay'

const mockQuestion: Question = {
  title: 'Q1',
  statement: 'Enunciado',
  index: 1,
  year: 2023,
  discipline: 'matematica',
  context: null,
  alternatives: [
    { letter: 'A', text: 'Alt A', isCorrect: true },
    { letter: 'B', text: 'Alt B', isCorrect: false },
  ],
}

function renderPlay() {
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/study/mock-exam/play/sess-1',
          state: {
            questions: [mockQuestion],
            sessionId: 'sess-1',
            questionIds: ['2023-1'],
            config: {},
          },
        },
      ]}
    >
      <Routes>
        <Route path="/study/mock-exam/play/:sessionId" element={<MockExamPlay />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MockExamPlay finalize save errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigateMock.mockReset()
    patchMock.mockReset()
    postMock.mockReset()

    postMock.mockImplementation(async (path: string) => {
      if (path === '/api/practice-session/get') {
        return {
          sessionId: 'sess-1',
          questionIds: ['2023-1'],
          config: {},
          sessionAnswers: [{ questionId: '2023-1', isCorrect: true }],
        }
      }
      return {}
    })

    patchMock.mockRejectedValue(new Error('save failed'))

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({ mapping: {} }),
      }),
    )
  })

  it('mostra toast e não navega quando o save final falha', async () => {
    const user = userEvent.setup()
    renderPlay()

    const finalizeButton = await screen.findByRole('button', { name: 'Finalizar' })
    await waitFor(() => expect(finalizeButton).toBeEnabled())
    await user.click(finalizeButton)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(MOCK_EXAM_SAVE_ERROR_MESSAGE)
    })

    expect(patchMock).toHaveBeenCalledWith('/api/practice-session/complete', expect.any(Object))
    expect(patchMock).toHaveBeenCalledTimes(2)
    expect(navigateMock).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Salvar de novo' })).toBeInTheDocument()
  })
})
