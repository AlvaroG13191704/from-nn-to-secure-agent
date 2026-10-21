<script lang="ts">
	import { activationCurvePath, activationPlotAxes, mapActivationPoint, type ActivationName } from '#lib/domain/activation-functions.js';

	const activations: Array<{ id: ActivationName; name: string; formula: string; range: string; meaning: string }> = [
		{ id: 'step', name: 'Escalón', formula: 'f(z) = 0 si z < 0; 1 si z ≥ 0', range: '{0, 1}', meaning: 'Toma una decisión binaria. El cero se clasifica como 1.' },
		{ id: 'sigmoid', name: 'Sigmoide', formula: 'σ(z) = 1 / (1 + e⁻ᶻ)', range: '(0, 1)', meaning: 'Comprime cualquier entrada a un valor entre 0 y 1; en z = 0 vale 0.5.' },
		{ id: 'tanh', name: 'Tangente hiperbólica', formula: 'tanh(z)', range: '(−1, 1)', meaning: 'Conserva el signo y comprime la salida entre −1 y 1; en z = 0 vale 0.' },
		{ id: 'relu', name: 'ReLU', formula: 'max(0, z)', range: '[0, ∞)', meaning: 'Anula las entradas negativas y deja pasar las positivas; en cero devuelve 0.' }
	];

	let input = $state(0);
	const sampleInputs = [
		{ label: 'Entrada negativa', value: -2 },
		{ label: 'Cero', value: 0 },
		{ label: 'Entrada positiva', value: 2 }
	];

	function format(value: number) {
		return Number(value.toFixed(3)).toString();
	}
</script>

<section class="activation-explorer" aria-labelledby="activation-title">
	<p class="stage-label">Una pausa visual antes de las capas</p>
	<h3 id="activation-title">La activación transforma la suma ponderada</h3>
	<p>Primero la neurona calcula <var>z = wᵀx + b</var>; después aplica una función a ese resultado. Si apiláramos solo transformaciones lineales, seguiríamos teniendo una transformación lineal. La no linealidad permite que varias capas representen fronteras y patrones más complejos.</p>
	<p class="control-label">Mueve la entrada z y observa el punto en las cuatro gráficas:</p>
	<label class="input-control" for="activation-input">
		<span>Entrada z: <strong>{format(input)}</strong></span>
		<input id="activation-input" type="range" min="-5" max="5" step="0.1" bind:value={input} aria-describedby="activation-hint" />
		<span class="range-labels"><span>−5 · negativa</span><span>0</span><span>5 · positiva</span></span>
	</label>
	<p id="activation-hint" class="sr-only">Usa las flechas para cambiar z de menos cinco a cinco. También puedes seleccionar una muestra negativa, cero o positiva.</p>
	<div class="sample-controls" role="group" aria-label="Ejemplos de entrada">
		{#each sampleInputs as sample (sample.value)}
			<button class:active={input === sample.value} type="button" aria-pressed={input === sample.value} onclick={() => input = sample.value}>{sample.label} ({sample.value})</button>
		{/each}
	</div>
	<div class="activation-grid">
		{#each activations as activation (activation.id)}
			{@const point = mapActivationPoint(activation.id, input)}
			{@const axes = activationPlotAxes(activation.id)}
			<article class="activation-card" aria-labelledby={`activation-${activation.id}`}>
				<div class="activation-heading"><h4 id={`activation-${activation.id}`}>{activation.name}</h4><code>{activation.formula}</code></div>
				<svg class="activation-plot" viewBox="0 0 420 220" role="img" aria-labelledby={`plot-title-${activation.id} plot-desc-${activation.id}`}>
					<title id={`plot-title-${activation.id}`}>Gráfica de {activation.name}</title>
					<desc id={`plot-desc-${activation.id}`}>La curva de {activation.name} muestra la salida {format(point.value)} para la entrada z igual a {format(input)}.</desc>
					<path d={`M 40 ${axes.zeroY} H 380`} class="axis" />
					<path d="M 210 20 V 180" class="zero-axis" />
					<path d={`M ${point.x} 20 V 180`} class="marker-line" />
					<path d={activationCurvePath(activation.id)} class="curve" />
					<circle cx={point.x} cy={point.y} r="7" class="marker" />
					{#if activation.id === 'step'}
						<circle cx="210" cy="180" r="6" class="step-endpoint-open" aria-label="z igual a cero, salida cero, extremo abierto" />
						<circle cx="210" cy="20" r="6" class="step-endpoint-closed" aria-label="z igual a cero, salida uno, extremo cerrado" />
					{/if}
					<text x="34" y="205" class="axis-label">−5</text><text x="205" y="205" class="axis-label">0</text><text x="371" y="205" class="axis-label">5</text>
					{#each axes.labels as label (label.value)}<text x="18" y={label.y + 4} class="axis-label">{label.value}</text>{/each}
				</svg>
				<p class="range">Rango: <code>{activation.range}</code></p>
				<p class="meaning">{activation.meaning}</p>
				<p class="output" aria-live="polite">Con z = <strong>{format(input)}</strong>, la salida es <strong>{format(point.value)}</strong>.</p>
			</article>
		{/each}
	</div>
</section>

<style>
	.activation-explorer { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #cbd5e1; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	.activation-explorer h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	.activation-explorer > p:not(.stage-label) { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.control-label { margin-bottom: .5rem; font-weight: 750; }
	.input-control { display: grid; gap: .35rem; max-width: 46rem; color: #24364b; }
	.input-control input { width: 100%; accent-color: #0f766e; }
	.range-labels { display: flex; justify-content: space-between; color: #52627a; font-size: .82rem; }
	.sample-controls { display: flex; flex-wrap: wrap; gap: .5rem; margin: .8rem 0 1rem; }
	.sample-controls button { min-height: 2.5rem; padding: .45rem .75rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #24364b; font: inherit; font-size: .9rem; font-weight: 700; cursor: pointer; }
	.sample-controls button.active { border-color: #0f766e; background: #ccfbf1; color: #134e4a; }
	.sample-controls button:focus-visible, .input-control input:focus-visible { outline: 3px solid #99f6e4; outline-offset: 3px; }
	.activation-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem; }
	.activation-card { min-width: 0; padding: .9rem; border: 1px solid #dbe4ee; border-radius: .8rem; background: white; }
	.activation-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .35rem .75rem; }
	.activation-heading h4 { margin: 0; color: #17253a; font-size: 1.08rem; }
	.activation-heading code { color: #334155; font-size: .88rem; }
	.activation-plot { display: block; width: 100%; margin: .45rem 0; overflow: visible; }
	.axis { stroke: #94a3b8; stroke-width: 1.5; }
	.zero-axis { stroke: #dbe4ee; stroke-width: 1; stroke-dasharray: 4 5; }
	.curve { fill: none; stroke: #1d4ed8; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
	.step-endpoint-open { fill: white; stroke: #1d4ed8; stroke-width: 3; }
	.step-endpoint-closed { fill: #1d4ed8; stroke: white; stroke-width: 1.5; }
	.marker-line { stroke: #0f766e; stroke-width: 1.5; stroke-dasharray: 4 4; transition: d .16s ease-out; }
	.marker { fill: #f97316; stroke: white; stroke-width: 3; transition: cx .16s ease-out, cy .16s ease-out; }
	.axis-label { fill: #52627a; font-size: 12px; }
	.range, .meaning, .output { margin: .35rem 0; color: #52627a; line-height: 1.45; }
	.range code { color: #17253a; font-weight: 750; }
	.output { padding: .55rem .65rem; border-radius: .55rem; background: #f0fdfa; color: #134e4a; }
	.output strong { font-variant-numeric: tabular-nums; }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
	@media (max-width: 700px) { .activation-grid { grid-template-columns: 1fr; } .activation-card { padding: .7rem; } }
	@media (prefers-reduced-motion: reduce) { .marker-line, .marker { transition: none; } }
</style>
