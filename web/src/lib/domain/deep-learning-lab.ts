export type NumericResult = { prediction: number; error: number; loss: number };

export function calculatePerceptron(inputs: number[], weights: number[], bias: number) {
	if (inputs.length !== weights.length) throw new Error('Inputs and weights must have the same length.');
	const z = inputs.reduce((sum, input, index) => sum + input * weights[index], bias);
	return { z, output: z >= 0 ? 1 : 0 };
}

export function calculateMlpFirstSample() {
	const inputs = [1, 2];
	const columns = [[1, 2, 0], [-1, 1, 1], [2, 0, -1]];
	const z = columns.map(([firstWeight, secondWeight, bias]) => inputs[0] * firstWeight + inputs[1] * secondWeight + bias);
	return { z, activation: z.map((value) => Math.max(0, value)) };
}

export function calculateForwardPass(input: number, weight: number, target: number): NumericResult {
	const prediction = input * weight;
	const error = prediction - target;
	return { prediction, error, loss: 0.5 * error ** 2 };
}

export function calculateChainRule(dLossDPrediction: number, dPredictionDWeight: number) {
	return dLossDPrediction * dPredictionDWeight;
}

export function updateWeight(weight: number, learningRate: number, gradient: number) {
	return weight - learningRate * gradient;
}

export function isNumericAnswerCorrect(answer: string, expected: number, tolerance = 0.01) {
	const normalized = answer.trim().replace(',', '.');
	if (!normalized || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return false;
	const value = Number(normalized);
	return Number.isFinite(value) && Math.abs(value - expected) <= tolerance;
}

export type AnswerFeedbackPhase = 'empty' | 'correct' | 'hint' | 'offer-solution' | 'solution';

export function getAnswerFeedbackPhase(
	answer: string,
	expected: number,
	checkedAnswer: string,
	incorrectAttempts: number,
	solutionRevealed: boolean,
	tolerance = 0.01
): AnswerFeedbackPhase {
	if (!answer.trim() || answer !== checkedAnswer) return 'empty';
	if (isNumericAnswerCorrect(answer, expected, tolerance)) return 'correct';
	if (incorrectAttempts < 2) return 'hint';
	return solutionRevealed ? 'solution' : 'offer-solution';
}

export type TrainingAnswers = Record<string, string>;

export type TrainingVisualizationProgress = {
	step: number;
	input: number;
	initialWeight: number;
	target: number;
	prediction?: number;
	error?: number;
	loss?: number;
	dLossDPrediction?: number;
	dPredictionDWeight?: number;
	gradient?: number;
	updatedWeight?: number;
	secondPrediction?: number;
	secondError?: number;
	secondLoss?: number;
};

export function deriveTrainingProgress(answers: TrainingAnswers): TrainingVisualizationProgress {
	const input = 2;
	const initialWeight = 3;
	const target = 10;
	const learningRate = 0.1;
	const forward = calculateForwardPass(input, initialWeight, target);
	const dLossDPrediction = forward.error;
	const dPredictionDWeight = input;
	const gradient = calculateChainRule(dLossDPrediction, dPredictionDWeight);
	const updatedWeight = updateWeight(initialWeight, learningRate, gradient);
	const secondForward = calculateForwardPass(input, updatedWeight, target);
	const isCorrect = (key: string, expected: number) => isNumericAnswerCorrect(answers[key] ?? '', expected);

	const hasPrediction = isCorrect('firstPrediction', forward.prediction);
	const hasError = hasPrediction && isCorrect('firstError', forward.error);
	const hasLoss = hasError && isCorrect('firstLoss', forward.loss);
	const hasLossDerivative = hasLoss && isCorrect('localLossDerivative', dLossDPrediction);
	const hasPredictionDerivative = hasLossDerivative && isCorrect('localPredictionDerivative', dPredictionDWeight);
	const hasGradient = hasPredictionDerivative && isCorrect('gradient', gradient);
	const hasUpdatedWeight = hasGradient && isCorrect('updatedWeight', updatedWeight);
	const hasSecondPrediction = hasUpdatedWeight && isCorrect('secondPrediction', secondForward.prediction);
	const hasSecondLoss = hasSecondPrediction && isCorrect('secondLoss', secondForward.loss);

	return {
		input,
		initialWeight,
		target,
		step: hasSecondLoss ? 9 : hasSecondPrediction ? 8 : hasUpdatedWeight ? 7 : hasGradient ? 6 : hasPredictionDerivative ? 5 : hasLossDerivative ? 4 : hasLoss ? 3 : hasError ? 2 : hasPrediction ? 1 : 0,
		prediction: hasPrediction ? forward.prediction : undefined,
		error: hasError ? forward.error : undefined,
		loss: hasLoss ? forward.loss : undefined,
		dLossDPrediction: hasLossDerivative ? dLossDPrediction : undefined,
		dPredictionDWeight: hasPredictionDerivative ? dPredictionDWeight : undefined,
		gradient: hasGradient ? gradient : undefined,
		updatedWeight: hasUpdatedWeight ? updatedWeight : undefined,
		secondPrediction: hasSecondPrediction ? secondForward.prediction : undefined,
		secondError: hasSecondLoss ? secondForward.error : undefined,
		secondLoss: hasSecondLoss ? secondForward.loss : undefined
	};
}

export function formatTrainingNumber(value: number) {
	return Number(value.toFixed(2)).toString();
}
