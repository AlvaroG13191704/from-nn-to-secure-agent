import { json } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import type { RequestHandler } from './$types';
import { costUsd, reservationUsd, type Pricing } from '#lib/domain/agents/budget.js';
import { codesMatch, validateAgentRequest } from '#lib/domain/agents/request-validation.js';
import { isOverRateLimit, readBalance, reserveBudget, settleBudget } from '#lib/server/budget-ledger.js';
import { callGemini } from '#lib/server/gemini.js';

function pricing(): Pricing | null {
	const prices = { inputPerMillion: Number(env.PRICE_INPUT_PER_MILLION), outputPerMillion: Number(env.PRICE_OUTPUT_PER_MILLION) };
	return Number.isFinite(prices.inputPerMillion) && Number.isFinite(prices.outputPerMillion) && prices.inputPerMillion > 0 && prices.outputPerMillion > 0 ? prices : null;
}

/** One brain step for the agents lab: validates, rate-limits, reserves budget, calls Gemini and settles the real cost. */
export const POST: RequestHandler = async ({ request }) => {
	const parsed = validateAgentRequest(await request.json().catch(() => null));
	if (!parsed.ok) return json({ error: 'invalid-request', reason: parsed.reason }, { status: 400 });
	const { code, studentId, request: brainRequest } = parsed.value;
	if (!codesMatch(code, env.WORKSHOP_CODE)) return json({ error: 'lab-closed' }, { status: 403 });
	const prices = pricing();
	if (!env.GEMINI_API_KEY || !prices) return json({ error: 'not-configured' }, { status: 503 });
	if (await isOverRateLimit(env.DB, studentId)) return json({ error: 'rate-limited' }, { status: 429 });

	const reserved = reservationUsd(brainRequest.system + JSON.stringify(brainRequest.schema) + brainRequest.messages.map((message) => message.text).join('\n'), prices);
	const reservation = await reserveBudget(env.DB, studentId, reserved);
	if (reservation !== 'ok') return json({ error: 'budget-exhausted', scope: reservation, balance: await readBalance(env.DB, studentId) }, { status: 402 });

	let reply;
	try {
		reply = await callGemini({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, request: brainRequest, signal: AbortSignal.timeout(30_000) });
	} catch (error) {
		// Settle exactly once: a failed call releases its reservation and costs nothing.
		await settleBudget(env.DB, studentId, reserved, 0);
		return json({ error: 'model-error', message: (error as Error).message }, { status: 502 });
	}
	const cost = costUsd(reply.usage, prices);
	await settleBudget(env.DB, studentId, reserved, cost);
	return json({ ...reply, costUsd: cost, balance: await readBalance(env.DB, studentId) });
};
