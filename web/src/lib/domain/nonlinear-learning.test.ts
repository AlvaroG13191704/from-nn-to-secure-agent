// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { XOR_POINTS, buildLearningSnapshots, evaluateModel, score } from './nonlinear-learning.ts';

test('the classroom dataset has ten balanced, diagonally alternating examples', () => {
	assert.equal(XOR_POINTS.length, 10);
	assert.equal(XOR_POINTS.filter((point) => point.label === 1).length, 5);
	assert.ok(XOR_POINTS.every((point) => point.label === (point.x * point.y > 0 ? 1 : 0)));
});

test('without a hidden activation, the two-layer network still has an affine score', () => {
	const { identity } = buildLearningSnapshots([0, 100]).at(-1);
	const diagonal = score(identity, -1, -1, 'identity') + score(identity, 1, 1, 'identity');
	const cross = score(identity, -1, 1, 'identity') + score(identity, 1, -1, 'identity');
	assert.ok(Math.abs(diagonal - cross) < 1e-9);
});

test('real deterministic training lets tanh fit the nonlinear pattern while identity cannot', () => {
	const snapshots = buildLearningSnapshots();
	assert.equal(snapshots.at(-1).epoch, 150);
	assert.deepEqual(snapshots, buildLearningSnapshots());
	const initial = snapshots[0];
	const final = snapshots.at(-1);
	const linearInitial = evaluateModel(initial.identity, XOR_POINTS, 'identity');
	const nonlinearInitial = evaluateModel(initial.tanh, XOR_POINTS, 'tanh');
	const linearFinal = evaluateModel(final.identity, XOR_POINTS, 'identity');
	const nonlinearFinal = evaluateModel(final.tanh, XOR_POINTS, 'tanh');
	assert.ok(linearFinal.loss < linearInitial.loss);
	assert.ok(nonlinearFinal.loss < nonlinearInitial.loss);
	assert.ok(nonlinearFinal.accuracy >= 0.9);
	assert.ok(linearFinal.accuracy <= 0.8);
});
