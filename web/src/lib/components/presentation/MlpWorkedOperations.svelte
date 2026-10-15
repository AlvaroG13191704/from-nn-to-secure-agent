<script lang="ts">
	import { MLP_LAB_BACKWARD as backward, MLP_LAB_CASE as sample, MLP_LAB_FIRST as first, MLP_LAB_SECOND as second, MLP_LAB_UPDATED as updated } from '#lib/domain/mlp-lab.js';

	let { stage }: { stage: number } = $props();
	const fmt = (value: number) => Number(value.toFixed(5)).toString();
	const [x1, x2] = sample.inputs;
	const [h1, h2] = sample.network.hidden;
	const [a1, a2] = first.hidden.map((neuron) => neuron.activation);
	const [v1, v2] = sample.network.output.weights;
	const [newH1, newH2] = updated.hidden;
	const [newV1, newV2] = updated.output.weights;
	type Operation = { title: string; origin: 'manual' | 'guided'; lines: string[] };
	const operations: Operation[][] = [
		[
			{ title: 'Neurona h₁', origin: 'manual', lines: [
				`z₁ = (${fmt(h1.weights[0])} × ${x1}) + (${fmt(h1.weights[1])} × ${x2}) + ${fmt(h1.bias)} = ${fmt(first.hidden[0].z)}`,
				`a₁ = ReLU(${fmt(first.hidden[0].z)}) = ${fmt(a1)}`
			] },
			{ title: 'Neurona h₂', origin: 'guided', lines: [
				`z₂ = (${fmt(h2.weights[0])} × ${x1}) + (${fmt(h2.weights[1])} × ${x2}) + ${fmt(h2.bias)} = ${fmt(first.hidden[1].z)}`,
				`a₂ = ReLU(${fmt(first.hidden[1].z)}) = ${fmt(a2)}`
			] }
		],
		[
			{ title: 'Predicción', origin: 'manual', lines: [
				`ŷ = (${fmt(v1)} × ${fmt(a1)}) + (${fmt(v2)} × ${fmt(a2)}) + ${fmt(sample.network.output.bias)} = ${fmt(first.prediction)}`
			] },
			{ title: 'Error y pérdida', origin: 'manual', lines: [
				`error = ${fmt(first.prediction)} − ${fmt(sample.target)} = ${fmt(first.error)}`,
				`L = ½ × (${fmt(first.error)})² = ${fmt(first.loss)}`
			] }
		],
		[
			{ title: 'Señal que regresa', origin: 'manual', lines: [
				`señal de salida = ${fmt(first.prediction)} − ${fmt(sample.target)} = ${fmt(backward.output.delta)}`,
				`factor(v₁) = ${fmt(backward.output.delta)} × ${fmt(a1)} = ${fmt(backward.output.weights[0])}`
			] },
			{ title: 'Misma regla en la otra conexión y el sesgo', origin: 'guided', lines: [
				`factor(v₂) = ${fmt(backward.output.delta)} × ${fmt(a2)} = ${fmt(backward.output.weights[1])}`,
				`factor(bₒ) = ${fmt(backward.output.delta)} × 1 = ${fmt(backward.output.bias)}`
			] }
		],
		[
			{ title: 'Rama h₁', origin: 'manual', lines: [
				`señal(h₁) = ${fmt(backward.output.delta)} × ${fmt(v1)} × 1 = ${fmt(backward.hidden[0].delta)}`,
				`factor(w₁₁) = ${fmt(backward.hidden[0].delta)} × ${x1} = ${fmt(backward.hidden[0].weights[0])}`
			] },
			{ title: 'Otros parámetros de h₁', origin: 'guided', lines: [
				`factor(w₁₂) = ${fmt(backward.hidden[0].delta)} × ${x2} = ${fmt(backward.hidden[0].weights[1])}`,
				`factor(b₁) = ${fmt(backward.hidden[0].delta)} × 1 = ${fmt(backward.hidden[0].bias)}`
			] },
			{ title: 'Rama h₂ con la misma regla', origin: 'guided', lines: [
				`señal(h₂) = ${fmt(backward.output.delta)} × ${fmt(v2)} × 1 = ${fmt(backward.hidden[1].delta)}`,
				`factor(w₂₁) = ${fmt(backward.hidden[1].delta)} × ${x1} = ${fmt(backward.hidden[1].weights[0])}`,
				`factor(w₂₂) = ${fmt(backward.hidden[1].delta)} × ${x2} = ${fmt(backward.hidden[1].weights[1])}`,
				`factor(b₂) = ${fmt(backward.hidden[1].delta)} × 1 = ${fmt(backward.hidden[1].bias)}`
			] }
		],
		[
			{ title: 'Los dos pesos que calculaste', origin: 'manual', lines: [
				`w₁₁ nuevo = ${fmt(h1.weights[0])} − ${fmt(sample.learningRate)} × (${fmt(backward.hidden[0].weights[0])}) = ${fmt(newH1.weights[0])}`,
				`v₁ nuevo = ${fmt(v1)} − ${fmt(sample.learningRate)} × (${fmt(backward.output.weights[0])}) = ${fmt(newV1)}`
			] },
			{ title: 'Otros valores de h₁ y h₂', origin: 'guided', lines: [
				`w₁₂ = ${fmt(h1.weights[1])} − ${fmt(sample.learningRate)} × (${fmt(backward.hidden[0].weights[1])}) = ${fmt(newH1.weights[1])}; b₁ = ${fmt(h1.bias)} − ${fmt(sample.learningRate)} × (${fmt(backward.hidden[0].bias)}) = ${fmt(newH1.bias)}`,
				`w₂₁ = ${fmt(h2.weights[0])} − ${fmt(sample.learningRate)} × (${fmt(backward.hidden[1].weights[0])}) = ${fmt(newH2.weights[0])}`,
				`w₂₂ = ${fmt(h2.weights[1])} − ${fmt(sample.learningRate)} × (${fmt(backward.hidden[1].weights[1])}) = ${fmt(newH2.weights[1])}; b₂ = ${fmt(h2.bias)} − ${fmt(sample.learningRate)} × (${fmt(backward.hidden[1].bias)}) = ${fmt(newH2.bias)}`
			] },
			{ title: 'Otros valores de la salida', origin: 'guided', lines: [
				`v₂ = ${fmt(v2)} − ${fmt(sample.learningRate)} × (${fmt(backward.output.weights[1])}) = ${fmt(newV2)}`,
				`bₒ = ${fmt(sample.network.output.bias)} − ${fmt(sample.learningRate)} × (${fmt(backward.output.bias)}) = ${fmt(updated.output.bias)}`
			] }
		],
		[
			{ title: 'Nuevas activaciones', origin: 'manual', lines: [
				`z₁ = (${fmt(newH1.weights[0])} × ${x1}) + (${fmt(newH1.weights[1])} × ${x2}) + ${fmt(newH1.bias)} = ${fmt(second.hidden[0].z)}`,
				`a₁ = ReLU(${fmt(second.hidden[0].z)}) = ${fmt(second.hidden[0].activation)}`
			] },
			{ title: 'La otra rama, ya resuelta', origin: 'guided', lines: [
				`z₂ = (${fmt(newH2.weights[0])} × ${x1}) + (${fmt(newH2.weights[1])} × ${x2}) + ${fmt(newH2.bias)} = ${fmt(second.hidden[1].z)}`,
				`a₂ = ReLU(${fmt(second.hidden[1].z)}) = ${fmt(second.hidden[1].activation)}`
			] },
			{ title: 'Nueva predicción y pérdida', origin: 'manual', lines: [
				`ŷ = (${fmt(newV1)} × ${fmt(second.hidden[0].activation)}) + (${fmt(newV2)} × ${fmt(second.hidden[1].activation)}) + ${fmt(updated.output.bias)} = ${fmt(second.prediction)}`,
				`L = ½ × (${fmt(second.prediction)} − ${fmt(sample.target)})² = ${fmt(second.loss)}`
			] }
		]
	];
</script>

<div class="worked" aria-label="Operaciones confirmadas por tus respuestas">
	<div class="worked-heading"><strong>Operaciones confirmadas</strong><span>{stage === 0 ? 'Sin respuestas todavía' : `Paso ${stage} de 6`}</span></div>
	{#if stage === 0}
		<p class="empty">Resuelve la primera rama. Cuando la compruebes, verás ambos cálculos con números.</p>
	{:else}
		<ol aria-live="polite">
			{#each operations[stage - 1] as operation}
				<li class:guided={operation.origin === 'guided'}>
					<div class="operation-heading"><strong>{operation.title}</strong><span>{operation.origin === 'manual' ? 'Tu cálculo' : 'Misma regla · resuelto'}</span></div>
					{#each operation.lines as line}<p>{line}</p>{/each}
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	.worked { margin-top:.85rem; padding:1rem; border:1px solid #bfdbfe; border-radius:.8rem; background:#fff; }
	.worked-heading, .operation-heading { display:flex; align-items:baseline; justify-content:space-between; gap:.7rem; }
	.worked-heading { color:#17253a; }
	.worked-heading span, .operation-heading span { color:#52627a; font-size:.72rem; font-weight:750; white-space:nowrap; }
	.empty { margin:.65rem 0 0; color:#52627a; line-height:1.5; }
	ol { display:grid; gap:.6rem; margin:.75rem 0 0; padding:0; list-style:none; }
	li { min-width:0; padding:.65rem .75rem; border-left:3px solid #2563eb; border-radius:.35rem; background:#eff6ff; }
	li.guided { border-left-color:#0f766e; background:#f0fdfa; }
	.operation-heading strong { color:#17324a; font-size:.9rem; }
	li p { margin:.35rem 0 0; color:#24364b; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:clamp(.82rem,1.2vw,.94rem); line-height:1.45; overflow-wrap:anywhere; }
	@media (max-width:600px) { .worked-heading, .operation-heading { align-items:flex-start; flex-wrap:wrap; } }
</style>
