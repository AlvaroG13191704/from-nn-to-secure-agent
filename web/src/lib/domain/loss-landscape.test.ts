// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	lossAt,
	gradientAt,
	exampleLossAt,
	TRAINING_EXAMPLES,
	runOptimizer,
	OPTIMIZER_KINDS,
	LANDSCAPE_MINIMA,
	START_POINTS,
	nearestMinimum
} from './loss-landscape.ts';

test('the surface is the average of the per-example losses', () => {
	for (const [a, b] of [[-2, 1], [0.5, -0.5], [1.4, -1.1]]) {
		const average = TRAINING_EXAMPLES.reduce((sum, _, index) => sum + exampleLossAt(index, a, b), 0) / TRAINING_EXAMPLES.length;
		assert.ok(Math.abs(average - lossAt(a, b)) < 1e-12);
	}
});

test('the analytic gradient matches a numerical estimate', () => {
	const step = 1e-6;
	for (const [a, b] of [[-2.6, 2.4], [0.3, 0.7], [1.5, -1.2], [-1, 0.7]]) {
		const [ga, gb] = gradientAt(a, b);
		const na = (lossAt(a + step, b) - lossAt(a - step, b)) / (2 * step);
		const nb = (lossAt(a, b + step) - lossAt(a, b - step)) / (2 * step);
		assert.ok(Math.abs(ga - na) < 1e-6 && Math.abs(gb - nb) < 1e-6, `${a},${b}`);
	}
});

test('the landscape has a deep global minimum and a shallower local one', () => {
	const [global, local] = LANDSCAPE_MINIMA;
	assert.equal(global.kind, 'global');
	assert.equal(local.kind, 'local');
	assert.ok(lossAt(global.a, global.b) < lossAt(local.a, local.b));
	for (const minimum of LANDSCAPE_MINIMA) {
		const [ga, gb] = gradientAt(minimum.a, minimum.b);
		assert.ok(Math.hypot(ga, gb) < 0.02, `${minimum.kind} gradient ${ga},${gb}`);
	}
});

test('runs are deterministic and record loss at every step', () => {
	const first = runOptimizer('sgd', START_POINTS[0], 40);
	const second = runOptimizer('sgd', START_POINTS[0], 40);
	assert.deepEqual(first, second);
	assert.equal(first.length, 41);
	for (const point of first) assert.ok(Math.abs(point.loss - lossAt(point.a, point.b)) < 1e-12);
});

test('from the first start, batch gradient descent stops in the local minimum while SGD and momentum reach the global one', () => {
	const outcome = Object.fromEntries(OPTIMIZER_KINDS.map((kind) => [kind, nearestMinimum(runOptimizer(kind, START_POINTS[0]).at(-1)).kind]));
	assert.deepEqual(outcome, { batch: 'local', sgd: 'global', minibatch: 'local', momentum: 'global', adam: 'local' });
});

test('batch gradient descent always lowers the loss with its small step', () => {
	const path = runOptimizer('batch', START_POINTS[0]);
	for (let index = 1; index < path.length; index += 1) assert.ok(path[index].loss <= path[index - 1].loss + 1e-12);
});
