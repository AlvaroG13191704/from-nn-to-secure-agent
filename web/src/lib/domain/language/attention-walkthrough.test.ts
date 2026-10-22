// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { attentionWalkthrough } from './attention-walkthrough.ts';
import { ATTENTION_PROJECTIONS, EXPLORER_SENTENCES, calculateAttention, project, projectedAttentionMatrix } from './attention-lab.ts';

const vectorsOf = (id) => EXPLORER_SENTENCES.find((sentence) => sentence.id === id).tokens.map((token) => token.vector);
const river = vectorsOf('river');
const money = vectorsOf('money');
const banco = river.length - 1;
const rio = 4;
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} !== ${expected}`);

test('the three projection matrices are different and none is the identity', () => {
	const { query, key, value } = ATTENTION_PROJECTIONS;
	const identity = JSON.stringify([[1, 0], [0, 1]]);
	assert.notDeepEqual(query, key);
	assert.notDeepEqual(key, value);
	assert.notDeepEqual(query, value);
	for (const matrix of [query, key, value]) assert.notEqual(JSON.stringify(matrix), identity);
});

test('q, k and v of a word come from multiplying its row by W_Q, W_K and W_V', () => {
	// banco = (1, 1)
	assert.deepEqual(project([1, 1], ATTENTION_PROJECTIONS.query), [1.5, 1]);
	assert.deepEqual(project([1, 1], ATTENTION_PROJECTIONS.key), [1, 1.5]);
	assert.deepEqual(project([1, 1], ATTENTION_PROJECTIONS.value), [1, 2]);
	const walk = attentionWalkthrough(river, banco);
	assert.deepEqual(walk.queries[banco], [1.5, 1]);
	assert.deepEqual(walk.keys[rio], [3, 0]);
	assert.deepEqual(walk.values[rio], [3, 0]);
});

test('Kᵀ turns every key row into a column', () => {
	const walk = attentionWalkthrough(river, banco);
	assert.equal(walk.keysTransposed.length, 2);
	walk.keys.forEach((key, column) => assert.deepEqual([walk.keysTransposed[0][column], walk.keysTransposed[1][column]], key));
});

test('one score is q of the query times k of the other word', () => {
	const walk = attentionWalkthrough(river, banco);
	// q_banco = (1.5, 1), k_río = (3, 0): 1.5×3 + 1×0 = 4.5
	assert.equal(walk.scores[banco][rio], 4.5);
	assert.deepEqual(walk.queryTerms[rio], [[1.5, 3], [1, 0]]);
});

test('attention is not symmetric: what banco looks for differs from what río looks for', () => {
	const walk = attentionWalkthrough(river, banco);
	assert.equal(walk.scores[banco][rio], 4.5);
	assert.equal(walk.scores[rio][banco], 3);
});

test('softmax of the query row reproduces the attention map percentages', () => {
	const walk = attentionWalkthrough(river, banco);
	const expected = projectedAttentionMatrix(river, false)[banco];
	walk.weights.forEach((weight, index) => close(weight, expected[index]));
	close(walk.weights.reduce((sum, value) => sum + value, 0), 1);
	assert.equal(walk.weights.indexOf(Math.max(...walk.weights)), rio);
	const moneyWalk = attentionWalkthrough(money, money.length - 1);
	assert.equal(moneyWalk.weights.indexOf(Math.max(...moneyWalk.weights)), 2);
});

test('multiplying the weights by V gives the context vector, term by term', () => {
	const walk = attentionWalkthrough(river, banco);
	const reference = calculateAttention(walk.queries[banco], walk.keys, walk.values).context;
	walk.context.forEach((value, index) => close(value, reference[index]));
	const summed = walk.contributions.reduce((sum, term) => [sum[0] + term[0], sum[1] + term[1]], [0, 0]);
	summed.forEach((value, index) => close(value, walk.context[index]));
});

test('causal projected attention ignores later words', () => {
	const matrix = projectedAttentionMatrix(river, true);
	assert.equal(matrix[1][4], 0);
	matrix.forEach((row) => close(row.reduce((sum, value) => sum + value, 0), 1));
});
