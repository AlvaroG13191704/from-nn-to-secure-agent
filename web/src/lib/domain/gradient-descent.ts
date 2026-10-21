/** One weight, one example: ŷ = w·x and L(w) = ½(ŷ − y)². Same numbers as the lab. */
export const ONE_WEIGHT = { input: 2, target: 10, start: 3 };

export function lossForWeight(weight: number) {
	return 0.5 * (ONE_WEIGHT.input * weight - ONE_WEIGHT.target) ** 2;
}

/** How much the loss changes per unit of weight at this point (the gradient of this one-weight loss). */
export function slopeForWeight(weight: number) {
	return ONE_WEIGHT.input * (ONE_WEIGHT.input * weight - ONE_WEIGHT.target);
}

/** The nudge experiment: move the weight a little and measure how much the loss reacts. */
export function measureSlope(weight: number, nudge: number) {
	const lossBefore = lossForWeight(weight);
	const lossAfter = lossForWeight(weight + nudge);
	return { lossBefore, lossAfter, change: lossAfter - lossBefore, slope: (lossAfter - lossBefore) / nudge };
}

export type DescentPoint = { weight: number; loss: number; slope: number };

export function descendOneWeight(start: number, learningRate: number, steps: number): DescentPoint[] {
	const path: DescentPoint[] = [{ weight: start, loss: lossForWeight(start), slope: slopeForWeight(start) }];
	for (let step = 0; step < steps; step += 1) {
		const weight = path[path.length - 1].weight - learningRate * path[path.length - 1].slope;
		path.push({ weight, loss: lossForWeight(weight), slope: slopeForWeight(weight) });
	}
	return path;
}

/** Each step multiplies the distance to the minimum by (1 − η·x²); its sign and size decide the behaviour. */
export function describeStepSize(learningRate: number): 'smooth' | 'bounces' | 'diverges' {
	const factor = 1 - learningRate * ONE_WEIGHT.input ** 2;
	if (Math.abs(factor) >= 1) return 'diverges';
	return factor < 0 ? 'bounces' : 'smooth';
}
