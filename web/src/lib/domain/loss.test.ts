// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { squaredErrorLoss, averageLoss, LOSS_EXAMPLES } from './loss.ts';

test('squared error loss of the running example', () => {
	assert.deepEqual(squaredErrorLoss(6, 10), { error: -4, squared: 16, loss: 8 });
	assert.deepEqual(squaredErrorLoss(10, 10), { error: 0, squared: 0, loss: 0 });
});

test('missing by the same amount above or below costs the same', () => {
	assert.equal(squaredErrorLoss(14, 10).loss, squaredErrorLoss(6, 10).loss);
});

test('a twice larger error costs four times more', () => {
	assert.equal(squaredErrorLoss(8, 10).loss * 4, squaredErrorLoss(6, 10).loss);
});

test('the batch loss is the average of each example loss', () => {
	assert.equal(LOSS_EXAMPLES.length, 3);
	const losses = LOSS_EXAMPLES.map(({ prediction, target }) => squaredErrorLoss(prediction, target).loss);
	assert.deepEqual(losses, [8, 0.5, 2]);
	assert.equal(averageLoss(LOSS_EXAMPLES), 3.5);
});
