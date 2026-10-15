<script lang="ts">
	import { onMount } from 'svelte';
	import embeddings from '#lib/domain/language/data/minilm-word-embeddings.json';
	import { principalComponents, nearestNeighbors } from '#lib/domain/language/pca.js';

	type Group = 'animales' | 'frutas' | 'lugares' | 'tecnología' | 'personas' | 'emociones';
	const uid = $props.id();
	const words = embeddings.words as { word: string; group: Group; vector: number[] }[];
	const vectors = words.map((item) => item.vector);
	const pca = principalComponents(vectors, 3);
	const keptVariance = Math.round(pca.explainedVarianceRatio.reduce((sum, value) => sum + value, 0) * 100);
	// Each axis is divided by its spread so the cloud fills the view; then the farthest point sets the frame.
	const spreads = [0, 1, 2].map((axis) => Math.sqrt(pca.projections.reduce((sum, point) => sum + point[axis] ** 2, 0) / pca.projections.length));
	const standardized = pca.projections.map((point) => point.map((value, axis) => value / spreads[axis]));
	const extent = Math.max(...standardized.map((point) => Math.hypot(...point)));
	const points = standardized.map((projection) => projection.map((value) => value / extent) as [number, number, number]);

	const groupColors: Record<Group, string> = {
		animales: '#0f766e', frutas: '#ea580c', lugares: '#1d4ed8', tecnología: '#7c3aed', personas: '#be185d', emociones: '#a16207'
	};
	const groups = Object.keys(groupColors) as Group[];

	const architecture = [
		{ title: 'Texto', detail: '«perro»' },
		{ title: 'Tokenizador', detail: 'texto → IDs' },
		{ title: 'Embeddings de tokens', detail: 'una tabla: ID → vector' },
		{ title: '12 bloques Transformer', detail: 'atención en ambas direcciones + MLP' },
		{ title: 'Promedio (pooling)', detail: 'un vector por token → uno solo' },
		{ title: 'Vector final', detail: '384 números, longitud 1' }
	];

	let yaw = $state(35);
	let pitch = $state(-18);
	let autoRotate = $state(false);
	let reducedMotion = $state(false);
	let selected = $state(words.findIndex((item) => item.word === 'mango'));
	let focusGroup = $state<Group | null>(null);
	let showAllLabels = $state(false);
	let dragging: { x: number; y: number } | null = null;

	const neighbors = $derived(nearestNeighbors(vectors, selected, 3));
	const strongest = $derived(neighbors[0]);

	const size = 420;
	const center = size / 2;
	function project([x, y, z]: [number, number, number]) {
		const a = (yaw * Math.PI) / 180;
		const b = (pitch * Math.PI) / 180;
		const rx = x * Math.cos(a) + z * Math.sin(a);
		const rz = -x * Math.sin(a) + z * Math.cos(a);
		const ry = y * Math.cos(b) - rz * Math.sin(b);
		const depth = y * Math.sin(b) + rz * Math.cos(b);
		const perspective = 5 / (5 + depth);
		return { x: center + rx * 165 * perspective, y: center - ry * 165 * perspective, depth, perspective };
	}

	const highlighted = $derived(new Set([selected, ...neighbors.map((neighbor) => neighbor.index)]));
	// Far points first; the selected word and its neighbors are drawn last so their labels stay on top.
	const projected = $derived(points
		.map((point, index) => ({ index, ...project(point) }))
		.sort((a, b) => Number(highlighted.has(a.index)) - Number(highlighted.has(b.index)) || b.depth - a.depth));
	const axes = $derived(['PC1', 'PC2', 'PC3'].map((label, axis) => {
		const end = [0, 0, 0] as [number, number, number];
		end[axis] = 1.15;
		return { label, from: project([0, 0, 0]), to: project(end) };
	}));
	const positionByIndex = $derived(new Map(projected.map((point) => [point.index, point])));

	function barColor(value: number) {
		const intensity = Math.min(1, Math.abs(value) / 0.15);
		return value >= 0 ? `rgb(234 88 12 / ${0.15 + intensity * 0.85})` : `rgb(29 78 216 / ${0.15 + intensity * 0.85})`;
	}

	function startDrag(event: PointerEvent) {
		dragging = { x: event.clientX, y: event.clientY };
		autoRotate = false;
		(event.currentTarget as Element).setPointerCapture(event.pointerId);
	}
	function drag(event: PointerEvent) {
		if (!dragging) return;
		yaw = (yaw + (event.clientX - dragging.x) * 0.5 + 360) % 360;
		pitch = Math.max(-80, Math.min(80, pitch - (event.clientY - dragging.y) * 0.4));
		dragging = { x: event.clientX, y: event.clientY };
	}
	function rotateWithKeys(event: KeyboardEvent) {
		const moves: Record<string, () => void> = {
			ArrowLeft: () => (yaw = (yaw + 350) % 360), ArrowRight: () => (yaw = (yaw + 10) % 360),
			ArrowUp: () => (pitch = Math.min(80, pitch + 8)), ArrowDown: () => (pitch = Math.max(-80, pitch - 8))
		};
		if (!moves[event.key]) return;
		event.preventDefault();
		autoRotate = false;
		moves[event.key]();
	}

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => { reducedMotion = preference.matches; if (reducedMotion) autoRotate = false; };
		sync();
		preference.addEventListener('change', sync);
		let frame = 0;
		const tick = () => { if (autoRotate) yaw = (yaw + 0.35) % 360; frame = requestAnimationFrame(tick); };
		frame = requestAnimationFrame(tick);
		return () => { cancelAnimationFrame(frame); preference.removeEventListener('change', sync); };
	});
</script>

<div class="embedding-lab">
	<div class="architecture" aria-labelledby="{uid}-architecture-title">
		<p class="kicker">Por dentro de un modelo de embeddings</p>
		<h3 id="{uid}-architecture-title">¿De dónde salen estos vectores?</h3>
		<p>Un <strong>modelo de embeddings</strong> también es un Transformer, pero no genera texto: resume el significado de una palabra o frase en un solo vector. Como no tiene que predecir lo que sigue, cada token puede mirar en ambas direcciones.</p>
		<ol class="pipeline">
			{#each architecture as stage, index (stage.title)}
				<li style={`--stage-index:${index}`}><strong>{stage.title}</strong><span>{stage.detail}</span></li>
			{/each}
		</ol>
	</div>

	<div class="explorer">
		<div class="plot-column">
			<div
				class="plot-surface"
				role="slider"
				tabindex="0"
				aria-label="Giro del gráfico 3D: arrastra o usa las flechas del teclado"
				aria-valuemin={0}
				aria-valuemax={359}
				aria-valuenow={Math.round(yaw)}
				aria-valuetext={`Giro ${Math.round(yaw)} grados, inclinación ${Math.round(pitch)} grados`}
				onpointerdown={startDrag}
				onpointermove={drag}
				onpointerup={() => (dragging = null)}
				onpointercancel={() => (dragging = null)}
				onkeydown={rotateWithKeys}
			>
			<svg viewBox="0 0 {size} {size}" role="img" aria-labelledby="{uid}-title {uid}-desc">
				<title id="{uid}-title">Treinta palabras reales proyectadas de 384 a 3 dimensiones</title>
				<desc id="{uid}-desc">Cada punto es una palabra. La palabra seleccionada es «{words[selected].word}»; sus vecinas más cercanas en 384 dimensiones son {neighbors.map((item) => words[item.index].word).join(', ')}. Arrastra o usa las flechas para girar.</desc>
				{#each axes as axis (axis.label)}
					<line class="axis" x1={axis.from.x} y1={axis.from.y} x2={axis.to.x} y2={axis.to.y} />
					<text class="axis-label" x={axis.to.x} y={axis.to.y}>{axis.label}</text>
				{/each}
				{#each neighbors as neighbor (neighbor.index)}
					{@const from = positionByIndex.get(selected)}
					{@const to = positionByIndex.get(neighbor.index)}
					{#if from && to}<line class="neighbor-line" x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke-width={1 + neighbor.similarity * 4} />{/if}
				{/each}
				{#each projected as point (point.index)}
					{@const item = words[point.index]}
					{@const isSelected = point.index === selected}
					{@const isNeighbor = neighbors.some((neighbor) => neighbor.index === point.index)}
					{@const dimmed = focusGroup !== null && item.group !== focusGroup && !isSelected && !isNeighbor}
					<g class="point" class:dimmed class:highlight={isSelected || isNeighbor} opacity={Math.min(1, 0.35 + point.perspective * 0.6)}>
						<circle cx={point.x} cy={point.y} r={(isSelected ? 9 : 6) * point.perspective} fill={groupColors[item.group]} stroke={isSelected || isNeighbor ? '#17253a' : 'white'} stroke-width={isSelected ? 3 : 1.5} />
						<title>{item.word} · {item.group}</title>
						{#if showAllLabels || isSelected || isNeighbor || focusGroup === item.group}<text x={point.x + 9} y={point.y + 4} class:strong={isSelected || isNeighbor} font-size={isSelected || isNeighbor ? 14 : 11.5}>{item.word}</text>{/if}
					</g>
				{/each}
			</svg>
			</div>
			<div class="controls">
				<label>Girar <input type="range" min="0" max="359" bind:value={yaw} oninput={() => (autoRotate = false)} /></label>
				<button type="button" onclick={() => (autoRotate = !autoRotate)} disabled={reducedMotion} aria-pressed={autoRotate}>{autoRotate ? 'Detener giro' : 'Girar solo'}</button>
				<button type="button" onclick={() => (showAllLabels = !showAllLabels)} aria-pressed={showAllLabels}>{showAllLabels ? 'Ocultar etiquetas' : 'Ver todas las etiquetas'}</button>
			</div>
			<p class="plot-note">Arrastra el gráfico o usa las flechas del teclado: al girarlo, las palabras que parecían encimadas se separan. Estos 3 ejes conservan cerca del <strong>{keptVariance} %</strong> de la información; el resto se pierde al aplanar.</p>
			<p class="legend-hint">Toca un grupo para resaltarlo y ver sus nombres:</p>
			<div class="legend" role="group" aria-label="Resaltar un grupo de palabras">
				{#each groups as group (group)}
					<button type="button" class:active={focusGroup === group} aria-pressed={focusGroup === group} onclick={() => (focusGroup = focusGroup === group ? null : group)}><span style={`background:${groupColors[group]}`}></span>{group}</button>
				{/each}
			</div>
		</div>

		<div class="detail-column">
			<p class="kicker">Elige una palabra</p>
			<div class="word-picker" role="group" aria-label="Palabras disponibles">
				{#each words as item, index (item.word)}
					<button type="button" class:current={index === selected} aria-pressed={index === selected} style={`--group:${groupColors[item.group]}`} onclick={() => (selected = index)}>{item.word}</button>
				{/each}
			</div>
			<div class="neighbors" aria-live="polite">
				<h4>Vecinas de «{words[selected].word}» en 384 dimensiones</h4>
				<ol>
					{#each neighbors as neighbor (neighbor.index)}
						<li><span>{words[neighbor.index].word}</span><meter min="0" max="1" value={neighbor.similarity}></meter><strong>{neighbor.similarity.toFixed(2)}</strong></li>
					{/each}
				</ol>
				<p>Calculo la similitud coseno con los 384 números completos, no con el dibujo en 3D.</p>
			</div>
			<div class="barcodes">
				<h4>Así se ven los 384 números</h4>
				{#each [selected, strongest.index] as index, row (row)}
					<div class="barcode-row">
						<span>{words[index].word}</span>
						<div class="barcode" aria-hidden="true">{#each words[index].vector as value, position (position)}<i style={`background:${barColor(value)}`}></i>{/each}</div>
					</div>
				{/each}
				<p>Naranja: valores positivos; azul: negativos. Palabras parecidas comparten patrones de color.</p>
			</div>
		</div>
	</div>

	<div class="honest-note">
		<strong>Un modelo real no es perfecto.</strong>
		<p>Elige «Chiquimula»: sus vecinas no son lugares. Probablemente el modelo vio muy pocas veces esa palabra durante su entrenamiento. Además, una palabra suelta tiene poco contexto: «gato» o «alegre» quedan cerca de palabras que no esperaríamos. Por eso los modelos funcionan mejor con frases completas.</p>
	</div>

	<details class="how-built">
		<summary>¿Cómo obtuve estos vectores?</summary>
		<ul>
			<li><strong>Modelo:</strong> descargué <a href="https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2" target="_blank" rel="noreferrer">paraphrase-multilingual-MiniLM-L12-v2</a> de Sentence Transformers, un modelo de embeddings de 12 bloques que entiende más de 50 idiomas. Usé su versión cuantizada en formato ONNX publicada por Xenova en Hugging Face (unos 140 MB).</li>
			<li><strong>Frameworks:</strong> Transformers.js de Hugging Face, que ejecuta el modelo con ONNX Runtime en Node.js. Calculé una sola vez el vector de cada palabra, con promedio de tokens y normalización, y guardé solo los números en este proyecto.</li>
			<li><strong>En tu navegador:</strong> no se descarga ningún modelo. Aquí solo se calculan la PCA (análisis de componentes principales) y las similitudes, con código propio y sin librerías.</li>
		</ul>
	</details>
</div>

<style>
	.embedding-lab { display: grid; gap: 1.25rem; margin-top: 1.5rem; }
	.kicker { margin: 0 0 0.4rem; color: #0f766e; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
	h3 { margin: 0 0 0.5rem; color: #17253a; font-size: clamp(1.25rem, 2.4vw, 1.7rem); }
	h4 { margin: 0 0 0.5rem; color: #17253a; font-size: 1rem; }
	p { margin: 0; color: #52627a; line-height: 1.6; }
	.architecture { padding: 1.1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: linear-gradient(145deg, #f8fbff, #fff); }
	.pipeline { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0.9rem; margin: 1rem 0 0; padding: 0; list-style: none; }
	.pipeline li { position: relative; display: grid; gap: 0.25rem; padding: 0.75rem; border: 1px solid #d9e1eb; border-radius: 0.8rem; background: white; animation: stage-in 500ms both; animation-delay: calc(var(--stage-index) * 120ms); }
	.pipeline li:not(:last-child)::after { position: absolute; top: 50%; right: -0.85rem; color: #0f766e; content: '→'; font-weight: 900; transform: translateY(-50%); }
	.pipeline li:nth-child(4) { border-color: #1d4ed8; background: #eff6ff; }
	.pipeline li:last-child { border-color: #0f766e; background: #f0fdfa; }
	.pipeline strong { color: #17253a; font-size: 0.92rem; }
	.pipeline span { color: #52627a; font-size: 0.82rem; }
	.explorer { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 1.25rem; align-items: start; }
	.plot-column, .detail-column { min-width: 0; }
	.plot-surface { max-width: 34rem; margin: 0 auto; border-radius: 1rem; cursor: grab; touch-action: none; }
	.plot-surface:active { cursor: grabbing; }
	.plot-surface:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	svg { display: block; width: 100%; height: auto; border: 1px solid #d9e1eb; border-radius: 1rem; background: radial-gradient(circle at 50% 45%, #fff, #f1f5f9); }
	.axis { stroke: #94a3b8; stroke-width: 1.5; stroke-dasharray: 4 4; }
	.axis-label { fill: #64748b; font-size: 12px; font-weight: 800; }
	.neighbor-line { stroke: #17253a; opacity: 0.35; }
	.point text { fill: #475569; font-weight: 600; paint-order: stroke; stroke: rgb(255 255 255 / 85%); stroke-width: 3px; pointer-events: none; }
	.point text.strong { fill: #17253a; font-weight: 850; }
	.point.dimmed { opacity: 0.12; }
	.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
	.controls label { display: flex; align-items: center; gap: 0.5rem; color: #17253a; font-weight: 750; }
	.controls input { accent-color: #1d4ed8; }
	button { border: 1px solid #cbd5e1; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 750; cursor: pointer; }
	button:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
	button:disabled { cursor: not-allowed; opacity: 0.55; }
	.controls button { padding: 0.45rem 0.9rem; font-size: 0.9rem; }
	.plot-note { margin-top: 0.6rem; font-size: 0.92rem; }
	.legend-hint { margin-top: 0.7rem; font-size: 0.85rem; }
	.legend { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.35rem; }
	.legend button { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.7rem; font-size: 0.85rem; }
	.legend button.active { border-color: #17253a; background: #f1f5f9; }
	.legend span { width: 0.7rem; height: 0.7rem; border-radius: 50%; }
	.word-picker { display: flex; flex-wrap: wrap; gap: 0.35rem; }
	.word-picker button { padding: 0.3rem 0.65rem; border-left: 4px solid var(--group); font-size: 0.85rem; }
	.word-picker button.current { border-color: var(--group); background: #17253a; color: white; }
	.neighbors, .barcodes { margin-top: 1rem; padding: 0.9rem 1rem; border: 1px solid #d9e1eb; border-radius: 0.9rem; background: #fbfdff; }
	.neighbors ol { display: grid; gap: 0.4rem; margin: 0 0 0.6rem; padding-left: 1.2rem; }
	.neighbors li { display: grid; grid-template-columns: 7rem minmax(0, 1fr) 3rem; align-items: center; gap: 0.6rem; color: #17253a; font-weight: 700; }
	.neighbors meter { width: 100%; }
	.neighbors strong { font-variant-numeric: tabular-nums; text-align: right; }
	.neighbors p, .barcodes p { font-size: 0.85rem; }
	.barcode-row { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; color: #17253a; font-size: 0.9rem; font-weight: 750; }
	.barcode { display: flex; height: 1.6rem; overflow: hidden; border-radius: 0.3rem; }
	.barcode i { flex: 1 1 0; min-width: 0; }
	.honest-note { padding: 1rem 1.1rem; border-left: 4px solid #ea580c; border-radius: 0 0.8rem 0.8rem 0; background: #fff7ed; }
	.honest-note strong { color: #9a3412; }
	.honest-note p { margin-top: 0.35rem; color: #7c2d12; }
	.how-built { padding: 0.9rem 1.1rem; border: 1px solid #d9e1eb; border-radius: 0.85rem; background: #f8fbff; }
	.how-built summary { color: #1d4ed8; font-weight: 800; cursor: pointer; }
	.how-built ul { display: grid; gap: 0.5rem; margin: 0.75rem 0 0; padding-left: 1.2rem; color: #52627a; line-height: 1.55; }
	.how-built a { color: #1d4ed8; font-weight: 700; }
	@keyframes stage-in { from { opacity: 0.4; transform: translateY(0.4rem); } }
	@media (max-width: 1100px) {
		.pipeline { grid-template-columns: repeat(3, minmax(0, 1fr)); }
		.pipeline li:nth-child(3)::after { content: ''; }
	}
	@media (max-width: 900px) { .explorer { grid-template-columns: 1fr; } }
	@media (max-width: 560px) {
		.pipeline { grid-template-columns: 1fr; }
		.pipeline li:not(:last-child)::after { top: auto; right: 50%; bottom: -0.95rem; content: '↓'; transform: translateX(50%); }
		.pipeline li:nth-child(3)::after { content: '↓'; }
		.neighbors li { grid-template-columns: 5.5rem minmax(0, 1fr) 2.8rem; }
		.barcode-row { grid-template-columns: 5rem minmax(0, 1fr); }
	}
	@media (prefers-reduced-motion: reduce) { .pipeline li { animation: none; } }
</style>
