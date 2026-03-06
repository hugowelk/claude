import Anthropic from '@anthropic-ai/sdk'

export async function analyzeMeal(description, apiKey) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const msg = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 128,
    messages: [{
      role: 'user',
      content: `Estimate the total calories and protein (in grams) for this meal: "${description}". Reply with ONLY a JSON object like {"calories": 450, "protein": 32}. No explanation.`
    }]
  })
  const text = msg.content[0].text
  console.log('AI raw response:', JSON.stringify(text))
  const match = text.match(/\{[^}]+\}/)
  console.log('AI match:', match)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}
