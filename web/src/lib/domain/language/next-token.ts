import { softmax } from './vector-math.ts';

export type TokenCandidate = { token: string; logit: number };

export const HOOK_EXAMPLE = {
	prompt: 'Hoy en Chiquimula voy a',
	candidates: [
		{ token: 'estudiar', logit: 2.6 },
		{ token: 'comer', logit: 2.2 },
		{ token: 'trabajar', logit: 1.9 },
		{ token: 'la', logit: 1.4 },
		{ token: 'dormir', logit: 0.6 }
	] satisfies TokenCandidate[]
};

export const NEXT_TOKEN_EXAMPLE = {
	prompt: 'La capital de Guatemala es',
	candidates: [
		{ token: 'Ciudad', logit: 4 },
		{ token: 'una', logit: 2.5 },
		{ token: 'muy', logit: 2 },
		{ token: 'Antigua', logit: 1.2 },
		{ token: 'Xela', logit: 0.4 }
	] satisfies TokenCandidate[]
};

/** One autoregressive run: each chosen token is appended and becomes part of the next input. */
export const GENERATION_STEPS = [
	{ chosen: 'Ciudad', alternatives: ['una', 'muy'] },
	{ chosen: 'de', alternatives: [',', 'capital'] },
	{ chosen: 'Guatemala', alternatives: ['México', 'la'] },
	{ chosen: '.', alternatives: [',', 'y'] }
];

export function nextTokenDistribution(candidates: TokenCandidate[], temperature: number) {
	return softmax(candidates.map((candidate) => candidate.logit), temperature);
}

/** Picks an index by walking the cumulative probabilities; `random` must be in [0, 1). */
export function sampleTokenIndex(probabilities: number[], random: number) {
	let cumulative = 0;
	for (const [index, probability] of probabilities.entries()) {
		cumulative += probability;
		if (random < cumulative) return index;
	}
	return probabilities.length - 1;
}
