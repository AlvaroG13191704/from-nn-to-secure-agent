/** Single weight: ŷ = w·x, L = ½(ŷ − y)². Same numbers as the 2.9 curve and the lab. */
export function calculateChainRuleExample({ input, weight, target, nudge }: { input: number; weight: number; target: number; nudge: number }) {
	const prediction = weight * input;
	const loss = 0.5 * (prediction - target) ** 2;
	const dLossDPrediction = prediction - target;
	const dPredictionDWeight = input;
	const gradient = dLossDPrediction * dPredictionDWeight;
	const nudgedWeight = weight + nudge;
	const nudgedPrediction = nudgedWeight * input;
	const nudgedLoss = 0.5 * (nudgedPrediction - target) ** 2;
	return { prediction, loss, dLossDPrediction, dPredictionDWeight, gradient, nudgedWeight, nudgedPrediction, nudgedLoss };
}

/**
 * One input, two ReLU hidden neurons, one linear output:
 * z₁ = w₁x + b₁, h₁ = ReLU(z₁); z₂ = w₂x + b₂, h₂ = ReLU(z₂); ŷ = v₁h₁ + v₂h₂ + c; L = ½(ŷ − y)².
 */
export type BackpropParameters = { x: number; y: number; w1: number; b1: number; w2: number; b2: number; v1: number; v2: number; c: number; learningRate: number };
export type BackpropParameterName = 'w1' | 'b1' | 'w2' | 'b2' | 'v1' | 'v2' | 'c';

export const BACKPROP_EXAMPLE: BackpropParameters = { x: 2, y: 4, w1: 0.5, b1: 0, w2: 1.5, b2: -1, v1: 1, v2: 0.5, c: 0, learningRate: 0.1 };
export const BACKPROP_PARAMETER_NAMES: BackpropParameterName[] = ['w1', 'b1', 'w2', 'b2', 'v1', 'v2', 'c'];

const relu = (value: number) => Math.max(0, value);

function forwardPass(p: BackpropParameters) {
	const z1 = p.w1 * p.x + p.b1;
	const h1 = relu(z1);
	const z2 = p.w2 * p.x + p.b2;
	const h2 = relu(z2);
	const prediction = p.v1 * h1 + p.v2 * h2 + p.c;
	const error = prediction - p.y;
	return { z1, h1, z2, h2, prediction, error, loss: 0.5 * error ** 2 };
}

export function calculateBackpropagation(p: BackpropParameters) {
	const forward = forwardPass(p);
	// Each signal is the signal that arrives times the local influence of the connection it crosses.
	const prediction = forward.error;
	const v1 = prediction * forward.h1;
	const v2 = prediction * forward.h2;
	const c = prediction;
	const h1 = prediction * p.v1;
	const h2 = prediction * p.v2;
	const z1 = forward.z1 > 0 ? h1 : 0;
	const z2 = forward.z2 > 0 ? h2 : 0;
	const gradients = { prediction, v1, v2, c, h1, h2, z1, z2, w1: z1 * p.x, b1: z1, w2: z2 * p.x, b2: z2 };
	const updated = Object.fromEntries(
		BACKPROP_PARAMETER_NAMES.map((name) => [name, p[name] - p.learningRate * gradients[name]])
	) as Record<BackpropParameterName, number>;
	const nextForward = forwardPass({ ...p, ...updated });
	return { forward, gradients, updated, nextForward };
}
