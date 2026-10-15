// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	calculatePerceptron,
	calculateMlpFirstSample,
	calculateForwardPass,
	calculateChainRule,
	updateWeight,
	isNumericAnswerCorrect,
	getAnswerFeedbackPhase
} from './deep-learning-lab.ts';

test('perceptron combines the weighted inputs and applies the step activation', () => {
	const result = calculatePerceptron([4, 0.8], [0.5, 2], -3);
	assert.ok(Math.abs(result.z - 0.6) < 1e-12);
	assert.equal(result.output, 1);
});

test('limited MLP cells show the first sample linear values and ReLU outputs', () => {
	assert.deepEqual(calculateMlpFirstSample(), { z: [5, 2, 1], activation: [5, 2, 1] });
});

test('first and second forward pass return the expected prediction, error, and loss', () => {
	assert.deepEqual(calculateForwardPass(2, 3, 10), { prediction: 6, error: -4, loss: 8 });
	const second = calculateForwardPass(2, 3.8, 10);
	assert.ok(Math.abs(second.prediction - 7.6) < 1e-12);
	assert.ok(Math.abs(second.error + 2.4) < 1e-12);
	assert.ok(Math.abs(second.loss - 2.88) < 1e-12);
});

test('chain rule multiplies local derivatives and updates the weight', () => {
	assert.equal(calculateChainRule(-4, 2), -8);
	assert.equal(updateWeight(3, 0.1, -8), 3.8);
});

test('numeric answers tolerate rounding but reject non-numeric and out-of-range values', () => {
	assert.equal(isNumericAnswerCorrect('7.6001', 7.6), true);
	assert.equal(isNumericAnswerCorrect('7.62', 7.6), false);
	assert.equal(isNumericAnswerCorrect('nope', 7.6), false);
});

test('answer feedback gives a hint first and reveals the number only after an explicit request', () => {
	assert.equal(getAnswerFeedbackPhase('0', 0.6, '0', 1, false), 'hint');
	assert.equal(getAnswerFeedbackPhase('0', 0.6, '0', 2, false), 'offer-solution');
	assert.equal(getAnswerFeedbackPhase('0', 0.6, '0', 2, true), 'solution');
	assert.equal(getAnswerFeedbackPhase('0.6', 0.6, '0', 2, true), 'empty');
	assert.equal(getAnswerFeedbackPhase('0.6', 0.6, '0.6', 2, false), 'correct');
	assert.equal(getAnswerFeedbackPhase('', 0.6, '', 0, false), 'empty');
});

test('training visualization reveals only validated forward, backward, update, and second-pass values', async () => {
	const { deriveTrainingProgress } = await import('./deep-learning-lab.ts');
	const empty = deriveTrainingProgress({});
	assert.equal(empty.step, 0);
	assert.equal(empty.prediction, undefined);
	assert.equal(empty.error, undefined);
	assert.deepEqual([empty.input, empty.initialWeight, empty.target], [2, 3, 10]);

	const prediction = deriveTrainingProgress({ firstPrediction: '6' });
	assert.equal(prediction.step, 1);
	assert.equal(prediction.prediction, 6);
	assert.equal(prediction.error, undefined);

	const badError = deriveTrainingProgress({ firstPrediction: '6', firstError: '-3' });
	assert.equal(badError.step, 1);
	assert.equal(badError.error, undefined);

	const forward = deriveTrainingProgress({ firstPrediction: '6', firstError: '-4', firstLoss: '8' });
	assert.equal(forward.step, 3);
	assert.equal(forward.error, -4);
	assert.equal(forward.loss, 8);
	assert.equal(forward.dLossDPrediction, undefined);

	const backward = deriveTrainingProgress({
		firstPrediction: '6', firstError: '-4', firstLoss: '8',
		localLossDerivative: '-4', localPredictionDerivative: '2', gradient: '-8'
	});
	assert.equal(backward.step, 6);
	assert.equal(backward.dLossDPrediction, -4);
	assert.equal(backward.dPredictionDWeight, 2);
	assert.equal(backward.gradient, -8);
	assert.equal(backward.updatedWeight, undefined);

	const afterUpdate = deriveTrainingProgress({
		firstPrediction: '6', firstError: '-4', firstLoss: '8',
		localLossDerivative: '-4', localPredictionDerivative: '2', gradient: '-8', updatedWeight: '3.8'
	});
	assert.equal(afterUpdate.step, 7);
	assert.equal(afterUpdate.updatedWeight, 3.8);
	assert.equal(afterUpdate.secondPrediction, undefined);

	const secondPass = deriveTrainingProgress({
		firstPrediction: '6', firstError: '-4', firstLoss: '8',
		localLossDerivative: '-4', localPredictionDerivative: '2', gradient: '-8', updatedWeight: '3.8',
		secondPrediction: '7.6', secondLoss: '2.88'
	});
	assert.equal(secondPass.step, 9);
	assert.equal(secondPass.secondPrediction, 7.6);
	assert.ok(Math.abs(secondPass.secondError! + 2.4) < 1e-12);
	assert.ok(Math.abs(secondPass.secondLoss! - 2.88) < 1e-12);
});


test('training display formatting removes floating-point artifacts without trailing zeros', async () => {
	const { formatTrainingNumber } = await import('./deep-learning-lab.ts');
	assert.equal(formatTrainingNumber(-2.4000000000000004), '-2.4');
	assert.equal(formatTrainingNumber(2.880000000000001), '2.88');
	assert.equal(formatTrainingNumber(6), '6');
});
