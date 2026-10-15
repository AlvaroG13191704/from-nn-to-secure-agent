export type ActivationName = 'step' | 'sigmoid' | 'tanh' | 'relu';

export const ACTIVATION_PLOT = {
	width: 420,
	height: 220,
	left: 40,
	right: 380,
	top: 20,
	bottom: 180,
	inputMin: -5,
	inputMax: 5
} as const;

export function evaluateActivation(name: ActivationName, input: number): number {
	switch (name) {
		case 'step':
			return input >= 0 ? 1 : 0;
		case 'sigmoid':
			// This split form avoids overflow for large negative inputs.
			return input >= 0 ? 1 / (1 + Math.exp(-input)) : Math.exp(input) / (1 + Math.exp(input));
		case 'tanh':
			return Math.tanh(input);
		case 'relu':
			return Math.max(0, input);
	}
}

export function mapActivationPoint(name: ActivationName, input: number) {
	const clampedInput = Math.min(ACTIVATION_PLOT.inputMax, Math.max(ACTIVATION_PLOT.inputMin, input));
	const value = evaluateActivation(name, clampedInput);
	const x = ACTIVATION_PLOT.left + ((clampedInput - ACTIVATION_PLOT.inputMin) / (ACTIVATION_PLOT.inputMax - ACTIVATION_PLOT.inputMin)) * (ACTIVATION_PLOT.right - ACTIVATION_PLOT.left);
	const outputRange = name === 'tanh' ? [-1, 1] : name === 'relu' ? [0, 5] : [0, 1];
	const y = ACTIVATION_PLOT.bottom - ((value - outputRange[0]) / (outputRange[1] - outputRange[0])) * (ACTIVATION_PLOT.bottom - ACTIVATION_PLOT.top);
	return { x, y, value };
}

export function activationPlotAxes(name: ActivationName) {
	if (name === 'tanh') {
		return { zeroY: 100, labels: [{ value: '1', y: 20 }, { value: '0', y: 100 }, { value: '−1', y: 180 }] };
	}
	const upperLabel = name === 'relu' ? '5' : '1';
	return { zeroY: 180, labels: [{ value: upperLabel, y: 20 }, { value: '0', y: 180 }] };
}

export function activationCurvePath(name: ActivationName): string {
	if (name === 'step') return `M ${ACTIVATION_PLOT.left} ${ACTIVATION_PLOT.bottom} H 209.99 M 210 ${ACTIVATION_PLOT.top} H ${ACTIVATION_PLOT.right}`;
	const segments = 80;
	return Array.from({ length: segments + 1 }, (_, index) => {
		const input = ACTIVATION_PLOT.inputMin + (index / segments) * (ACTIVATION_PLOT.inputMax - ACTIVATION_PLOT.inputMin);
		const point = mapActivationPoint(name, input);
		return `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
	}).join(' ');
}
