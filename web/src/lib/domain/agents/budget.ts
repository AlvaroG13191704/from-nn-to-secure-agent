export type Pricing = { inputPerMillion: number; outputPerMillion: number };
/** gemini-3.8-flash introductory price (USD per 1M tokens, through 2026-12-31); used to show equivalent costs in the browser. */
export const REFERENCE_PRICING: Pricing = { inputPerMillion: 0.75, outputPerMillion: 3.75 };
export type TokenUsage = { inputTokens: number; outputTokens: number; thinkingTokens: number };

/** Workshop limits agreed with the presenter: a $10 hard cap shared by about 40 students. */
export const BUDGET_LIMITS = {
	globalCapUsd: 10,
	// The server stops early so in-flight requests cannot push spending past the cap.
	globalStopUsd: 9.5,
	studentCapUsd: 0.25,
	// Gemini 3.8 Flash cannot disable thinking; thinking tokens count against this limit too.
	maxOutputTokens: 1024,
	maxSteps: 6,
	requestsPerMinute: 10
} as const;

/** Thinking tokens are billed as output, so they are added to the output side. */
export function costUsd(usage: TokenUsage, pricing: Pricing) {
	return (usage.inputTokens * pricing.inputPerMillion + (usage.outputTokens + usage.thinkingTokens) * pricing.outputPerMillion) / 1_000_000;
}

/** Upper bound used only to reserve budget: no tokenizer emits more than one token per UTF-16 unit. */
export function estimateTokens(text: string) {
	return text.length;
}

/** Worst-case cost of one model call: the estimated prompt plus the maximum allowed output. */
export function reservationUsd(promptText: string, pricing: Pricing) {
	return (estimateTokens(promptText) * pricing.inputPerMillion + BUDGET_LIMITS.maxOutputTokens * pricing.outputPerMillion) / 1_000_000;
}

export function settleUsage(ledger: { spentUsd: number; reservedUsd: number }, actualUsd: number) {
	return { spentUsd: ledger.spentUsd + actualUsd, reservedUsd: 0 };
}

export function isRateLimited(requestTimes: number[], now: number, limit: number = BUDGET_LIMITS.requestsPerMinute, windowMs = 60_000) {
	return requestTimes.filter((time) => now - time < windowMs).length >= limit;
}

export function formatUsd(value: number) {
	return `$${value >= 0.01 ? value.toFixed(2) : value.toFixed(4)}`;
}
