// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { activationCurvePath, activationPlotAxes, evaluateActivation, mapActivationPoint } from './activation-functions.ts';

test('activation functions respond correctly to negative, zero, and positive inputs', () => {
	assert.deepEqual([-2, 0, 2].map((value) => evaluateActivation('step', value)), [0, 1, 1]);
	assert.deepEqual([-2, 0, 2].map((value) => evaluateActivation('sigmoid', value)), [1 / (1 + Math.exp(2)), 0.5, 1 / (1 + Math.exp(-2))]);
	assert.deepEqual([-2, 0, 2].map((value) => evaluateActivation('tanh', value)), [Math.tanh(-2), 0, Math.tanh(2)]);
	assert.deepEqual([-2, 0, 2].map((value) => evaluateActivation('relu', value)), [0, 0, 2]);
});

test('activation plot markers stay within the graph and preserve each function output', () => {
	for (const activation of ['step', 'sigmoid', 'tanh', 'relu']) {
		for (const input of [-5, -2, 0, 2, 5]) {
			const point = mapActivationPoint(activation, input);
			assert.ok(point.x >= 40 && point.x <= 380, `${activation} x marker is in bounds`);
			assert.ok(point.y >= 20 && point.y <= 180, `${activation} y marker is in bounds`);
			assert.equal(point.value, evaluateActivation(activation, input));
		}
	}
	assert.equal(mapActivationPoint('step', 0).value, 1);
	assert.equal(mapActivationPoint('tanh', 0).y, 100);
});

test('step curve draws separate branches and uses the defined closed endpoint at zero', () => {
	assert.equal(activationCurvePath('step'), 'M 40 180 H 209.99 M 210 20 H 380');
	assert.equal(mapActivationPoint('step', 0).value, 1);
});

test('plot axes label the correct zero-output baseline for tanh and other activations', () => {
	assert.deepEqual(activationPlotAxes('tanh'), {
		zeroY: 100,
		labels: [{ value: '1', y: 20 }, { value: '0', y: 100 }, { value: '−1', y: 180 }]
	});
	assert.deepEqual(activationPlotAxes('sigmoid'), {
		zeroY: 180,
		labels: [{ value: '1', y: 20 }, { value: '0', y: 180 }]
	});
	assert.deepEqual(activationPlotAxes('relu'), {
		zeroY: 180,
		labels: [{ value: '5', y: 20 }, { value: '0', y: 180 }]
	});
});
