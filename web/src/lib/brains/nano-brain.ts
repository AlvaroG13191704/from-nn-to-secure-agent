import type { Brain } from '#lib/domain/agents/harness.js';

export const NANO_LANGUAGE_OPTIONS = {
	expectedInputs: [{ type: 'text' as const, languages: ['es'] }],
	expectedOutputs: [{ type: 'text' as const, languages: ['es'] }]
};

export function isPromptApiSupported() {
	return typeof LanguageModel !== 'undefined';
}

export async function nanoAvailability() {
	if (typeof LanguageModel === 'undefined') return 'unavailable';
	return LanguageModel.availability(NANO_LANGUAGE_OPTIONS);
}

/** Starts or resumes the model download. Chrome requires this to run from a click. */
export async function downloadNano(onProgress: (fraction: number) => void) {
	if (typeof LanguageModel === 'undefined') throw new Error('Prompt API no disponible.');
	const session = await LanguageModel.create({
		...NANO_LANGUAGE_OPTIONS,
		monitor(monitor) {
			monitor.addEventListener('downloadprogress', (event) => onProgress((event as ProgressEvent).loaded));
		}
	});
	session.destroy();
}

/** JSON Schema keywords that only Gemini's API understands are removed before using Nano. */
function toNanoSchema(schema: Record<string, unknown>) {
	const { propertyOrdering: _ignored, ...rest } = schema;
	return rest;
}

/**
 * Gemini Nano as the agent's brain. Each harness step builds a short-lived session from the
 * system prompt and the conversation so far, then asks for one JSON action.
 */
export function createNanoBrain(): Brain {
	return async ({ system, messages, schema }) => {
		if (typeof LanguageModel === 'undefined') throw new Error('Prompt API no disponible.');
		const history = messages.slice(0, -1).map((message) => ({ role: message.role === 'model' ? 'assistant' as const : 'user' as const, content: message.text }));
		const last = messages.at(-1)?.text ?? '';
		const session = await LanguageModel.create({ ...NANO_LANGUAGE_OPTIONS, initialPrompts: [{ role: 'system', content: system }, ...history] });
		try {
			const before = session.contextUsage ?? 0;
			const promptTokens = (await session.measureContextUsage?.(last)) ?? Math.ceil(last.length / 4);
			const text = await session.prompt(last, { responseConstraint: toNanoSchema(schema) });
			const after = session.contextUsage ?? before + promptTokens + Math.ceil(text.length / 4);
			// Nano is free; these counts let students compare the equivalent cost with Flash.
			return { text, usage: { inputTokens: before + promptTokens, outputTokens: Math.max(0, after - before - promptTokens), thinkingTokens: 0 } };
		} finally {
			session.destroy();
		}
	};
}
