import { cosineSimilarity, dot, norm, type Vector } from './vector-math.ts';

function multiplyCovariance(centered: Vector[], vector: Vector): Vector {
	// C·v = Xᵀ(X·v) / (n − 1), without building the d × d covariance matrix.
	const scores = centered.map((row) => dot(row, vector));
	const result = new Array(vector.length).fill(0);
	centered.forEach((row, index) => row.forEach((value, column) => { result[column] += value * scores[index]; }));
	return result.map((value) => value / Math.max(1, centered.length - 1));
}

function orthonormalize(vector: Vector, basis: Vector[]): Vector {
	const residual = basis.reduce((current, axis) => {
		const projection = dot(current, axis);
		return current.map((value, index) => value - projection * axis[index]);
	}, vector);
	const length = norm(residual);
	return length === 0 ? residual : residual.map((value) => value / length);
}

/** Principal component analysis with deterministic power iteration and deflation. */
export function principalComponents(rows: Vector[], count: number, iterations = 300) {
	if (rows.length < 2) throw new Error('PCA needs at least two rows.');
	const dimensions = rows[0].length;
	const mean = new Array(dimensions).fill(0).map((_, column) => rows.reduce((sum, row) => sum + row[column], 0) / rows.length);
	const centered = rows.map((row) => row.map((value, column) => value - mean[column]));
	const totalVariance = centered.reduce((sum, row) => sum + dot(row, row), 0) / (rows.length - 1);
	const components: Vector[] = [];
	const variances: number[] = [];
	for (let component = 0; component < count; component += 1) {
		let vector = orthonormalize(Array.from({ length: dimensions }, (_, index) => Math.sin(index + 1 + component * 7.3)), components);
		for (let step = 0; step < iterations; step += 1) vector = orthonormalize(multiplyCovariance(centered, vector), components);
		// Fix the sign so repeated runs draw the same picture.
		const anchor = vector.reduce((best, value) => (Math.abs(value) > Math.abs(best) ? value : best), 0);
		if (anchor < 0) vector = vector.map((value) => -value);
		components.push(vector);
		variances.push(dot(vector, multiplyCovariance(centered, vector)));
	}
	return {
		mean,
		components,
		explainedVarianceRatio: variances.map((variance) => (totalVariance === 0 ? 0 : variance / totalVariance)),
		projections: centered.map((row) => components.map((axis) => dot(row, axis)))
	};
}

/** Closest rows by cosine similarity, measured in the original high-dimensional space. */
export function nearestNeighbors(rows: Vector[], index: number, count: number) {
	return rows
		.map((row, other) => ({ index: other, similarity: cosineSimilarity(rows[index], row) }))
		.filter((item) => item.index !== index)
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, count);
}
