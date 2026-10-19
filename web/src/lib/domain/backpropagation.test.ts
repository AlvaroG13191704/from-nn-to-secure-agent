// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateChainRuleExample, calculateBackpropagation, BACKPROP_EXAMPLE } from './backpropagation.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`);

test('chain rule example reproduces the single-weight numbers used in 2.9 and the lab', () => {
	const result = calculateChainRuleExample({ input: 2, weight: 3, target: 10, nudge: 0.01 });
	assert.deepEqual(
		{ prediction: result.prediction, loss: result.loss, dLossDPrediction: result.dLossDPrediction, dPredictionDWeight: result.dPredictionDWeight, gradient: result.gradient },
		{ prediction: 6, loss: 8, dLossDPrediction: -4, dPredictionDWeight: 2, gradient: -8 }
	);
	close(result.nudgedLoss, 7.9202);
	// The measured change agrees with gradient × nudge to first order.
	assert.ok(Math.abs(result.nudgedLoss - result.loss - result.gradient * 0.01) < 0.001);
});

test('backpropagation forward pass of the two-neuron example', () => {
	const { forward } = calculateBackpropagation(BACKPROP_EXAMPLE);
	assert.deepEqual(forward, { z1: 1, h1: 1, z2: 2, h2: 2, prediction: 2, error: -2, loss: 2 });
});

test('backpropagation gradients follow the chain rule for every parameter', () => {
	const { gradients } = calculateBackpropagation(BACKPROP_EXAMPLE);
	assert.deepEqual(gradients, {
		prediction: -2,
		v1: -2,
		v2: -4,
		c: -2,
		h1: -2,
		h2: -1,
		z1: -2,
		z2: -1,
		w1: -4,
		b1: -2,
		w2: -2,
		b2: -1
	});
});

test('backpropagation gradients match a numerical estimate', () => {
	const { gradients } = calculateBackpropagation(BACKPROP_EXAMPLE);
	const lossWith = (changes) => calculateBackpropagation({ ...BACKPROP_EXAMPLE, ...changes }).forward.loss;
	for (const name of ['w1', 'b1', 'w2', 'b2', 'v1', 'v2', 'c']) {
		const step = 1e-6;
		const estimate = (lossWith({ [name]: BACKPROP_EXAMPLE[name] + step }) - lossWith({ [name]: BACKPROP_EXAMPLE[name] - step })) / (2 * step);
		assert.ok(Math.abs(estimate - gradients[name]) < 1e-5, `${name}: ${estimate} vs ${gradients[name]}`);
	}
});

test('one update step lowers the loss', () => {
	const { updated, nextForward } = calculateBackpropagation(BACKPROP_EXAMPLE);
	for (const [name, value] of Object.entries({ w1: 0.9, b1: 0.2, w2: 1.7, b2: -0.9, v1: 1.2, v2: 0.9, c: 0.2 })) close(updated[name], value);
	close(nextForward.prediction, 4.85);
	close(nextForward.loss, 0.36125);
});

test('a ReLU neuron with negative z passes no correction signal', () => {
	const { forward, gradients } = calculateBackpropagation({ ...BACKPROP_EXAMPLE, b2: -5 });
	assert.equal(forward.h2, 0);
	assert.equal(gradients.z2, 0);
	assert.equal(gradients.w2, 0);
	assert.equal(gradients.b2, 0);
});
