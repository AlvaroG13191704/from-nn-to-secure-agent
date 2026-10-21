import { dot, type Vector } from './vector-math.ts';

/**
 * Every intermediate value of Atención(Q, K, V) = softmax(Q·Kᵀ)·V for one query row, so a walkthrough can show
 * where each percentage comes from. Like the attention map, this toy example uses Q = K = V = the token vectors
 * and skips the √dₖ scaling.
 */
export function attentionWalkthrough(vectors: Vector[], queryIndex: number) {
	const dimensions = vectors[0].length;
	const keysTransposed = Array.from({ length: dimensions }, (_, row) => vectors.map((vector) => vector[row]));
	const scores = vectors.map((query) => vectors.map((key) => dot(query, key)));
	const query = vectors[queryIndex];
	// Pairs [q_d, k_d] whose products add up to each score of the query row.
	const queryTerms = vectors.map((key) => query.map((value, dimension) => [value, key[dimension]]));
	const exponentials = scores[queryIndex].map((score) => Math.exp(score));
	const sumExp = exponentials.reduce((sum, value) => sum + value, 0);
	const weights = exponentials.map((value) => value / sumExp);
	const contributions = vectors.map((value, index) => value.map((component) => weights[index] * component));
	const context = Array.from({ length: dimensions }, (_, dimension) => contributions.reduce((sum, term) => sum + term[dimension], 0));
	return { keysTransposed, scores, queryTerms, exponentials, sumExp, weights, contributions, context };
}
