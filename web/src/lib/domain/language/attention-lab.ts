import { isNumericAnswerCorrect } from '../deep-learning-lab.ts';
import { dot, softmax, weightedSum, type Vector } from './vector-math.ts';

export type AttentionToken = { word: string; vector: [number, number] };

/** Self-attention with given vectors: score = q·k, weights = softmax(scores), context = Σ weight × v. */
export function calculateAttention(query: Vector, keys: Vector[], values: Vector[]) {
	const scores = keys.map((key) => dot(query, key));
	const exponentials = scores.map((score) => Math.exp(score));
	const sumExp = exponentials.reduce((sum, value) => sum + value, 0);
	const weights = exponentials.map((value) => value / sumExp);
	return { scores, exponentials, sumExp, weights, context: weightedSum(weights, values) };
}

/** Each row is one query token. In causal attention a token cannot look at later tokens. */
export function attentionMatrix(vectors: Vector[], causal: boolean) {
	return vectors.map((query, row) => {
		const visible = causal ? vectors.slice(0, row + 1) : vectors;
		const weights = softmax(visible.map((key) => dot(query, key)));
		return vectors.map((_, column) => weights[column] ?? 0);
	});
}

export type Matrix2 = [[number, number], [number, number]];

/**
 * W_Q, W_K and W_V for the attention map and its walkthrough. A real model learns them during training; these were
 * chosen by hand so the story holds («banco» looks at «río» or «dinero») and attention is not symmetric.
 */
export const ATTENTION_PROJECTIONS: { query: Matrix2; key: Matrix2; value: Matrix2 } = {
	query: [[1, 0], [0.5, 1]],
	key: [[1, 0], [0, 1.5]],
	value: [[1, 0], [0, 2]]
};

/** Row vector times a 2×2 matrix: x · W. */
export function project(vector: Vector, matrix: Matrix2): [number, number] {
	return [vector[0] * matrix[0][0] + vector[1] * matrix[1][0], vector[0] * matrix[0][1] + vector[1] * matrix[1][1]];
}

/** Attention map with Q = X·W_Q and K = X·W_K. In causal attention a token cannot look at later tokens. */
export function projectedAttentionMatrix(vectors: Vector[], causal: boolean, projections = ATTENTION_PROJECTIONS) {
	const queries = vectors.map((vector) => project(vector, projections.query));
	const keys = vectors.map((vector) => project(vector, projections.key));
	return queries.map((query, row) => {
		const visible = causal ? keys.slice(0, row + 1) : keys;
		const weights = softmax(visible.map((key) => dot(query, key)));
		return keys.map((_, column) => weights[column] ?? 0);
	});
}

// Toy 2D vectors: dimension 1 ≈ "outdoors/nature", dimension 2 ≈ "money". In this exercise k = v = the token vector.
export const ATTENTION_MEANINGS = {
	seat: { label: 'asiento', vector: [2, 1] as [number, number] },
	finance: { label: 'institución financiera', vector: [1, 2] as [number, number] }
};
export const EXP_TABLE = [{ exponent: 1, value: 2.718 }, { exponent: 2, value: 7.389 }, { exponent: 3, value: 20.086 }];

function buildSentence(text: string, tokens: AttentionToken[]) {
	const query = tokens[tokens.length - 1].vector;
	const vectors = tokens.map((token) => token.vector);
	const attention = calculateAttention(query, vectors, vectors);
	const meaningScores = {
		seat: dot(attention.context, ATTENTION_MEANINGS.seat.vector),
		finance: dot(attention.context, ATTENTION_MEANINGS.finance.vector)
	};
	return { text, tokens, query, ...attention, meaningScores, meaning: (meaningScores.seat >= meaningScores.finance ? 'seat' : 'finance') as 'seat' | 'finance' };
}

export const ATTENTION_LAB = {
	river: buildSentence('Me senté junto al río en el banco', [{ word: 'senté', vector: [1, 0] }, { word: 'río', vector: [3, 0] }, { word: 'banco', vector: [1, 1] }]),
	money: buildSentence('Deposité el dinero en el banco', [{ word: 'deposité', vector: [0, 1] }, { word: 'dinero', vector: [0, 3] }, { word: 'banco', vector: [1, 1] }])
};

const filler: [number, number] = [0.3, 0.3];
/** Complete sentences for the clickable attention map; short function words get a small, neutral vector. */
export const EXPLORER_SENTENCES: { id: 'river' | 'money'; tokens: AttentionToken[] }[] = [
	{ id: 'river', tokens: [{ word: 'Me', vector: filler }, { word: 'senté', vector: [1, 0] }, { word: 'junto', vector: filler }, { word: 'al', vector: filler }, { word: 'río', vector: [3, 0] }, { word: 'en', vector: filler }, { word: 'el', vector: filler }, { word: 'banco', vector: [1, 1] }] },
	{ id: 'money', tokens: [{ word: 'Deposité', vector: [0, 1] }, { word: 'el', vector: filler }, { word: 'dinero', vector: [0, 3] }, { word: 'en', vector: filler }, { word: 'el', vector: filler }, { word: 'banco', vector: [1, 1] }] }
];

export type AttentionLabField = { key: string; stage: number; label: string; expected: number; tolerance: number; hint: string; required: boolean };
function field(key: string, stage: number, label: string, expected: number, hint: string, required: boolean, tolerance = 0.01): AttentionLabField {
	return { key: `attn1_${key}`, stage, label, expected, tolerance, hint, required };
}

const river = ATTENTION_LAB.river;
const money = ATTENTION_LAB.money;
export const ATTENTION_LAB_STAGE_COUNT = 4;

export const ATTENTION_LAB_FIELDS: AttentionLabField[] = [
	field('scoreRiver', 0, 'Puntaje de “banco” con “río” = q · k', river.scores[1], 'Multiplica componente por componente y suma: (1 × 3) + (1 × 0).', true),
	field('scoreSat', 0, 'Puntaje con “senté”', river.scores[0], '', false),
	field('scoreSelf', 0, 'Puntaje de “banco” consigo mismo', river.scores[2], '', false),
	field('scoreDeposit', 0, 'Puntaje con “deposité”', money.scores[0], '', false),
	field('scoreMoney', 0, 'Puntaje con “dinero”', money.scores[1], '', false),
	field('sumExp', 1, 'Suma de eˣ de los tres puntajes', river.sumExp, 'Busca e¹, e³ y e² en la tabla y súmalos.', true, 0.05),
	field('weightRiver', 1, 'Peso de atención de “río” = e³ ÷ suma', river.weights[1], 'Divide el valor de e³ entre la suma que acabas de calcular.', true),
	field('weightSat', 1, 'Peso de “senté”', river.weights[0], '', false),
	field('weightSelf', 1, 'Peso de “banco”', river.weights[2], '', false),
	field('weightMoney', 1, 'Peso de “dinero”', money.weights[1], '', false),
	field('contextFirst', 2, 'Primer componente del nuevo “banco”', river.context[0], 'Multiplica cada peso por el primer número de su vector v y suma los tres productos.', true, 0.02),
	field('contextSecond', 2, 'Segundo componente', river.context[1], '', false),
	field('moneyContext', 2, 'Nuevo “banco” en la frase del dinero', money.context[1], '', false),
	field('meaningSeat', 3, 'Parecido con “asiento” = contexto · [2, 1]', river.meaningScores.seat, 'Multiplica el primer componente por 2, el segundo por 1 y suma.', true, 0.03),
	field('meaningFinance', 3, 'Parecido con “institución financiera”', river.meaningScores.finance, '', false),
	field('moneyMeaning', 3, 'Parecidos en la frase del dinero', money.meaningScores.finance, '', false)
];
export const ATTENTION_LAB_REQUIRED_FIELDS = ATTENTION_LAB_FIELDS.filter((item) => item.required);

const shortKey = (key: string) => key.slice('attn1_'.length);

/** A stage is complete when its required answers are correct; then its parallel values are revealed. */
export function deriveAttentionLabProgress(answers: Record<string, string>) {
	const confirmed = Object.fromEntries(ATTENTION_LAB_FIELDS.map((item) => [shortKey(item.key), false])) as Record<string, boolean>;
	let completedStages = 0;
	for (let stage = 0; stage < ATTENTION_LAB_STAGE_COUNT; stage += 1) {
		const required = ATTENTION_LAB_REQUIRED_FIELDS.filter((item) => item.stage === stage);
		for (const item of required) confirmed[shortKey(item.key)] = isNumericAnswerCorrect(answers[item.key] ?? '', item.expected, item.tolerance);
		if (!required.every((item) => confirmed[shortKey(item.key)])) break;
		for (const item of ATTENTION_LAB_FIELDS.filter((item) => item.stage === stage)) confirmed[shortKey(item.key)] = true;
		completedStages += 1;
	}
	return { confirmed, completedStages };
}
