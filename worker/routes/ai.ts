import { Hono } from 'hono'
import type { Bindings } from '../index'
import { requireAuth } from '../middleware'

// DeepSeek AI Coach — proxies user questions to the DeepSeek chat API.
// The API key is injected via the `DEEPSEEK_API_KEY` Cloudflare secret.
export const aiRoutes = new Hono<{
  Bindings: Bindings
  Variables: { account: { id: string; email: string; displayName: string } }
}>()

aiRoutes.use('/*', requireAuth)

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[]
}

// POST /api/ai/ask — ask the AI running coach a question
aiRoutes.post('/ask', async (c) => {
  const account = c.get('account')
  const key = c.env.DEEPSEEK_API_KEY

  if (!key) {
    return c.json({ ok: false, error: 'ai_not_configured' }, 503)
  }

  const body = await c.req.json<{ question?: unknown; history?: unknown }>().catch((): { question?: unknown; history?: unknown } => ({}))
  const question = typeof body.question === 'string' ? body.question.trim() : ''
  if (!question) {
    return c.json({ ok: false, error: 'missing_question' }, 400)
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        '你是一名专业的跑步教练，用简洁、实用的中文回答跑者的训练问题。回答要具体可执行，' +
        '包括训练建议、配速/心率区间、恢复方法等。控制在200字以内。',
    },
    { role: 'user', content: question },
  ]

  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: 400, temperature: 0.7 }),
    })

    if (!res.ok) {
      console.error('DeepSeek API error', res.status, await res.text())
      return c.json({ ok: false, error: 'ai_upstream_error' }, 502)
    }

    const data = (await res.json()) as DeepSeekResponse
    const answer = data.choices?.[0]?.message?.content?.trim()
    if (!answer) {
      return c.json({ ok: false, error: 'ai_empty_response' }, 502)
    }

    return c.json({ ok: true, answer, accountId: account.id })
  } catch (e) {
    console.error('DeepSeek fetch failed', e)
    return c.json({ ok: false, error: 'ai_network_error' }, 502)
  }
})
