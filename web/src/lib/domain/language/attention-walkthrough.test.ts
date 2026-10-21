// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionWalkthrough } from './attention-walkthrough.ts';
import { attentionMatrix, calculateAttention, EXPLORER_SENTENCES } from './attention-lab.ts';

const river = EXPLORER_SENTENCES.find((sentence) => sentence.id === 'river').tokens.map((token) => token.vector);
const banco = river.length - 1;
const rio = 4;

test('Kᵀ turns every key row into a column', () => {
	const walk = attentionWalkthrough(river, banco);
	assert.equal(walk.keysTransposed.length, 2);
	assert.equal(walk.keysTransposed[0].length, river.length);
	river.forEach((vector, column) => assert.deepEqual([walk.keysTransposed[0][column], walk.keysTransposed[1][column]], vector));
});

test('one score is the query row times one column of Kᵀ', () => {
	const walk = attentionWalkthrough(river, banco);
	// banco = (1, 1), río = (3, 0): 1×3 + 1×0 = 3
	assert.equal(walk.scores[banco][rio], 3);
	assert.deepEqual(walk.queryTerms[rio], [[1, 3], [1, 0]]);
	assert.equal(walk.scores.length, river.length);
	assert.equal(walk.scores[0].length, river.length);
});

test('softmax of the query row reproduces the percentages of the attention map', () => {
	const walk = attentionWalkthrough(river, banco);
	const expected = attentionMatrix(river, false)[banco];
	walk.weights.forEach((weight, index) => assert.ok(Math.abs(weight - expected[index]) < 1e-12));
	assert.ok(Math.abs(walk.exponentials.reduce((sum, value) => sum + value, 0) - walk.sumExp) < 1e-9);
	assert.ok(Math.abs(walk.weights.reduce((sum, value) => sum + value, 0) - 1) < 1e-12);
	// río gets the most attention from banco in the river sentence.
	assert.equal(walk.weights.indexOf(Math.max(...walk.weights)), rio);
});

test('multiplying the weights by V gives the context vector, term by term', () => {
	const walk = attentionWalkthrough(river, banco);
	const reference = calculateAttention(river[banco], river, river).context;
	walk.context.forEach((value, index) => assert.ok(Math.abs(value - reference[index]) < 1e-12));
	const summed = walk.contributions.reduce((sum, term) => [sum[0] + term[0], sum[1] + term[1]], [0, 0]);
	summed.forEach((value, index) => assert.ok(Math.abs(value - walk.context[index]) < 1e-12));
});
