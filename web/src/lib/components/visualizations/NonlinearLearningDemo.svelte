<script lang="ts">
	import { onMount } from 'svelte';
	import { XOR_POINTS, buildLearningSnapshots, evaluateModel, predictClassProbability, type HiddenActivation, type TinyNetwork } from '#lib/domain/nonlinear-learning.js';

	const snapshots = buildLearningSnapshots();
	const gridSize = 28;
	const cellSize = 280 / gridSize;
	const cells = Array.from({ length: gridSize * gridSize }, (_, index) => {
		const column = index % gridSize;
		const row = Math.floor(index / gridSize);
		return { left: 36 + column * cellSize, top: 36 + row * cellSize, x: -1.05 + ((column + 0.5) / gridSize) * 2.1, y: 1.05 - ((row + 0.5) / gridSize) * 2.1 };
	});

	let frame = $state(0);
	let playing = $state(false);
	let reducedMotion = $state(false);
	let timer: ReturnType<typeof setInterval> | undefined;
	const snapshot = $derived(snapshots[frame]);
	const linearMetrics = $derived(evaluateModel(snapshot.identity, XOR_POINTS, 'identity'));
	const nonlinearMetrics = $derived(evaluateModel(snapshot.tanh, XOR_POINTS, 'tanh'));
	const linearCells = $derived(decisionCells(snapshot.identity, 'identity'));
	const nonlinearCells = $derived(decisionCells(snapshot.tanh, 'tanh'));

	function decisionCells(network: TinyNetwork, activation: HiddenActivation) {
		return cells.map((cell) => {
			const probability = predictClassProbability(network, cell.x, cell.y, activation);
			return { ...cell, fill: probability >= 0.5 ? '#6ee7d2' : '#fda4af', opacity: 0.42 + Math.abs(probability - 0.5) * 0.74 };
		});
	}

	function plotX(x: number) { return 36 + ((x + 1.05) / 2.1) * 280; }
	function plotY(y: number) { return 36 + ((1.05 - y) / 2.1) * 280; }

	function stop() {
		if (timer !== undefined) clearInterval(timer);
		timer = undefined;
		playing = false;
	}

	function next() {
		frame = Math.min(snapshots.length - 1, frame + 1);
		if (frame === snapshots.length - 1) stop();
	}

	function play() {
		if (playing || reducedMotion) return;
		if (frame === snapshots.length - 1) frame = 0;
		playing = true;
		timer = setInterval(next, 850);
	}

	function reset() {
		stop();
		frame = 0;
	}

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const syncMotion = () => {
			reducedMotion = preference.matches;
			if (reducedMotion) stop();
		};
		syncMotion();
		preference.addEventListener('change', syncMotion);
		return () => { preference.removeEventListener('change', syncMotion); stop(); };
	});
</script>

{#snippet chart(title: string, mapCells: ReturnType<typeof decisionCells>)}
	<svg viewBox="0 0 352 352" role="img" aria-label={`${title}. Diez puntos de dos clases y una región de decisión aprendida en la época ${snapshot.epoch}.`}>
		<title>{title}: región de decisión en la época {snapshot.epoch}</title>
		<rect x="34" y="34" width="284" height="284" rx="10" fill="#fff" stroke="#94a3b8" stroke-width="2" />
		{#each mapCells as cell (`${cell.left}-${cell.top}`)}
			<rect class="decision-cell" x={cell.left} y={cell.top} width={cellSize + 0.2} height={cellSize + 0.2} fill={cell.fill} opacity={cell.opacity} />
		{/each}
		<path d="M176 36V316M36 176H316" fill="none" stroke="#475569" stroke-width="1.5" opacity=".7" />
		{#each XOR_POINTS as point, index (index)}
			{#if point.label === 1}
				<circle cx={plotX(point.x)} cy={plotY(point.y)} r="7" fill="#0f766e" stroke="#fff" stroke-width="2.5" />
			{:else}
				<rect x={plotX(point.x) - 7} y={plotY(point.y) - 7} width="14" height="14" rx="2" fill="#be123c" stroke="#fff" stroke-width="2.5" />
			{/if}
		{/each}
		<g fill="#475569" font-size="13" font-weight="700" font-family="ui-sans-serif,system-ui,sans-serif">
			<text x="317" y="337">x₁</text><text x="12" y="35">x₂</text>
		</g>
	</svg>
{/snippet}

<div class="learning-demo" aria-labelledby="learning-demo-title">
	<div class="heading">
		<div>
			<p class="kicker">Prueba interactiva · diez ejemplos</p>
			<h3 id="learning-demo-title">¿Qué cambia cuando una capa tiene activación?</h3>
		</div>
		<p>Voy a entrenar dos redes <strong>2 → 8 → 1</strong> con los mismos puntos y valores iniciales. Solo cambia la función de la capa oculta.</p>
	</div>
	<p class="legend"><span class="legend-teal">●</span> Clase A · <span class="legend-coral">■</span> Clase B. El color de fondo indica la clase que predice cada red.</p>
	<div class="comparison">
		<article class="model-card">
			<h4>Sin activación oculta <span>φ(z) = z</span></h4>
			{@render chart('Red sin activación oculta', linearCells)}
			<p><strong>{Math.round(linearMetrics.accuracy * 10)}/10</strong> puntos clasificados · pérdida {linearMetrics.loss.toFixed(3)}</p>
		</article>
		<article class="model-card nonlinear">
			<h4>Con activación oculta <span>φ(z) = tanh(z)</span></h4>
			{@render chart('Red con activación tanh', nonlinearCells)}
			<p><strong>{Math.round(nonlinearMetrics.accuracy * 10)}/10</strong> puntos clasificados · pérdida {nonlinearMetrics.loss.toFixed(3)}</p>
		</article>
	</div>
	<div class="controls" role="group" aria-label="Controles del entrenamiento">
		<button type="button" onclick={playing ? stop : play} disabled={reducedMotion} aria-pressed={playing}>{playing ? 'Pausar' : 'Entrenar automáticamente'}</button>
		<button class="secondary" type="button" onclick={next} disabled={frame === snapshots.length - 1}>Avanzar una etapa</button>
		<button class="secondary" type="button" onclick={reset} disabled={frame === 0}>Reiniciar</button>
		<label>Época {snapshot.epoch}<input type="range" min="0" max={snapshots.length - 1} step="1" value={frame} oninput={(event) => { stop(); frame = Number(event.currentTarget.value); }} aria-label="Recorrer etapas del entrenamiento" /></label>
	</div>
	<p class="explanation" aria-live="polite">{#if frame === 0}Antes de entrenar, ninguna red ha ajustado sus pesos a estos puntos.{:else if snapshot.epoch < 60}En cada época ambas redes modifican sus pesos para reducir el error. Observa cómo cambia la región de decisión.{:else}La red con tanh logró separar estos diez ejemplos; la red sin activación oculta sigue limitada a una frontera recta.{/if}</p>
	<p class="footnote">Las dos redes usan sigmoide en la salida. Sin una activación <em>oculta</em>, componer capas afines sigue dando una frontera lineal. Ajustarse a estos diez ejemplos no demuestra que el modelo generalice a datos nuevos. {#if reducedMotion}El movimiento automático está desactivado; usa “Avanzar una etapa” o el control de épocas.{/if}</p>
</div>

<style>
	.learning-demo { margin:1.6rem 0; padding:clamp(1rem,2.5vw,1.7rem); border:1px solid #cbd5e1; border-radius:1.15rem; background:linear-gradient(145deg,#f8fbff,#fff); }
	.heading { display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:.6rem 1.5rem; }
	.heading > div { flex:1 1 18rem; }
	.heading > p { flex:1 1 20rem; margin:.3rem 0; color:#334155; }
	.kicker { margin:0 0 .35rem; color:#0f766e; font-size:.76rem; font-weight:850; }
	h3 { margin:0; color:#17253a; font-size:clamp(1.35rem,2.4vw,2rem); }
	.legend { margin:.9rem 0 1rem; color:#334155; font-weight:650; }
	.legend-teal { color:#0f766e; font-size:1.2rem; }
	.legend-coral { color:#be123c; font-size:1.2rem; }
	.comparison { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem; }
	.model-card { min-width:0; padding:.8rem; border:1px solid #cbd5e1; border-radius:.9rem; background:#fff; }
	.model-card.nonlinear { border-color:#5eead4; }
	h4 { display:flex; flex-wrap:wrap; justify-content:space-between; gap:.2rem .6rem; margin:0 0 .4rem; color:#17253a; font-size:clamp(.98rem,1.5vw,1.25rem); }
	h4 span { color:#52627a; font-family:ui-monospace,monospace; font-size:.85em; }
	svg { display:block; width:100%; height:auto; max-height:26rem; }
	.decision-cell { transition:fill .45s ease,opacity .45s ease; }
	.model-card p { margin:.55rem 0 .1rem; color:#334155; text-align:center; }
	.model-card strong { color:#17253a; font-size:1.25rem; }
	.controls { display:flex; flex-wrap:wrap; align-items:center; gap:.55rem; margin-top:1rem; }
	.controls button { min-height:2.7rem; padding:.5rem .8rem; border:1px solid #1d4ed8; border-radius:.65rem; background:#1d4ed8; color:#fff; font:inherit; font-weight:750; cursor:pointer; }
	.controls button.secondary { background:#fff; color:#1d4ed8; }
	.controls button:disabled { opacity:.55; cursor:not-allowed; }
	.controls button:focus-visible,.controls input:focus-visible { outline:3px solid #93c5fd; outline-offset:2px; }
	.controls label { display:flex; align-items:center; gap:.45rem; margin-left:auto; color:#334155; font-size:.9rem; font-weight:750; }
	.controls input { width:clamp(7rem,12vw,10rem); accent-color:#1d4ed8; }
	.explanation { min-height:2.7rem; margin:1rem 0 .3rem; color:#17253a; font-weight:700; }
	.footnote { margin:.35rem 0 0; color:#52627a; font-size:.88rem; line-height:1.5; }
	@media (max-width:780px) { .comparison { grid-template-columns:1fr; } .controls label { margin-left:0; } }
	@media (prefers-reduced-motion:reduce) { .decision-cell { transition:none; } }
</style>
