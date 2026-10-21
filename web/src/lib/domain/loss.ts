/** Squared-error loss used throughout slide 2: L = ½(ŷ − y)². */
export function squaredErrorLoss(prediction: number, target: number) {
	const error = prediction - target;
	const squared = error ** 2;
	return { error, squared, loss: 0.5 * squared };
}

/** Three examples of one small batch; the first one is the running example of 2.7 (ŷ = 6, y = 10). */
export const LOSS_EXAMPLES = [
	{ prediction: 6, target: 10 },
	{ prediction: 4, target: 5 },
	{ prediction: 7, target: 9 }
];

export function averageLoss(examples: { prediction: number; target: number }[]) {
	return examples.reduce((sum, { prediction, target }) => sum + squaredErrorLoss(prediction, target).loss, 0) / examples.length;
}
