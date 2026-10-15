import { isNumericAnswerCorrect } from './deep-learning-lab.ts';

export type MlpNeuron = { weights: [number, number]; bias: number };
export type MlpNetwork = { hidden: [MlpNeuron, MlpNeuron]; output: MlpNeuron };

export const MLP_LAB_CASE: { inputs: [number, number]; target: number; learningRate: number; network: MlpNetwork } = {
	inputs: [1, 2], target: 5, learningRate: 0.05,
	network: { hidden: [{ weights: [1, 1], bias: 0 }, { weights: [1, 0], bias: 0 }], output: { weights: [1, 1], bias: 0 } }
};

export function calculateMlpForward(network: MlpNetwork, inputs: [number, number], target: number) {
	const hidden = network.hidden.map((neuron) => {
		const z = neuron.weights[0] * inputs[0] + neuron.weights[1] * inputs[1] + neuron.bias;
		return { z, activation: Math.max(0, z) };
	}) as [{ z: number; activation: number }, { z: number; activation: number }];
	const prediction = network.output.weights[0] * hidden[0].activation + network.output.weights[1] * hidden[1].activation + network.output.bias;
	const error = prediction - target;
	return { hidden, prediction, error, loss: 0.5 * error * error };
}

export function calculateMlpBackward(network: MlpNetwork, inputs: [number, number], forward: ReturnType<typeof calculateMlpForward>) {
	const outputDelta = forward.error;
	const hidden = forward.hidden.map((neuron, index) => {
		const delta = outputDelta * network.output.weights[index] * (neuron.z > 0 ? 1 : 0);
		return { delta, weights: [delta * inputs[0], delta * inputs[1]] as [number, number], bias: delta };
	}) as [{ delta: number; weights: [number, number]; bias: number }, { delta: number; weights: [number, number]; bias: number }];
	return {
		hidden,
		output: { delta: outputDelta, weights: [outputDelta * forward.hidden[0].activation, outputDelta * forward.hidden[1].activation] as [number, number], bias: outputDelta }
	};
}

export function applyMlpGradient(network: MlpNetwork, gradients: ReturnType<typeof calculateMlpBackward>, rate: number): MlpNetwork {
	return {
		hidden: network.hidden.map((neuron, index) => ({
			weights: [neuron.weights[0] - rate * gradients.hidden[index].weights[0], neuron.weights[1] - rate * gradients.hidden[index].weights[1]] as [number, number],
			bias: neuron.bias - rate * gradients.hidden[index].bias
		})) as [MlpNeuron, MlpNeuron],
		output: {
			weights: [network.output.weights[0] - rate * gradients.output.weights[0], network.output.weights[1] - rate * gradients.output.weights[1]],
			bias: network.output.bias - rate * gradients.output.bias
		}
	};
}

export const MLP_LAB_FIRST = calculateMlpForward(MLP_LAB_CASE.network, MLP_LAB_CASE.inputs, MLP_LAB_CASE.target);
export const MLP_LAB_BACKWARD = calculateMlpBackward(MLP_LAB_CASE.network, MLP_LAB_CASE.inputs, MLP_LAB_FIRST);
export const MLP_LAB_UPDATED = applyMlpGradient(MLP_LAB_CASE.network, MLP_LAB_BACKWARD, MLP_LAB_CASE.learningRate);
export const MLP_LAB_SECOND = calculateMlpForward(MLP_LAB_UPDATED, MLP_LAB_CASE.inputs, MLP_LAB_CASE.target);

type LabField = { key: string; stage: number; label: string; expected: number; hint: string };
function field(key: string, stage: number, label: string, expected: number, hint: string): LabField {
	return { key: `mlp2_${key}`, stage, label, expected, hint };
}

export const MLP_LAB_FIELDS: LabField[] = [
	field('zH1', 0, 'z₁ = w₁₁x₁ + w₁₂x₂ + b₁', MLP_LAB_FIRST.hidden[0].z, 'Sustituye los dos pesos que llegan a h₁ y suma su sesgo.'),
	field('aH1', 0, 'a₁ = ReLU(z₁)', MLP_LAB_FIRST.hidden[0].activation, 'ReLU(z) = max(0, z).'),
	field('zH2', 0, 'z₂ = w₂₁x₁ + w₂₂x₂ + b₂', MLP_LAB_FIRST.hidden[1].z, 'Sustituye los pesos que llegan a h₂.'),
	field('aH2', 0, 'a₂ = ReLU(z₂)', MLP_LAB_FIRST.hidden[1].activation, 'ReLU conserva el valor si es positivo.'),
	field('prediction', 1, 'ŷ = v₁a₁ + v₂a₂ + bₒ', MLP_LAB_FIRST.prediction, 'La salida es lineal: no aplicamos ReLU aquí.'),
	field('loss', 1, 'L = ½(ŷ − y)²', MLP_LAB_FIRST.loss, 'Primero calcula el error ŷ − y y luego toma la mitad de su cuadrado.'),
	field('deltaOutput', 2, 'Señal de salida = ŷ − y', MLP_LAB_BACKWARD.output.delta, `Resta el objetivo a la predicción: ${MLP_LAB_FIRST.prediction} − ${MLP_LAB_CASE.target}.`),
	field('gradOutW1', 2, 'Factor para v₁ = señal de salida × a₁', MLP_LAB_BACKWARD.output.weights[0], 'Multiplica la señal de salida por lo que aportó h₁.'),
	field('gradOutW2', 2, 'Factor para v₂ = señal de salida × a₂', MLP_LAB_BACKWARD.output.weights[1], 'Multiplica la señal de salida por lo que aportó h₂.'),
	field('gradOutBias', 2, 'Factor para bₒ = señal de salida × 1', MLP_LAB_BACKWARD.output.bias, 'El sesgo entra directamente: multiplica la señal por 1.'),
	field('deltaH1', 3, 'Señal de h₁ = señal de salida × v₁ × puerta ReLU', MLP_LAB_BACKWARD.hidden[0].delta, 'Usa el peso ORIGINAL v₁. La puerta ReLU vale 1 porque z₁ es positivo.'),
	field('deltaH2', 3, 'Señal de h₂ = señal de salida × v₂ × puerta ReLU', MLP_LAB_BACKWARD.hidden[1].delta, 'Usa el peso ORIGINAL v₂. La puerta ReLU vale 1 porque z₂ es positivo.'),
	field('gradH1W1', 3, 'Factor para w₁₁ = señal de h₁ × x₁', MLP_LAB_BACKWARD.hidden[0].weights[0], 'Multiplica la señal de h₁ por la primera entrada.'),
	field('gradH1W2', 3, 'Factor para w₁₂ = señal de h₁ × x₂', MLP_LAB_BACKWARD.hidden[0].weights[1], 'Multiplica la señal de h₁ por la segunda entrada.'),
	field('gradH1Bias', 3, 'Factor para b₁ = señal de h₁ × 1', MLP_LAB_BACKWARD.hidden[0].bias, 'Para el sesgo de h₁, multiplica su señal por 1.'),
	field('gradH2W1', 3, 'Factor para w₂₁ = señal de h₂ × x₁', MLP_LAB_BACKWARD.hidden[1].weights[0], 'Multiplica la señal de h₂ por la primera entrada.'),
	field('gradH2W2', 3, 'Factor para w₂₂ = señal de h₂ × x₂', MLP_LAB_BACKWARD.hidden[1].weights[1], 'Multiplica la señal de h₂ por la segunda entrada.'),
	field('gradH2Bias', 3, 'Factor para b₂ = señal de h₂ × 1', MLP_LAB_BACKWARD.hidden[1].bias, 'Para el sesgo de h₂, multiplica su señal por 1.'),
	field('updatedH1W1', 4, 'w₁₁ nuevo = w₁₁ − η × factor para w₁₁', MLP_LAB_UPDATED.hidden[0].weights[0], 'Usa el factor que ya calculaste y η = 0.05.'),
	field('updatedOutW1', 4, 'v₁ nuevo = v₁ − η × factor para v₁', MLP_LAB_UPDATED.output.weights[0], 'Aplica la misma regla al primer peso de salida.'),
	field('secondZH1', 5, 'Nuevo z₁ con todos los parámetros actualizados', MLP_LAB_SECOND.hidden[0].z, 'Usa los dos pesos y el sesgo nuevos de h₁.'),
	field('secondZH2', 5, 'Nuevo z₂ con todos los parámetros actualizados', MLP_LAB_SECOND.hidden[1].z, 'Usa los dos pesos y el sesgo nuevos de h₂.'),
	field('secondPrediction', 5, 'Nueva predicción ŷ', MLP_LAB_SECOND.prediction, 'Aplica ReLU a los nuevos z y usa v₁, v₂ y bₒ nuevos.'),
	field('secondLoss', 5, 'Nueva pérdida L = ½(ŷ − y)²', MLP_LAB_SECOND.loss, 'Calcula con la nueva predicción y el mismo y. Puedes escribir hasta cinco decimales.')
];

// Students work one representative path; the parallel path stays visible as a worked example.
const requiredKeys = new Set([
	'zH1', 'aH1', 'prediction', 'loss', 'deltaOutput', 'gradOutW1',
	'deltaH1', 'gradH1W1', 'updatedH1W1', 'updatedOutW1',
	'secondZH1', 'secondPrediction', 'secondLoss'
].map((key) => `mlp2_${key}`));
export const MLP_LAB_REQUIRED_FIELDS = MLP_LAB_FIELDS.filter((item) => requiredKeys.has(item.key));

export function deriveMlpLabProgress(answers: Record<string, string>) {
	const confirmed = Object.fromEntries(MLP_LAB_FIELDS.map((item) => [item.key.slice(5), false])) as Record<string, boolean>;
	let completedStages = 0;
	for (let stage = 0; stage < 6; stage += 1) {
		const required = MLP_LAB_REQUIRED_FIELDS.filter((item) => item.stage === stage);
		for (const item of required) confirmed[item.key.slice(5)] = isNumericAnswerCorrect(answers[item.key] ?? '', item.expected);
		if (!required.every((item) => confirmed[item.key.slice(5)])) break;
		for (const item of MLP_LAB_FIELDS.filter((item) => item.stage === stage)) confirmed[item.key.slice(5)] = true;
		completedStages += 1;
	}
	return { confirmed, completedStages, first: MLP_LAB_FIRST, backward: MLP_LAB_BACKWARD, updated: MLP_LAB_UPDATED, second: MLP_LAB_SECOND };
}

export function isMlpLabValueVisible(progress: ReturnType<typeof deriveMlpLabProgress>, key: string, stage: number, manual: boolean, step: number) {
	return !!progress.confirmed[key] && progress.completedStages >= stage - 1 && (!manual || step >= stage);
}
