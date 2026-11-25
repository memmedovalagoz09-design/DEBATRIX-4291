import { createGateway, generateText } from "ai";

const gateway = createGateway({
  baseURL: process.env.AI_GATEWAY_BASE_URL,
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export const MODEL = "anthropic/claude-haiku-4.5";

/** One text completion. Throws on failure or timeout. */
export async function ask(system: string, prompt: string, timeoutMs = 45_000): Promise<string> {
  const { text } = await generateText({
    model: gateway(MODEL),
    system,
    prompt,
    abortSignal: AbortSignal.timeout(timeoutMs),
  });
  return text.trim();
}

/** Parses the first JSON object in a model reply. */
export function parseJson<T>(raw: string): T {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("No JSON in reply");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}
