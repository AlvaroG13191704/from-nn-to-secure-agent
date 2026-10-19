<script lang="ts">
	import { onMount } from 'svelte';
	import {
		DEFAULT_SEED,
		DEFAULT_STEPS,
		LANDSCAPE_MINIMA,
		LANDSCAPE_RANGE,
		OPTIMIZER_KINDS,
		OPTIMIZER_SETTINGS,
		START_POINTS,
		TRAINING_EXAMPLES,
		lossAt,
		nearestMinimum,
		runOptimizer,
		type OptimizerKind
	} from '#lib/domain/loss-landscape.js';
	import { formatNumber as fmt } from './format-number.js';

	const optimizers: Record<OptimizerKind, { name: string; color: string; dash?: string; batch: string; analogy: string; behaviour: string }> = {
		batch: {
			name: 'Descenso por lotes',
			color: '#14213d',
			batch: `los ${TRAINING_EXAMPLES.length} ejemplos en cada paso`,
			analogy: 'Antes de cada paso le pregunto el camino a todo el pueblo y sigo el promedio.',
			behaviour: 'Camino suave y seguro, pero cada paso es caro cuando hay millones de ejemplos. Baja al primer valle que encuentra y ahí se queda.'
		},
		sgd: {
			name: 'Estocástico (SGD)',
			color: '#d81b60',
			batch: '1 ejemplo al azar en cada paso',
			analogy: 'Le pregunto a una sola persona al azar. A veces me orienta bien y a veces no.',
			behaviour: 'Cada paso es barato y el camino tiembla. Ese temblor puede sacarlo de un valle poco profundo, aunque también le cuesta quedarse quieto en el fondo.'
		},
		minibatch: {
			name: 'Mini-lote',
			color: '#7b1fa2',
			dash: '10 6',
			batch: `${OPTIMIZER_SETTINGS.minibatch.batchSize} ejemplos al azar en cada paso`,
			analogy: 'Le pregunto a un grupo pequeño: menos ruido que con una persona y menos espera que con todo el pueblo.',
			behaviour: 'Es lo que se usa en la práctica, con lotes de 32, 64 o 256 ejemplos. Aquí tiembla poco y, como el lote completo, termina en el valle local.'
		},
		momentum: {
			name: 'Momentum',
			color: '#e65100',
			batch: `los ${TRAINING_EXAMPLES.length} ejemplos, más la velocidad acumulada`,
			analogy: 'Una pelota que rueda: no solo mira la pendiente de ahora, también arrastra la velocidad que traía.',
			behaviour: `Recuerda los pasos anteriores (v = ${OPTIMIZER_SETTINGS.momentum.beta}·v + gradiente). La inercia lo lleva a cruzar baches y valles pequeños; también puede pasarse de largo.`
		},
		adam: {
			name: 'Adam',
			color: '#00897b',
			dash: '3 5',
			batch: `los ${TRAINING_EXAMPLES.length} ejemplos, con un paso propio para cada peso`,
			analogy: 'Un excursionista que ajusta el largo de su paso según el terreno de cada dirección.',
			behaviour: 'Combina la inercia del momentum con un tamaño de paso que se adapta a cada peso. Es el optimizador por defecto en muchos modelos, pero tampoco garantiza encontrar el valle más profundo.'
		}
	};

	let selected = $state<Record<OptimizerKind, boolean>>({ batch: true, sgd: true, minibatch: false, momentum: true, adam: false });
	let startIndex = $state(0);
	let seed = $state(DEFAULT_SEED);
	let frame = $state(0);
	let azimuth = $state(-15);
	let playing = $state(false);
	let reducedMotion = $state(false);
	let focusKind = $state<OptimizerKind>('batch');
	let timer: ReturnType<typeof setInterval> | undefined;

	const runs = $derived(
		Object.fromEntries(OPTIMIZER_KINDS.map((kind) => [kind, runOptimizer(kind, START_POINTS[startIndex], DEFAULT_STEPS, seed)])) as Record<OptimizerKind, ReturnType<typeof runOptimizer>>
	);

	// --- Projection: rotate around the vertical axis, then tilt the camera. ---
	const SCALE = 88;
	const HEIGHT_SCALE = 0.6;
	const FLOOR = -0.9;
	const TILT = (34 * Math.PI) / 180;
	const GRID = 34;

	function projectAt(angleDegrees: number, a: number, b: number, z: number) {
		const angle = (angleDegrees * Math.PI) / 180;
		const across = a * Math.cos(angle) - b * Math.sin(angle);
		const along = a * Math.sin(angle) + b * Math.cos(angle);
		return {
			x: SCALE * across,
			y: -SCALE * (along * Math.sin(TILT) + z * HEIGHT_SCALE * Math.cos(TILT)),
			depth: along * Math.cos(TILT) - z * HEIGHT_SCALE * Math.sin(TILT)
		};
	}
	const project = (a: number, b: number, z: number) => projectAt(azimuth, a, b, z);

	const lossValues = Array.from({ length: GRID + 1 }, (_, i) =>
		Array.from({ length: GRID + 1 }, (_, j) => {
			const a = -LANDSCAPE_RANGE + (2 * LANDSCAPE_RANGE * i) / GRID;
			const b = -LANDSCAPE_RANGE + (2 * LANDSCAPE_RANGE * j) / GRID;
			return { a, b, loss: lossAt(a, b) };
		})
	);
	const allLosses = lossValues.flat().map((point) => point.loss);
	const minLoss = Math.min(...allLosses);
	const maxLoss = Math.max(...allLosses);

	// One viewBox that fits every rotation, so turning the surface never resizes or clips it.
	const viewBox = (() => {
		const xs: number[] = [];
		const ys: number[] = [];
		for (let angle = -180; angle <= 180; angle += 10) {
			for (const point of lossValues.flat()) {
				for (const z of [point.loss, FLOOR]) {
					const projected = projectAt(angle, point.a, point.b, z);
					xs.push(projected.x);
					ys.push(projected.y);
				}
			}
		}
		const pad = 18;
		const left = Math.min(...xs) - pad;
		const top = Math.min(...ys) - pad;
		return { left, top, width: Math.max(...xs) + pad - left, height: Math.max(...ys) + pad - top };
	})();

	// Low loss is deep blue, high loss is warm red, like a topographic map.
	const STOPS = [[27, 58, 138], [31, 120, 180], [54, 163, 154], [242, 193, 78], [209, 73, 91]];
	function colorFor(loss: number, fade = 0) {
		const t = Math.max(0, Math.min(1, (loss - minLoss) / (maxLoss - minLoss))) * (STOPS.length - 1);
		const index = Math.min(STOPS.length - 2, Math.floor(t));
		const mix = t - index;
		const rgb = STOPS[index].map((channel, k) => channel + (STOPS[index + 1][k] - channel) * mix).map((channel) => Math.round(channel + (255 - channel) * fade));
		return `rgb(${rgb.join(' ')})`;
	}

	type Quad = { points: string; fill: string; depth: number };
	function buildQuads(atFloor: boolean): Quad[] {
		const quads: Quad[] = [];
		for (let i = 0; i < GRID; i += 1) {
			for (let j = 0; j < GRID; j += 1) {
				const corners = [lossValues[i][j], lossValues[i + 1][j], lossValues[i + 1][j + 1], lossValues[i][j + 1]];
				const projected = corners.map((corner) => project(corner.a, corner.b, atFloor ? FLOOR : corner.loss));
				const meanLoss = corners.reduce((sum, corner) => sum + corner.loss, 0) / 4;
				quads.push({
					points: projected.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' '),
					fill: colorFor(meanLoss, atFloor ? 0.72 : 0),
					depth: projected.reduce((sum, point) => sum + point.depth, 0) / 4
				});
			}
		}
		return quads.sort((first, second) => second.depth - first.depth);
	}

	const surface = $derived(buildQuads(false));
	const floor = $derived(buildQuads(true));
	const floorOutline = $derived(
		[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sa, sb]) => project(sa * LANDSCAPE_RANGE, sb * LANDSCAPE_RANGE, FLOOR)).map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
	);

	function pathPoints(kind: OptimizerKind, onFloor: boolean) {
		return runs[kind]
			.slice(0, frame + 1)
			.map((point) => project(point.a, point.b, onFloor ? FLOOR : point.loss + 0.06))
			.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
			.join(' ');
	}
	const ball = (kind: OptimizerKind) => {
		const point = runs[kind][frame];
		return project(point.a, point.b, point.loss + 0.06);
	};
	const minimaMarks = $derived(LANDSCAPE_MINIMA.map((minimum) => ({ ...minimum, ...project(minimum.a, minimum.b, lossAt(minimum.a, minimum.b) + 0.02) })));
	const startMark = $derived(project(START_POINTS[startIndex].a, START_POINTS[startIndex].b, lossAt(START_POINTS[startIndex].a, START_POINTS[startIndex].b) + 0.06));
	const activeKinds = $derived(OPTIMIZER_KINDS.filter((kind) => selected[kind]));
	const finished = $derived(frame === DEFAULT_STEPS);

	function stop() {
		if (timer !== undefined) clearInterval(timer);
		timer = undefined;
		playing = false;
	}
	function play() {
		if (reducedMotion) return;
		if (frame >= DEFAULT_STEPS) frame = 0;
		playing = true;
		timer = setInterval(() => {
			if (frame >= DEFAULT_STEPS) return stop();
			frame += 1;
		}, 110);
	}
	function restart() {
		stop();
		frame = 0;
	}
	function chooseStart(index: number) {
		startIndex = index;
		restart();
	}
	function reroll() {
		seed += 1;
		restart();
	}

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			reducedMotion = preference.matches;
			if (reducedMotion) stop();
		};
		sync();
		preference.addEventListener('change', sync);
		return () => {
			preference.removeEventListener('change', sync);
			stop();
		};
	});
</script>

<div class="landscape">
	<div class="landscape__view">
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the SVG on narrow screens.) -->
		<div class="diagram-scroll" role="region" tabindex="0" aria-label="Superficie de pérdida en tres dimensiones; en pantallas pequeñas, desplázate horizontalmente">
			<svg viewBox="{viewBox.left.toFixed(0)} {viewBox.top.toFixed(0)} {viewBox.width.toFixed(0)} {viewBox.height.toFixed(0)}" role="img" aria-labelledby="landscape-title landscape-desc">
				<title id="landscape-title">Superficie de pérdida de dos pesos con los caminos de cada optimizador</title>
				<desc id="landscape-desc">
					Paso {frame} de {DEFAULT_STEPS}.
					{#each activeKinds as kind (kind)}{optimizers[kind].name}: pérdida {fmt(runs[kind][frame].loss, 3)}. {/each}
				</desc>
				<polygon points={floorOutline} fill="#fff" stroke="#d5dce6" />
				<g class="floor">{#each floor as quad, index (index)}<polygon points={quad.points} fill={quad.fill} />{/each}</g>
				{#each activeKinds as kind (kind)}
					<polyline class="shadow" points={pathPoints(kind, true)} stroke={optimizers[kind].color} />
				{/each}
				<g class="surface">{#each surface as quad, index (index)}<polygon points={quad.points} fill={quad.fill} />{/each}</g>
				{#each activeKinds as kind (kind)}
					<polyline class="halo" points={pathPoints(kind, false)} />
					<polyline class="trail" class:dim={focusKind !== kind} points={pathPoints(kind, false)} stroke={optimizers[kind].color} stroke-dasharray={optimizers[kind].dash} />
				{/each}
				{#each minimaMarks as mark (mark.kind)}
					<g class="minimum">
						<circle cx={mark.x} cy={mark.y} r="9" fill="none" stroke="#fff" stroke-width="3" /><circle cx={mark.x} cy={mark.y} r="9" fill="none" stroke={mark.kind === 'global' ? '#0f6b5e' : '#b7791f'} stroke-width="2" stroke-dasharray="4 3" />
						<text x={mark.x + 14} y={mark.y + 26}>{mark.kind === 'global' ? 'valle profundo' : 'valle local'}</text>
					</g>
				{/each}
				<circle cx={startMark.x} cy={startMark.y} r="8" fill="#fff" stroke="#14213d" stroke-width="3" />
				{#each activeKinds as kind (kind)}
					{@const point = ball(kind)}
					<circle class="ball" cx={point.x} cy={point.y} r={focusKind === kind ? 10 : 8} fill={optimizers[kind].color} />
				{/each}
			</svg>
		</div>

		<p class="axis-note">Altura: pérdida promedio sobre {TRAINING_EXAMPLES.length} ejemplos. Piso: los dos pesos <var>a</var> y <var>b</var>; debajo, el mismo paisaje visto desde arriba con la sombra de cada camino.</p>
		<div class="view-controls" role="group" aria-label="Controles de la animación de la superficie">
			<button type="button" onclick={playing ? stop : play} aria-pressed={playing} disabled={reducedMotion}>{playing ? 'Pausar' : finished ? 'Repetir descenso' : 'Iniciar descenso'}</button>
			<button type="button" class="secondary" onclick={() => { stop(); frame = Math.min(DEFAULT_STEPS, frame + 1); }} disabled={finished}>Un paso</button>
			<button type="button" class="secondary" onclick={restart} disabled={frame === 0}>Volver al inicio</button>
			<button type="button" class="secondary" onclick={reroll}>Nueva tirada al azar</button>
			<label class="slider">Paso {frame} de {DEFAULT_STEPS}<input type="range" min="0" max={DEFAULT_STEPS} bind:value={frame} oninput={stop} /></label>
			<label class="slider">Girar la superficie<input type="range" min="-180" max="180" step="5" bind:value={azimuth} /></label>
		</div>
		<fieldset class="starts">
			<legend>Punto de partida</legend>
			{#each START_POINTS as start, index (index)}
				<label><input type="radio" name="landscape-start" checked={startIndex === index} onchange={() => chooseStart(index)} /> Punto {index + 1} (a = {start.a}, b = {start.b})</label>
			{/each}
		</fieldset>
	</div>

	<div class="landscape__side">
		<table class="readout">
			<caption>Estado de cada optimizador en el paso {frame}</caption>
			<thead><tr><th scope="col">Optimizador</th><th scope="col">Pérdida</th><th scope="col">{finished ? 'Terminó en' : 'Va hacia'}</th></tr></thead>
			<tbody>
				{#each OPTIMIZER_KINDS as kind (kind)}
					{@const point = runs[kind][frame]}
					<tr class:off={!selected[kind]}>
						<th scope="row">
							<label><input type="checkbox" bind:checked={selected[kind]} /> <span class="swatch" style:background={optimizers[kind].color}></span>{optimizers[kind].name}</label>
						</th>
						<td>{fmt(point.loss, 3)}</td>
						<td>{nearestMinimum(point).kind === 'global' ? 'valle profundo' : 'valle local'}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="types" role="tablist" aria-label="Tipos de descenso de gradiente">
			{#each OPTIMIZER_KINDS as kind (kind)}
				<button type="button" role="tab" aria-selected={focusKind === kind} class:active={focusKind === kind} onclick={() => { focusKind = kind; selected[kind] = true; }}>
					<span class="swatch" style:background={optimizers[kind].color}></span>{optimizers[kind].name}
				</button>
			{/each}
		</div>
		<div class="type-card" role="tabpanel" aria-live="polite">
			<h3>{optimizers[focusKind].name}</h3>
			<p class="type-card__batch">Calcula el gradiente con {optimizers[focusKind].batch}.</p>
			<p class="type-card__analogy">{optimizers[focusKind].analogy}</p>
			<p>{optimizers[focusKind].behaviour}</p>
		</div>
	</div>
</div>

<style>
	.landscape { display: grid; gap: 1.25rem; }
	@media (min-width: 1100px) { .landscape { grid-template-columns: minmax(0, 1.6fr) minmax(22rem, 1fr); align-items: start; } }
	.landscape__view, .landscape__side { display: grid; gap: 0.9rem; min-width: 0; }
	.diagram-scroll { overflow-x: auto; overscroll-behavior-inline: contain; border: 1px solid var(--color-line); border-radius: 0.4rem; background: #fbfcfe; }
	.diagram-scroll:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	svg { display: block; width: 100%; height: auto; font-family: var(--font-sans); }
	.surface polygon { stroke: rgb(20 33 61 / 28%); stroke-width: 0.6; }
	.floor polygon { stroke: none; }
	.minimum text { fill: #14213d; font-size: 16px; font-weight: 700; paint-order: stroke; stroke: #fff; stroke-width: 4px; stroke-linejoin: round; }
	.shadow { fill: none; stroke-width: 2; opacity: 0.45; }
	.halo { fill: none; stroke: #fff; stroke-width: 7; stroke-linejoin: round; stroke-linecap: round; opacity: 0.85; }
	.trail { fill: none; stroke-width: 3.5; stroke-linejoin: round; stroke-linecap: round; }
	.trail.dim { opacity: 0.75; }
	.ball { stroke: #fff; stroke-width: 3; }
	.axis-note { margin: 0; color: var(--color-muted); font-size: 0.9rem; line-height: 1.45; }

	.view-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
	button { min-height: 2.7rem; padding: 0.5rem 0.9rem; border: 1px solid var(--color-primary); border-radius: 0.4rem; background: var(--color-primary); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
	button.secondary { background: #fff; color: var(--color-primary); }
	button:disabled { opacity: 0.45; cursor: not-allowed; }
	button:focus-visible, input:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	.slider { display: grid; gap: 0.2rem; color: var(--color-muted); font-size: 0.9rem; font-weight: 700; }
	.slider input { width: 12rem; accent-color: var(--color-primary); }
	.starts { display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; margin: 0; padding: 0.6rem 0.9rem; border: 1px solid var(--color-line); border-radius: 0.4rem; }
	.starts legend { padding: 0 0.3rem; color: var(--color-muted); font-size: 0.9rem; font-weight: 700; }
	.starts label { display: flex; align-items: center; gap: 0.4rem; }

	.readout { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	.readout caption { margin-bottom: 0.4rem; color: var(--color-muted); font-weight: 700; text-align: left; }
	.readout th, .readout td { padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--color-line); text-align: left; }
	.readout thead th { color: var(--color-muted); font-size: 0.85rem; }
	.readout td { font-variant-numeric: tabular-nums; }
	.readout tr.off td { color: #9aa6b8; }
	.readout tbody th label { display: flex; align-items: center; gap: 0.45rem; font-weight: 700; cursor: pointer; }
	.swatch { display: inline-block; flex: none; width: 0.9rem; height: 0.9rem; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px #9baec3; }

	.types { display: flex; flex-wrap: wrap; gap: 0.4rem; }
	.types button { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 2.4rem; border-color: var(--color-line); background: #fff; color: var(--color-ink); font-size: 0.9rem; }
	.types button.active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary); }
	.type-card { padding: 1rem 1.15rem; border-left: 4px solid var(--color-ochre); border-radius: 0.3rem; background: var(--color-ochre-soft); }
	.type-card h3 { margin: 0; font-size: 1.2rem; }
	.type-card p { margin: 0.5rem 0 0; color: var(--color-muted); line-height: 1.5; }
	.type-card__batch { color: var(--color-ink) !important; font-weight: 700; }
	.type-card__analogy { color: #7a4f12 !important; font-family: var(--font-serif); font-size: 1.1rem; font-style: italic; }

	@media (max-width: 700px) { svg { min-width: 620px; } }
</style>
