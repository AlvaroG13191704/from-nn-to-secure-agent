// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { dot, cosineSimilarity, addVectors, subtractVectors, weightedSum, softmax } from './vector-math.ts';

test('dot product and cosine similarity follow the linear-algebra definitions', () => {
	assert.equal(dot([3, 1], [3, 2]), 11);
	assert.equal(cosineSimilarity([1, 0], [0, 4]), 0);
	assert.ok(Math.abs(cosineSimilarity([2, 2], [1, 1]) - 1) < 1e-12);
	assert.deepEqual(addVectors(subtractVectors([3, 1], [1, 1]), [1, 3]), [3, 3]);
	assert.deepEqual(weightedSum([0.5, 0.5], [[2, 0], [0, 4]]), [1, 2]);
});

test('softmax turns scores into probabilities and temperature changes their spread', () => {
	const base = softmax([1, 3, 2]);
	assert.ok(Math.abs(base.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
	assert.ok(Math.abs(base[1] - Math.exp(3) / (Math.exp(1) + Math.exp(3) + Math.exp(2))) < 1e-12);
	const cold = softmax([1, 3, 2], 0.5);
	const hot = softmax([1, 3, 2], 2);
	assert.ok(cold[1] > base[1] && base[1] > hot[1]);
	assert.deepEqual(softmax([1, 3, 3], 0), [0, 1, 0]);
});
