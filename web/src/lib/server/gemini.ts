import type { BrainReply, BrainRequest } from '#lib/domain/agents/harness.js';
import { BUDGET_LIMITS } from '#lib/domain/agents/budget.js';

type GeminiPart = { text?: string; thought?: boolean };
type GeminiResponse = {
	candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
	usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
	error?: { message?: string };
};

/** Gemini's response schema uses OpenAPI-style upper-case type names. */
function toGeminiSchema(schema: unknown): unknown {
	if (Array.isArray(schema)) return schema.map(toGeminiSchema);
	if (typeof schema !== 'object' || schema === null) return schema;
	return Object.fromEntries(Object.entries(schema).map(([key, value]) => [key, key === 'type' && typeof value === 'string' ? value.toUpperCase() : toGeminiSchema(value)]));
}

export async function callGemini(options: { apiKey: string; model: string; request: BrainRequest; signal?: AbortSignal }): Promise<BrainReply> {
	const { apiKey, model, request, signal } = options;
	const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
		signal,
		body: JSON.stringify({
			systemInstruction: { parts: [{ text: request.system }] },
			contents: request.messages.map((message) => ({ role: message.role, parts: [{ text: message.text }] })),
			generationConfig: {
				// Thinking cannot be disabled on Gemini 3.8 Flash; "low" keeps it cheap. It counts against maxOutputTokens.
				thinkingConfig: { thinkingLevel: 'low' },
				maxOutputTokens: BUDGET_LIMITS.maxOutputTokens,
				responseMimeType: 'application/json',
				responseSchema: toGeminiSchema(request.schema)
			}
		})
	});
	const data = (await response.json().catch(() => ({}))) as GeminiResponse;
	if (!response.ok) throw new Error(data.error?.message ?? `Gemini respondió ${response.status}`);
	const text = (data.candidates?.[0]?.content?.parts ?? []).filter((part) => !part.thought).map((part) => part.text ?? '').join('');
	return {
		text,
		usage: {
			inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
			outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
			thinkingTokens: data.usageMetadata?.thoughtsTokenCount ?? 0
		}
	};
}
