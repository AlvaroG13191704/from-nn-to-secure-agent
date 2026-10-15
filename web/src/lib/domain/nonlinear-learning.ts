export type ClassroomPoint = { x: number; y: number; label: 0 | 1 };
export type HiddenActivation = 'identity' | 'tanh';

export const XOR_POINTS: readonly ClassroomPoint[] = [
	{ x: -0.86, y: -0.76, label: 1 },
	{ x: -0.62, y: -0.69, label: 1 },
	{ x: -0.74, y: -0.46, label: 1 },
	{ x: 0.61, y: 0.72, label: 1 },
	{ x: 0.85, y: 0.52, label: 1 },
	{ x: -0.82, y: 0.72, label: 0 },
	{ x: -0.54, y: 0.52, label: 0 },
	{ x: 0.60, y: -0.73, label: 0 },
	{ x: 0.86, y: -0.48, label: 0 },
	{ x: 0.43, y: -0.59, label: 0 }
];

export type TinyNetwork = {
	hiddenWeights: number[][];
	hiddenBiases: number[];
	outputWeights: number[];
	outputBias: number;
};

export type LearningSnapshot = { epoch: number; identity: TinyNetwork; tanh: TinyNetwork };

function initialNetwork(): TinyNetwork {
	return {
		hiddenWeights: Array.from({ length: 8 }, (_, index) => [Math.sin((index + 1) * 1.7) * 0.9, Math.cos((index + 1) * 2.3) * 0.9]),
		hiddenBiases: Array.from({ length: 8 }, (_, index) => Math.sin((index + 1) * 0.6) * 0.1),
		outputWeights: Array.from({ length: 8 }, (_, index) => Math.cos((index + 1) * 1.3) * 0.4),
		outputBias: 0
	};
}

function hiddenValues(network: TinyNetwork, x: number, y: number, activation: HiddenActivation) {
	return network.hiddenWeights.map(([wx, wy], index) => {
		const value = wx * x + wy * y + network.hiddenBiases[index];
		return activation === 'tanh' ? Math.tanh(value) : value;
	});
}

export function score(network: TinyNetwork, x: number, y: number, activation: HiddenActivation) {
	const hidden = hiddenValues(network, x, y, activation);
	return hidden.reduce((sum, value, index) => sum + value * network.outputWeights[index], network.outputBias);
}

export function predictClassProbability(network: TinyNetwork, x: number, y: number, activation: HiddenActivation) {
	const value = score(network, x, y, activation);
	return 1 / (1 + Math.exp(-value));
}

export function evaluateModel(network: TinyNetwork, points: readonly ClassroomPoint[], activation: HiddenActivation) {
	let loss = 0;
	let correct = 0;
	for (const point of points) {
		const probability = predictClassProbability(network, point.x, point.y, activation);
		const safe = Math.max(1e-7, Math.min(1 - 1e-7, probability));
		loss -= point.label * Math.log(safe) + (1 - point.label) * Math.log(1 - safe);
		if ((probability >= 0.5 ? 1 : 0) === point.label) correct++;
	}
	return { loss: loss / points.length, accuracy: correct / points.length };
}

function trainEpoch(network: TinyNetwork, points: readonly ClassroomPoint[], activation: HiddenActivation, learningRate: number): TinyNetwork {
	const count = network.outputWeights.length;
	const hiddenWeightGradient = Array.from({ length: count }, () => [0, 0]);
	const hiddenBiasGradient = Array(count).fill(0) as number[];
	const outputWeightGradient = Array(count).fill(0) as number[];
	let outputBiasGradient = 0;

	for (const point of points) {
		const hidden = hiddenValues(network, point.x, point.y, activation);
		const logit = hidden.reduce((sum, value, index) => sum + value * network.outputWeights[index], network.outputBias);
		const error = 1 / (1 + Math.exp(-logit)) - point.label;
		outputBiasGradient += error;
		for (let index = 0; index < count; index++) {
			outputWeightGradient[index] += error * hidden[index];
			const local = activation === 'tanh' ? 1 - hidden[index] ** 2 : 1;
			const hiddenError = error * network.outputWeights[index] * local;
			hiddenWeightGradient[index][0] += hiddenError * point.x;
			hiddenWeightGradient[index][1] += hiddenError * point.y;
			hiddenBiasGradient[index] += hiddenError;
		}
	}

	const scale = learningRate / points.length;
	return {
		hiddenWeights: network.hiddenWeights.map(([wx, wy], index) => [wx - scale * hiddenWeightGradient[index][0], wy - scale * hiddenWeightGradient[index][1]]),
		hiddenBiases: network.hiddenBiases.map((bias, index) => bias - scale * hiddenBiasGradient[index]),
		outputWeights: network.outputWeights.map((weight, index) => weight - scale * outputWeightGradient[index]),
		outputBias: network.outputBias - scale * outputBiasGradient
	};
}

export function buildLearningSnapshots(epochs: readonly number[] = [0, 1, 2, 3, 5, 8, 12, 20, 30, 45, 60, 90, 150]): LearningSnapshot[] {
	let identity = initialNetwork();
	let tanh = initialNetwork();
	const snapshots: LearningSnapshot[] = [];
	const lastEpoch = Math.max(...epochs);
	const checkpoints = new Set(epochs);
	for (let epoch = 0; epoch <= lastEpoch; epoch++) {
		if (checkpoints.has(epoch)) snapshots.push({ epoch, identity, tanh });
		if (epoch < lastEpoch) {
			identity = trainEpoch(identity, XOR_POINTS, 'identity', 0.8);
			tanh = trainEpoch(tanh, XOR_POINTS, 'tanh', 0.8);
		}
	}
	return snapshots;
}
