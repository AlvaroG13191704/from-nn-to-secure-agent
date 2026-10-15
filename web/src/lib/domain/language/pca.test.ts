// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { principalComponents, nearestNeighbors } from './pca.ts';

const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

test('the first component follows the direction with the most variation', () => {
	const rows = [-3, -2, -1, 0, 1, 2, 3].map((t, index) => [t, t, index % 2 === 0 ? 0.1 : -0.1]);
	const result = principalComponents(rows, 2);
	close(Math.abs(result.components[0][0]), Math.SQRT1_2, 1e-4);
	close(Math.abs(result.components[0][1]), Math.SQRT1_2, 1e-4);
	close(result.components[0][2], 0, 1e-4);
	assert.ok(result.explainedVarianceRatio[0] > 0.99);
	assert.ok(result.explainedVarianceRatio[0] >= result.explainedVarianceRatio[1]);
	for (let axis = 0; axis < 2; axis += 1) close(result.projections.reduce((sum, point) => sum + point[axis], 0), 0, 1e-9);
});

test('real 384-dimensional embeddings reduce to orthogonal components and keep neighbors in full space', () => {
	const data = JSON.parse(readFileSync(new URL('./data/minilm-word-embeddings.json', import.meta.url), 'utf8'));
	assert.equal(data.dimensions, 384);
	const vectors = data.words.map((item) => item.vector);
	const result = principalComponents(vectors, 3);
	assert.equal(result.projections.length, data.words.length);
	assert.equal(result.projections[0].length, 3);
	const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
	close(dot(result.components[0], result.components[1]), 0, 1e-6);
	close(dot(result.components[1], result.components[2]), 0, 1e-6);
	const total = result.explainedVarianceRatio.reduce((sum, value) => sum + value, 0);
	assert.ok(total > 0 && total < 1);
	const mangoIndex = data.words.findIndex((item) => item.word === 'mango');
	assert.equal(data.words[nearestNeighbors(vectors, mangoIndex, 1)[0].index].word, 'manzana');
	assert.deepEqual(principalComponents(vectors, 3).projections, result.projections);
});
