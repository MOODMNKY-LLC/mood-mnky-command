/**
 * Test Flowise SDK streaming locally.
 * Usage:
 *   pnpm test:flowise-stream [chatflowId]
 *   Or set FLOWISE_CHATFLOW_ID in .env.local
 *
 * Loads env from ../../.env.local and .env.local when run via the package script.
 */
import { FlowiseClient } from 'flowise-sdk'

const baseUrl =
  process.env.FLOWISE_HOST_URL?.trim() ||
  process.env.FLOWISE_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_FLOWISE_HOST?.trim() ||
  'http://localhost:3000'
const apiKey = process.env.FLOWISE_API_KEY?.trim() || ''
const chatflowId =
  process.argv[2] || process.env.FLOWISE_CHATFLOW_ID?.trim() || '<flow-id>'

async function test_streaming() {
  const client = new FlowiseClient({
    baseUrl: baseUrl.replace(/\/$/, ''),
    ...(apiKey && { apiKey }),
  })

  console.log('Flowise URL:', baseUrl)
  console.log('Chatflow ID:', chatflowId)
  console.log('API key set:', Boolean(apiKey))
  console.log('')

  if (chatflowId === '<flow-id>') {
    console.error('Provide a chatflow ID: pnpm test:flowise-stream <your-chatflow-id>')
    console.error('Or set FLOWISE_CHATFLOW_ID in apps/flow-mnky/.env.local')
    process.exit(1)
  }

  try {
    const prediction = await client.createPrediction({
      chatflowId,
      question: 'What is the capital of France?',
      streaming: true,
    })

    const isStream = typeof (prediction as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === 'function'
    console.log('createPrediction returned a stream:', isStream)
    if (!isStream) {
      console.log('Response (non-stream):', JSON.stringify(prediction, null, 2))
      return
    }

    console.log('Streaming response:')
    for await (const chunk of prediction as AsyncGenerator<{ event?: string; data?: string }>) {
      process.stdout.write(chunk.data ?? '')
    }
    console.log('')
    console.log('Done.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

test_streaming()
