import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { buildSystemPrompt, mockHint } from './prompts.js'

const app = express()
const PORT = process.env.PORT || 3001
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN

app.use(cors({ origin: FRONTEND_ORIGIN || true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mockMode: !ANTHROPIC_API_KEY })
})

app.post('/api/tutor', async (req, res) => {
  const { subjectId, message, history } = req.body ?? {}

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' })
  }

  if (!ANTHROPIC_API_KEY) {
    return res.json({
      reply: mockHint(subjectId),
      mock: true,
    })
  }

  try {
    const systemPrompt = buildSystemPrompt(subjectId)
    const priorTurns = Array.isArray(history) ? history.slice(-8) : []

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: [...priorTurns, { role: 'user', content: message }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Anthropic API error:', response.status, errBody)
      return res.status(502).json({ error: 'AI 응답을 가져오지 못했어요' })
    }

    const data = await response.json()
    const reply = data.content?.[0]?.text ?? '음... 다시 한 번 물어봐 줄래요?'
    res.json({ reply, mock: false })
  } catch (err) {
    console.error('Tutor route error:', err)
    res.status(500).json({ error: 'AI 튜터 서버 오류가 발생했어요' })
  }
})

app.post('/api/checkout/create-session', async (req, res) => {
  const { itemId, itemName, priceKrw } = req.body ?? {}

  if (!itemId || !itemName || !priceKrw) {
    return res.status(400).json({ error: 'itemId, itemName, priceKrw is required' })
  }

  if (!STRIPE_SECRET_KEY) {
    // 테스트/데모 모드: 실제 결제 없이 성공 응답만 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 700))
    return res.json({ mock: true, status: 'succeeded', itemId })
  }

  // 실제 연동 시: `npm install stripe` 후 아래 구조로 Stripe 테스트 모드 체크아웃 세션 생성
  try {
    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'krw',
            product_data: { name: itemName },
            unit_amount: priceKrw, // KRW는 소수 단위가 없는 zero-decimal 통화
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin || 'http://localhost:5173'}/?checkout=success`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?checkout=canceled`,
    })
    res.json({ mock: false, url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    res.status(500).json({ error: '결제 세션 생성에 실패했어요' })
  }
})

app.listen(PORT, () => {
  console.log(`[studylog-server] listening on http://localhost:${PORT}`)
  console.log(`[studylog-server] mode: ${ANTHROPIC_API_KEY ? 'live (Claude API)' : 'mock (no ANTHROPIC_API_KEY set)'}`)
})
