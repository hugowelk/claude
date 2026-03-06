import Anthropic from '@anthropic-ai/sdk'

export async function analyzeMeal(description, apiKey) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const msg = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 256,
    tools: [{
      name: 'log_nutrition',
      description: 'Log the estimated nutrition for a meal',
      input_schema: {
        type: 'object',
        properties: {
          calories: { type: 'number', description: 'Total calories' },
          protein:  { type: 'number', description: 'Total protein in grams' },
        },
        required: ['calories', 'protein'],
      },
    }],
    tool_choice: { type: 'tool', name: 'log_nutrition' },
    messages: [{
      role: 'user',
      content: `Estimate the total calories and protein for this meal: "${description}"`,
    }],
  })
  const toolUse = msg.content.find(b => b.type === 'tool_use')
  if (!toolUse) throw new Error('No nutrition data returned')
  return toolUse.input
}
