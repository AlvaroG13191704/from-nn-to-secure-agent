export type Vector = number[];

export function dot(a: Vector, b: Vector) {
	if (a.length !== b.length) throw new Error('Vectors must have the same length.');
	return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

export function norm(a: Vector) {
	return Math.sqrt(dot(a, a));
}

export function cosineSimilarity(a: Vector, b: Vector) {
	const denominator = norm(a) * norm(b);
	return denominator === 0 ? 0 : dot(a, b) / denominator;
}

export function addVectors(a: Vector, b: Vector): Vector {
	return a.map((value, index) => value + b[index]);
}

export function subtractVectors(a: Vector, b: Vector): Vector {
	return a.map((value, index) => value - b[index]);
}

export function scaleVector(a: Vector, factor: number): Vector {
	return a.map((value) => value * factor);
}

export function distance(a: Vector, b: Vector) {
	return norm(subtractVectors(a, b));
}

export function weightedSum(weights: number[], vectors: Vector[]): Vector {
	if (weights.length !== vectors.length || vectors.length === 0) throw new Error('Each vector needs one weight.');
	return vectors.reduce((total, vector, index) => addVectors(total, scaleVector(vector, weights[index])), vectors[0].map(() => 0));
}

/** Converts scores into probabilities. Temperature 0 means greedy: the first highest score gets everything. */
export function softmax(scores: number[], temperature = 1): number[] {
	if (scores.length === 0) return [];
	const highest = Math.max(...scores);
	if (temperature <= 0) {
		const winner = scores.indexOf(highest);
		return scores.map((_, index) => (index === winner ? 1 : 0));
	}
	// Subtracting the highest score keeps exp() stable without changing the result.
	const exponentials = scores.map((score) => Math.exp((score - highest) / temperature));
	const total = exponentials.reduce((sum, value) => sum + value, 0);
	return exponentials.map((value) => value / total);
}
