// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	MLP_LAB_CASE,
	MLP_LAB_FIELDS,
	MLP_LAB_REQUIRED_FIELDS,
	calculateMlpForward,
	calculateMlpBackward,
	applyMlpGradient,
	deriveMlpLabProgress,
	isMlpLabValueVisible
} from './mlp-lab.ts';

test('the shared 2-2-1 example gives hand-calculable forward values and a lower loss after one update', () => {
	const first = calculateMlpForward(MLP_LAB_CASE.network, MLP_LAB_CASE.inputs, MLP_LAB_CASE.target);
	assert.deepEqual(first.hidden.map((neuron) => [neuron.z, neuron.activation]), [[3, 3], [1, 1]]);
	assert.equal(first.prediction, 4);
	assert.equal(first.loss, 0.5);

	const backward = calculateMlpBackward(MLP_LAB_CASE.network, MLP_LAB_CASE.inputs, first);
	assert.equal(backward.output.delta, -1);
	assert.deepEqual(backward.output.weights, [-3, -1]);
	assert.equal(backward.output.bias, -1);
	assert.deepEqual(backward.hidden.map((neuron) => neuron.delta), [-1, -1]);
	assert.deepEqual(backward.hidden.map((neuron) => neuron.weights), [[-1, -2], [-1, -2]]);
	assert.deepEqual(backward.hidden.map((neuron) => neuron.bias), [-1, -1]);

	const updated = applyMlpGradient(MLP_LAB_CASE.network, backward, MLP_LAB_CASE.learningRate);
	assert.deepEqual(updated.hidden, [
		{ weights: [1.05, 1.1], bias: 0.05 },
		{ weights: [1.05, 0.1], bias: 0.05 }
	]);
	assert.deepEqual(updated.output, { weights: [1.15, 1.05], bias: 0.05 });
	const second = calculateMlpForward(updated, MLP_LAB_CASE.inputs, MLP_LAB_CASE.target);
	assert.ok(Math.abs(second.prediction - 5.21) < 1e-12);
	assert.ok(Math.abs(second.loss - 0.02205) < 1e-12);
	assert.ok(second.loss < first.loss);
});

test('backward gradients for all nine parameters agree with finite differences', () => {
	const original = MLP_LAB_CASE.network;
	const first = calculateMlpForward(original, MLP_LAB_CASE.inputs, MLP_LAB_CASE.target);
	const backward = calculateMlpBackward(original, MLP_LAB_CASE.inputs, first);
	const gradients = [
		...backward.hidden[0].weights, backward.hidden[0].bias,
		...backward.hidden[1].weights, backward.hidden[1].bias,
		...backward.output.weights, backward.output.bias
	];
	const read = (network) => [
		...network.hidden[0].weights, network.hidden[0].bias,
		...network.hidden[1].weights, network.hidden[1].bias,
		...network.output.weights, network.output.bias
	];
	const fromValues = (values) => ({
		hidden: [
			{ weights: [values[0], values[1]], bias: values[2] },
			{ weights: [values[3], values[4]], bias: values[5] }
		],
		output: { weights: [values[6], values[7]], bias: values[8] }
	});
	const epsilon = 1e-6;
	for (let index = 0; index < gradients.length; index += 1) {
		const high = read(original);
		const low = read(original);
		high[index] += epsilon;
		low[index] -= epsilon;
		const highLoss = calculateMlpForward(fromValues(high), MLP_LAB_CASE.inputs, MLP_LAB_CASE.target).loss;
		const lowLoss = calculateMlpForward(fromValues(low), MLP_LAB_CASE.inputs, MLP_LAB_CASE.target).loss;
		assert.ok(Math.abs((highLoss - lowLoss) / (2 * epsilon) - gradients[index]) < 1e-8, `parameter ${index}`);
	}
});

test('the diagram confirms only answers from the shared case and ignores old lab keys', () => {
	const empty = deriveMlpLabProgress({ firstPrediction: '6', firstLoss: '8' });
	assert.equal(empty.completedStages, 0);
	assert.equal(empty.confirmed.zH1, false);
	assert.equal(MLP_LAB_FIELDS.length, 24);
	assert.deepEqual(MLP_LAB_REQUIRED_FIELDS.map((field) => field.key), [
		'mlp2_zH1', 'mlp2_aH1', 'mlp2_prediction', 'mlp2_loss',
		'mlp2_deltaOutput', 'mlp2_gradOutW1', 'mlp2_deltaH1', 'mlp2_gradH1W1',
		'mlp2_updatedH1W1', 'mlp2_updatedOutW1',
		'mlp2_secondZH1', 'mlp2_secondPrediction', 'mlp2_secondLoss'
	]);

	const wrong = deriveMlpLabProgress({ mlp2_zH1: '2' });
	assert.equal(wrong.confirmed.zH1, false);
	const first = deriveMlpLabProgress({ mlp2_zH1: '3', mlp2_aH1: '3' });
	assert.equal(first.confirmed.zH1, true);
	assert.equal(first.confirmed.aH1, true);
	assert.equal(first.confirmed.zH2, true);
	assert.equal(first.confirmed.aH2, true);
	assert.equal(first.confirmed.prediction, false);
	assert.equal(first.completedStages, 1);
	assert.equal(isMlpLabValueVisible(first, 'zH2', 1, false, 0), true);
	const outputSignalOnly = deriveMlpLabProgress({
		mlp2_zH1: '3', mlp2_aH1: '3', mlp2_prediction: '4', mlp2_loss: '0.5', mlp2_deltaOutput: '-1'
	});
	assert.equal(outputSignalOnly.confirmed.deltaOutput, true);
	assert.equal(outputSignalOnly.confirmed.gradOutW2, false);
	assert.equal(outputSignalOnly.completedStages, 2);
	const outputBranchDone = deriveMlpLabProgress({ ...Object.fromEntries(MLP_LAB_REQUIRED_FIELDS.filter((field) => field.stage <= 1).map((field) => [field.key, String(field.expected)])), mlp2_deltaOutput: '-1', mlp2_gradOutW1: '-3' });
	assert.equal(outputBranchDone.confirmed.gradOutW2, true);
	assert.equal(outputBranchDone.confirmed.gradOutBias, true);
	const representative = Object.fromEntries(MLP_LAB_REQUIRED_FIELDS.map((field) => [field.key, String(field.expected)]));
	assert.equal(deriveMlpLabProgress(representative).completedStages, 6);
	assert.ok(Object.values(deriveMlpLabProgress(representative).confirmed).every(Boolean));
	const all = Object.fromEntries(MLP_LAB_FIELDS.map((field) => [field.key, String(field.expected)]));
	assert.equal(deriveMlpLabProgress(all).completedStages, 6);
	const stale = deriveMlpLabProgress({ ...all, mlp2_zH1: '' });
	assert.equal(stale.completedStages, 0);
	assert.equal(isMlpLabValueVisible(stale, 'secondPrediction', 6, false, 0), false);
	assert.equal(isMlpLabValueVisible(stale, 'aH2', 1, false, 0), false);
});

test('backward exercise prompts use arithmetic adjustment signals without derivative notation', () => {
	const backwardFields = MLP_LAB_FIELDS.filter((field) => field.stage >= 2 && field.stage <= 4);
	assert.equal(backwardFields.length, 14);
	for (const field of backwardFields) {
		assert.doesNotMatch(`${field.label} ${field.hint}`, /∂|δ|ReLU′|derivad/i, field.key);
	}
	assert.deepEqual(backwardFields.map((field) => field.expected), [-1, -3, -1, -1, -1, -1, -1, -2, -1, -1, -2, -1, 1.05, 1.15]);
});
