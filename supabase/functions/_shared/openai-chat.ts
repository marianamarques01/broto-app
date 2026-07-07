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

export type ChatCompletionOptions = {
  model?: string
  maxTokens?: number
  /** Padrão 0.3 — motor de redação usa 0.1. */
  temperature?: number
  /** `json_object` força saída JSON válida (OpenAI). */
  responseFormat?: 'json_object' | 'text'
}

export async function createChatCompletion(
  messages: ChatCompletionMessage[],
  apiKey: string,
  options?: ChatCompletionOptions,
): Promise<{ content: string; model: string }> {
  const model = options?.model ?? resolveChatModel()
  const maxTokens = options?.maxTokens ?? 800
  const temperature = options?.temperature ?? 0.3

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
  }

  if (options?.responseFormat === 'json_object') {
    requestBody.response_format = { type: 'json_object' }
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  const responseBody = (await res.json()) as OpenAiChatResponse
  if (!res.ok) {
    const msg = responseBody.error?.message ?? `OpenAI chat HTTP ${res.status}`
    throw new Error(msg)
  }

  const content = responseBody.choices?.[0]?.message?.content?.trim() ?? ''
  if (!content) {
    throw new Error('Resposta vazia do modelo')
  }

  return { content, model: responseBody.model ?? model }
}
