/** OpenAI Chat Completions — usado por broto-chat (RAG). */

export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini'

export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type OpenAiChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>
  model?: string
  error?: { message?: string }
}

export function resolveChatModel(): string {
  return Deno.env.get('OPENAI_CHAT_MODEL')?.trim() || DEFAULT_CHAT_MODEL
}

export async function createChatCompletion(
  messages: ChatCompletionMessage[],
  apiKey: string,
  options?: { model?: string; maxTokens?: number },
): Promise<{ content: string; model: string }> {
  const model = options?.model ?? resolveChatModel()
  const maxTokens = options?.maxTokens ?? 800

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  })

  const body = (await res.json()) as OpenAiChatResponse
  if (!res.ok) {
    const msg = body.error?.message ?? `OpenAI chat HTTP ${res.status}`
    throw new Error(msg)
  }

  const content = body.choices?.[0]?.message?.content?.trim() ?? ''
  if (!content) {
    throw new Error('Resposta vazia do modelo')
  }

  return { content, model: body.model ?? model }
}
