/**
 * A two-weight loss surface L(a, b) with a deep global valley, a shallower local valley and gentle ripples.
 * It is the average of eight per-example losses; each example tilts the surface a little, and the tilts cancel out
 * on average. That is what makes stochastic and mini-batch gradients noisy but unbiased.
 */
export const LANDSCAPE_RANGE = 3;

const BASE = 1.6;
const BOWL = 0.12;
const RIPPLE = 0.12;
const VALLEYS = [
	{ a: 1.5, b: -1.2, spread: 0.9, depth: 1.8 },
	{ a: -1.0, b: 0.7, spread: 0.6, depth: 0.7 }
];
const NOISE_SCALE = 2.2;

/** Per-example tilt [∂/∂a, ∂/∂b]; the eight tilts add up to zero. */
export const TRAINING_EXAMPLES: [number, number][] = [
	[0.6, -0.3], [-0.5, 0.4], [0.3, 0.6], [-0.4, -0.5], [0.7, 0.2], [-0.6, -0.1], [0.1, -0.5], [-0.2, 0.2]
].map(([a, b]) => [a * NOISE_SCALE, b * NOISE_SCALE]);

const bump = (da: number, db: number, spread: number) => Math.exp(-(da * da + db * db) / (2 * spread * spread));

export function lossAt(a: number, b: number) {
	let loss = BASE + BOWL * (a * a + b * b) + RIPPLE * Math.sin(1.7 * a) * Math.cos(1.4 * b);
	for (const valley of VALLEYS) loss -= valley.depth * bump(a - valley.a, b - valley.b, valley.spread);
	return loss;
}

export function gradientAt(a: number, b: number): [number, number] {
	let ga = 2 * BOWL * a + 1.7 * RIPPLE * Math.cos(1.7 * a) * Math.cos(1.4 * b);
	let gb = 2 * BOWL * b - 1.4 * RIPPLE * Math.sin(1.7 * a) * Math.sin(1.4 * b);
	for (const valley of VALLEYS) {
		const weight = (valley.depth * bump(a - valley.a, b - valley.b, valley.spread)) / valley.spread ** 2;
		ga += weight * (a - valley.a);
		gb += weight * (b - valley.b);
	}
	return [ga, gb];
}

export function exampleLossAt(index: number, a: number, b: number) {
	const [ta, tb] = TRAINING_EXAMPLES[index];
	return lossAt(a, b) + ta * a + tb * b;
}

function exampleGradientMean(indices: number[], a: number, b: number): [number, number] {
	const [ga, gb] = gradientAt(a, b);
	const ta = indices.reduce((sum, index) => sum + TRAINING_EXAMPLES[index][0], 0) / indices.length;
	const tb = indices.reduce((sum, index) => sum + TRAINING_EXAMPLES[index][1], 0) / indices.length;
	return [ga + ta, gb + tb];
}

function refineMinimum(a: number, b: number) {
	for (let step = 0; step < 4000; step += 1) {
		const [ga, gb] = gradientAt(a, b);
		a -= 0.05 * ga;
		b -= 0.05 * gb;
	}
	return { a, b };
}

export const LANDSCAPE_MINIMA = [
	{ kind: 'global' as const, ...refineMinimum(1.4, -1.1) },
	{ kind: 'local' as const, ...refineMinimum(-0.9, 0.6) }
];

export function nearestMinimum(point: { a: number; b: number }) {
	return LANDSCAPE_MINIMA.reduce((best, minimum) =>
		Math.hypot(point.a - minimum.a, point.b - minimum.b) < Math.hypot(point.a - best.a, point.b - best.b) ? minimum : best
	);
}

export type OptimizerKind = 'batch' | 'sgd' | 'minibatch' | 'momentum' | 'adam';
export const OPTIMIZER_KINDS: OptimizerKind[] = ['batch', 'sgd', 'minibatch', 'momentum', 'adam'];
export const OPTIMIZER_SETTINGS = {
	batch: { learningRate: 0.3, batchSize: TRAINING_EXAMPLES.length },
	sgd: { learningRate: 0.3, batchSize: 1 },
	minibatch: { learningRate: 0.3, batchSize: 4 },
	momentum: { learningRate: 0.05, batchSize: TRAINING_EXAMPLES.length, beta: 0.9 },
	adam: { learningRate: 0.12, batchSize: TRAINING_EXAMPLES.length, beta1: 0.9, beta2: 0.999 }
} as const;

export const START_POINTS = [
	{ a: -2.6, b: 2.4 },
	{ a: 2.6, b: 2.4 }
];
export const DEFAULT_STEPS = 70;
/** With this seed the first start shows the classic story: SGD noise and momentum escape the local valley. */
export const DEFAULT_SEED = 14;

export type PathPoint = { a: number; b: number; loss: number };

/** Small seeded generator so every class sees the same "random" run. */
function seededRandom(seed: number) {
	let state = seed;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function sampleBatch(random: () => number, size: number) {
	const indices = TRAINING_EXAMPLES.map((_, index) => index);
	if (size >= indices.length) return indices;
	for (let index = indices.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(random() * (index + 1));
		[indices[index], indices[swap]] = [indices[swap], indices[index]];
	}
	return indices.slice(0, size);
}

const clamp = (value: number) => Math.max(-LANDSCAPE_RANGE, Math.min(LANDSCAPE_RANGE, value));

export function runOptimizer(kind: OptimizerKind, start: { a: number; b: number }, steps = DEFAULT_STEPS, seed = DEFAULT_SEED): PathPoint[] {
	const settings = OPTIMIZER_SETTINGS[kind];
	const random = seededRandom(seed);
	let { a, b } = start;
	let velocity: [number, number] = [0, 0];
	let firstMoment: [number, number] = [0, 0];
	let secondMoment: [number, number] = [0, 0];
	const path: PathPoint[] = [{ a, b, loss: lossAt(a, b) }];

	for (let step = 1; step <= steps; step += 1) {
		const [ga, gb] = exampleGradientMean(sampleBatch(random, settings.batchSize), a, b);
		if (kind === 'momentum') {
			const { beta, learningRate } = OPTIMIZER_SETTINGS.momentum;
			velocity = [beta * velocity[0] + ga, beta * velocity[1] + gb];
			a -= learningRate * velocity[0];
			b -= learningRate * velocity[1];
		} else if (kind === 'adam') {
			const { beta1, beta2, learningRate } = OPTIMIZER_SETTINGS.adam;
			firstMoment = [beta1 * firstMoment[0] + (1 - beta1) * ga, beta1 * firstMoment[1] + (1 - beta1) * gb];
			secondMoment = [beta2 * secondMoment[0] + (1 - beta2) * ga * ga, beta2 * secondMoment[1] + (1 - beta2) * gb * gb];
			const correction1 = 1 - beta1 ** step;
			const correction2 = 1 - beta2 ** step;
			a -= (learningRate * firstMoment[0]) / correction1 / (Math.sqrt(secondMoment[0] / correction2) + 1e-8);
			b -= (learningRate * firstMoment[1]) / correction1 / (Math.sqrt(secondMoment[1] / correction2) + 1e-8);
		} else {
			a -= settings.learningRate * ga;
			b -= settings.learningRate * gb;
		}
		a = clamp(a);
		b = clamp(b);
		path.push({ a, b, loss: lossAt(a, b) });
	}
	return path;
}
