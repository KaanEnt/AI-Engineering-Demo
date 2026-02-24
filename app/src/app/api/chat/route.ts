import { streamText, convertToModelMessages, type UIMessage, stepCountIs } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { tools } from '@/lib/tools';
import { getSystemPrompt } from '@/lib/prompts/system';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = await getSystemPrompt();

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const err = error as Error;
    console.error('[Chat API Error]', err.message);
    return new Response(
      JSON.stringify({ error: 'Failed to process request', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
