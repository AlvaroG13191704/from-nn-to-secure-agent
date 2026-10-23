import { ATTENTION_PROJECTIONS, project } from './attention-lab.ts';
import { dot, type Vector } from './vector-math.ts';

/**
 * Every intermediate value of Atención(Q, K, V) = softmax(Q·Kᵀ)·V for one query row, so a walkthrough can show
 * where each percentage comes from: Q = X·W_Q, K = X·W_K, V = X·W_V. Like the attention map, this small example
 * skips the √dₖ scaling.
 */
export function attentionWalkthrough(vectors: Vector[], queryIndex: number, projections = ATTENTION_PROJECTIONS) {
	const queries = vectors.map((vector) => project(vector, projections.query));
	const keys = vectors.map((vector) => project(vector, projections.key));
	const values = vectors.map((vector) => project(vector, projections.value));
	const keysTransposed = [0, 1].map((row) => keys.map((key) => key[row]));
	const scores = queries.map((query) => keys.map((key) => dot(query, key)));
	const query = queries[queryIndex];
	// Pairs [q_d, k_d] whose products add up to each score of the query row.
	const queryTerms = keys.map((key) => query.map((value, dimension) => [value, key[dimension]]));
	const exponentials = scores[queryIndex].map((score) => Math.exp(score));
	const sumExp = exponentials.reduce((sum, value) => sum + value, 0);
	const weights = exponentials.map((value) => value / sumExp);
	const contributions = values.map((value, index) => value.map((component) => weights[index] * component));
	const context = [0, 1].map((dimension) => contributions.reduce((sum, term) => sum + term[dimension], 0));
	return { queries, keys, values, keysTransposed, scores, queryTerms, exponentials, sumExp, weights, contributions, context };
}
