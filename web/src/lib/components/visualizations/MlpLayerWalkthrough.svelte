<script lang="ts">
	import { formatNumber as fmt } from './format-number.js';
	import StepControls from './StepControls.svelte';

	// Same layer as calculateMlpFirstSample: each column [w from x₁, w from x₂, bias] is one neuron.
	const x = [1, 2];
	const secondSample = [0, 1];
	const neurons = [
		{ w: [1, 2], b: 0, color: '#1f4fd1' },
		{ w: [-1, 1], b: 1, color: '#0f6b5e' },
		{ w: [2, 0], b: -1, color: '#b7791f' }
	];
	const zOf = (input: number[]) => neurons.map((n) => n.w[0] * input[0] + n.w[1] * input[1] + n.b);
	const z = zOf(x);
	const h = z.map((value) => Math.max(0, value));
	const z2 = zOf(secondSample);
	const h2 = z2.map((value) => Math.max(0, value));
	const par = (value: number) => (value < 0 ? `(${fmt(value)})` : fmt(value));
	const sub = ['₁', '₂', '₃'];

	const steps = [
		{ title: 'Dos entradas, tres neuronas', general: 'x = (x₁, x₂) = (1, 2)', worked: [], note: 'La capa oculta es un equipo: tres perceptrones como el de 2.3, uno al lado del otro. Cada neurona mira las mismas dos entradas, pero con sus propios pesos y su propio sesgo.' },
		...neurons.map((n, i) => ({
			title: `Neurona ${i + 1}: el mismo cálculo de 2.3`,
			general: `z${sub[i]} = w·x₁ + w·x₂ + b,   h${sub[i]} = ReLU(z${sub[i]})`,
			worked: [`z${sub[i]} = ${par(n.w[0])} × 1 + ${par(n.w[1])} × 2 + ${par(n.b)} = ${fmt(z[i])}`, `h${sub[i]} = ReLU(${fmt(z[i])}) = ${fmt(h[i])}`],
			note: i === 0 ? 'Multiplico cada entrada por su peso, sumo el sesgo y aplico la activación.' : i === 1 ? 'Con otros pesos, la misma entrada produce otro número: esta neurona “se fija” en otra cosa.' : 'Tres neuronas, tres respuestas distintas a la misma entrada.'
		})),
		{ title: 'Las tres a la vez: una multiplicación de matrices', general: 'z = x · W + b', worked: [`[1  2] × W + [0  1  −1] = [${z.map(fmt).join('  ')}]`], note: 'Guardo los pesos en una tabla W. Cada columna es una neurona. Multiplicar x por W hace los tres cálculos anteriores en una sola operación.' },
		{ title: 'La capa convierte un vector en otro', general: 'h = ReLU(x · W + b)', worked: [`(1, 2)  →  (${h.map(fmt).join(', ')})`], note: 'Entraron 2 números y salieron 3. Eso hace una capa: transforma un vector en otro. La siguiente capa recibe h como si fuera su entrada.' },
		{ title: 'Con un lote de dos muestras', general: 'H = ReLU(X · W + b)   (2×2) · (2×3) + (1×3) → (2×3)', worked: [`fila 1: x = (1, 2) → z = (${z.map(fmt).join(', ')}) → h = (${h.map(fmt).join(', ')})`, `fila 2: x = (0, 1) → z = (${z2.map(fmt).join(', ')}) → h = (${h2.map(fmt).join(', ')})`], note: 'Si apilo varias muestras como filas de X, la misma multiplicación procesa todas. El sesgo se suma a cada fila. En la segunda fila, z₃ = −1 y ReLU lo convierte en 0: esa neurona no se activa.' }
	];

	let step = $state(0);
	const current = $derived(steps[step]);
	const neuronShown = (index: number) => step >= index + 1;
	const activeNeuron = $derived(step >= 1 && step <= 3 ? step - 1 : -1);
	const matrixView = $derived(step >= 4);
	const inputY = [110, 230];
	const neuronY = [70, 170, 270];
</script>

<div class="mlp-walk">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the SVG on narrow screens.) -->
	<div class="diagram-scroll" role="region" tabindex="0" aria-label="Capa oculta con tres neuronas; en pantallas pequeñas, desplázate horizontalmente">
		<svg viewBox="0 0 640 340" role="img" aria-labelledby="mlp-walk-title mlp-walk-desc">
			<title id="mlp-walk-title">Dos entradas conectadas con tres neuronas ocultas</title>
			<desc id="mlp-walk-desc">{current.title}. {current.worked.join(' ')}</desc>
			<g fill="#4a5873" font-size="15" font-weight="700" text-anchor="middle"><text x="90" y="28">Entradas</text><text x="400" y="28">Capa oculta</text><text x="575" y="28">Salida de la capa</text></g>
			{#each neurons as neuron, i (i)}
				{#each inputY as y, j (j)}
					<line class="edge" class:lit={activeNeuron === i || matrixView} x1="125" y1={y} x2="345" y2={neuronY[i]} stroke={neuron.color} />
				{/each}
				{#if activeNeuron === i}
					<g class="weight-tags" font-size="15" font-weight="700" fill={neuron.color}>
						<text x="215" y={inputY[0] + (neuronY[i] - inputY[0]) * 0.4 - 8}>w = {fmt(neuron.w[0])}</text>
						<text x="215" y={inputY[1] + (neuronY[i] - inputY[1]) * 0.4 + 20}>w = {fmt(neuron.w[1])}</text>
					</g>
				{/if}
			{/each}
			{#each inputY as y, j (j)}
				<circle cx="90" cy={y} r="35" fill="#fff" stroke="#14213d" stroke-width="2.5" />
				<text x="90" y={y + 7} text-anchor="middle" font-size="19" font-weight="700" fill="#14213d">x{sub[j]} = {x[j]}</text>
			{/each}
			{#each neurons as neuron, i (i)}
				<g class="neuron" class:active={activeNeuron === i}>
					<rect x="345" y={neuronY[i] - 36} width="130" height="72" rx="10" fill={neuronShown(i) ? '#fff' : '#f7f8fa'} stroke={neuron.color} stroke-width={activeNeuron === i ? 4 : 2.5} />
					<text x="410" y={neuronY[i] - 8} text-anchor="middle" font-size="17" font-weight="700" fill="#14213d">z{sub[i]} = {neuronShown(i) ? fmt(z[i]) : '?'}</text>
					<text x="410" y={neuronY[i] + 20} text-anchor="middle" font-size="15" font-weight="700" fill="#4a5873">b = {fmt(neuron.b)}</text>
					<line x1="475" y1={neuronY[i]} x2="530" y2={neuronY[i]} stroke={neuron.color} stroke-width="2.5" />
					<text x="575" y={neuronY[i] + 7} text-anchor="middle" font-size="19" font-weight="700" fill={neuron.color}>h{sub[i]} = {neuronShown(i) ? fmt(h[i]) : '?'}</text>
				</g>
			{/each}
		</svg>
	</div>

	{#if matrixView}
		<div class="matrix-row" aria-label="La capa como multiplicación de matrices">
			<div class="matrix"><span class="matrix__label">x (1×2)</span><table><tbody><tr><td>1</td><td>2</td></tr></tbody></table></div>
			<span class="op">×</span>
			<div class="matrix"><span class="matrix__label">W (2×3): una columna por neurona</span>
				<table><tbody>
					{#each [0, 1] as row (row)}
						<tr>{#each neurons as neuron, i (i)}<td style:color={neuron.color}>{fmt(neuron.w[row])}</td>{/each}</tr>
					{/each}
				</tbody></table>
			</div>
			<span class="op">+</span>
			<div class="matrix"><span class="matrix__label">b (1×3)</span><table><tbody><tr>{#each neurons as neuron, i (i)}<td style:color={neuron.color}>{fmt(neuron.b)}</td>{/each}</tr></tbody></table></div>
			<span class="op">=</span>
			<div class="matrix"><span class="matrix__label">z (1×3)</span><table><tbody><tr>{#each z as value, i (i)}<td style:color={neurons[i].color}>{fmt(value)}</td>{/each}</tr></tbody></table></div>
		</div>
	{/if}

	<div class="board" aria-live="polite">
		<p class="board__title"><strong>Paso {step + 1} de {steps.length}.</strong> {current.title}</p>
		<p class="board__general">{current.general}</p>
		{#each current.worked as line, index (index)}<p class="board__worked">{line}</p>{/each}
		<p class="board__note">{current.note}</p>
	</div>

	<StepControls bind:step total={steps.length} label="Controles de la capa oculta" />
</div>

<style>
	.mlp-walk { display: grid; gap: 0.9rem; }
	.diagram-scroll { overflow-x: auto; overscroll-behavior-inline: contain; }
	.diagram-scroll:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	svg { display: block; width: 100%; height: auto; font-family: var(--font-sans); }
	.edge { stroke-width: 2; opacity: 0.25; transition: opacity 0.3s ease, stroke-width 0.3s ease; }
	.edge.lit { stroke-width: 3.5; opacity: 1; }
	.weight-tags text { paint-order: stroke; stroke: #fff; stroke-width: 4px; stroke-linejoin: round; }

	.matrix-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 0.9rem; padding: 0.8rem 1rem; border: 1px solid var(--color-line); border-radius: 0.4rem; background: #fbfcfe; }
	.matrix { display: grid; gap: 0.25rem; }
	.matrix__label { color: var(--color-muted); font-size: 0.8rem; font-weight: 700; }
	.matrix table { border-collapse: collapse; border-left: 2px solid var(--color-ink); border-right: 2px solid var(--color-ink); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.1rem; font-weight: 800; }
	.matrix td { min-width: 2.4rem; padding: 0.2rem 0.5rem; text-align: center; }
	.op { color: var(--color-muted); font-size: 1.4rem; font-weight: 700; }

	.board { min-height: 10rem; padding: 0.9rem 1.1rem; border-left: 4px solid var(--color-primary); border-radius: 0.3rem; background: #f3f6fd; }
	.board p { margin: 0; }
	.board__general { margin-top: 0.45rem !important; color: var(--color-muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; overflow-wrap: anywhere; }
	.board__worked { margin-top: 0.2rem !important; color: #17349a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(0.95rem, 1.4vw, 1.15rem); font-weight: 800; overflow-wrap: anywhere; }
	.board__note { margin-top: 0.55rem !important; color: var(--color-muted); line-height: 1.5; }
	@media (max-width: 700px) { svg { min-width: 560px; } }
	@media (prefers-reduced-motion: reduce) { .edge { transition: none; } }
</style>
