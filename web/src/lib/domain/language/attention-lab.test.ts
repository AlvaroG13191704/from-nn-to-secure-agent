// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	ATTENTION_LAB,
	ATTENTION_LAB_FIELDS,
	ATTENTION_LAB_REQUIRED_FIELDS,
	calculateAttention,
	attentionMatrix,
	deriveAttentionLabProgress
} from './attention-lab.ts';

const close = (actual, expected, tolerance = 1e-3) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

test('the river sentence gives hand-calculable scores, weights, context and meaning', () => {
	const river = ATTENTION_LAB.river;
	assert.deepEqual(river.scores, [1, 3, 2]);
	close(river.sumExp, Math.exp(1) + Math.exp(3) + Math.exp(2));
	close(river.weights[1], 0.6652);
	close(river.context[0], 2.3304);
	close(river.context[1], 0.2447);
	assert.equal(river.meaning, 'seat');
	assert.equal(ATTENTION_LAB.money.meaning, 'finance');
	close(ATTENTION_LAB.money.context[0], river.context[1]);
	close(ATTENTION_LAB.money.context[1], river.context[0]);
});

test('causal attention ignores future tokens and every row sums to one', () => {
	const matrix = attentionMatrix([[1, 0], [3, 0], [1, 1]], true);
	assert.deepEqual(matrix[0], [1, 0, 0]);
	assert.equal(matrix[1][2], 0);
	for (const row of matrix) close(row.reduce((sum, value) => sum + value, 0), 1, 1e-12);
	const direct = calculateAttention([1, 1], [[1, 0], [3, 0], [1, 1]], [[1, 0], [3, 0], [1, 1]]);
	for (const [index, value] of attentionMatrix([[1, 0], [3, 0], [1, 1]], false)[2].entries()) close(value, direct.weights[index], 1e-12);
});

test('students answer one representative value per stage and later stages stay locked', () => {
	assert.deepEqual(ATTENTION_LAB_REQUIRED_FIELDS.map((field) => field.stage), [0, 1, 1, 2, 3]);
	assert.ok(ATTENTION_LAB_FIELDS.length > ATTENTION_LAB_REQUIRED_FIELDS.length);
	const answers = Object.fromEntries(ATTENTION_LAB_REQUIRED_FIELDS.map((field) => [field.key, String(field.expected)]));
	assert.equal(deriveAttentionLabProgress(answers).completedStages, 4);
	assert.equal(deriveAttentionLabProgress({ ...answers, attn1_scoreRiver: '4' }).completedStages, 0);
	const rounded = { ...answers, attn1_weightRiver: '0.67', attn1_contextFirst: '2.34', attn1_meaningSeat: '4.92' };
	assert.equal(deriveAttentionLabProgress(rounded).completedStages, 4);
	assert.equal(deriveAttentionLabProgress({ attn1_scoreRiver: '3' }).confirmed.scoreMoney, true);
	assert.equal(deriveAttentionLabProgress({}).confirmed.scoreMoney, false);
});
