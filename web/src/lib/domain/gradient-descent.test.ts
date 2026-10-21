// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { ONE_WEIGHT, lossForWeight, slopeForWeight, measureSlope, descendOneWeight, describeStepSize } from './gradient-descent.ts';

test('the one-weight example matches the lab numbers', () => {
	assert.deepEqual(ONE_WEIGHT, { input: 2, target: 10, start: 3 });
	assert.equal(lossForWeight(3), 8);
	assert.equal(lossForWeight(5), 0);
	assert.equal(slopeForWeight(3), -8);
});

test('nudging the weight measures the slope', () => {
	const measured = measureSlope(3, 0.01);
	assert.ok(Math.abs(measured.lossAfter - 7.9202) < 1e-9);
	assert.ok(Math.abs(measured.slope - -7.98) < 1e-9);
	assert.ok(Math.abs(measureSlope(3, 1e-6).slope - slopeForWeight(3)) < 1e-4);
});

test('one step from w = 3 with η = 0.1 lands on 3.8', () => {
	const path = descendOneWeight(3, 0.1, 1);
	assert.equal(path.length, 2);
	assert.ok(Math.abs(path[1].weight - 3.8) < 1e-12);
	assert.ok(path[1].loss < path[0].loss);
	for (const point of path) assert.equal(point.slope, slopeForWeight(point.weight));
});

test('step sizes: small steps approach smoothly, medium steps bounce, large steps escape', () => {
	assert.equal(describeStepSize(0.1), 'smooth');
	assert.equal(describeStepSize(0.4), 'bounces');
	assert.equal(describeStepSize(0.55), 'diverges');
	const smooth = descendOneWeight(3, 0.1, 30);
	assert.ok(smooth.every((point) => point.weight <= 5 + 1e-9));
	assert.ok(Math.abs(smooth.at(-1).weight - 5) < 1e-3);
	const bounce = descendOneWeight(3, 0.4, 30).map((point) => point.weight);
	assert.ok(bounce[1] > 5 && bounce[2] < 5);
	assert.ok(Math.abs(bounce.at(-1) - 5) < 1e-3);
	const escape = descendOneWeight(3, 0.55, 10);
	assert.ok(escape.at(-1).loss > escape[0].loss);
});
