<script lang="ts">
	import { onMount } from 'svelte';
	import { ONE_WEIGHT, descendOneWeight, describeStepSize, lossForWeight, measureSlope } from '#lib/domain/gradient-descent.js';
	import { formatNumber as fmt } from './format-number.js';

	const STEPS = 12;
	const NUDGE = 0.01;
	const rates = [
		{ value: 0.1, label: 'Paso pequeño (η = 0.1)' },
		{ value: 0.4, label: 'Paso grande (η = 0.4)' },
		{ value: 0.55, label: 'Paso demasiado grande (η = 0.55)' }
	];
	const outcome = {
		smooth: 'Cada paso acorta la distancia al mínimo sin pasarse: llega con calma.',
		bounces: 'Cada paso se pasa al otro lado del valle, pero cada vez menos: rebota y aun así llega.',
		diverges: 'Cada paso se pasa más lejos que el anterior: la pérdida crece y el peso se escapa del valle.'
	};

	let rate = $state(0.1);
	let step = $state(0);
	let playing = $state(false);
	let reducedMotion = $state(false);
	let timer: ReturnType<typeof setInterval> | undefined;

	const path = $derived(descendOneWeight(ONE_WEIGHT.start, rate, STEPS));
	const current = $derived(path[step]);
	const next = $derived(path[Math.min(step + 1, STEPS)]);
	const behaviour = $derived(describeStepSize(rate));
	const nudge = measureSlope(ONE_WEIGHT.start, NUDGE);

	// Chart frame: w from 0 to 10, loss from 0 to 26.
	const W_MIN = 0;
	const W_MAX = 10;
	const L_MAX = 26;
	const X0 = 60;
	const X1 = 610;
	const Y0 = 290;
	const Y1 = 24;
	const px = (weight: number) => X0 + ((weight - W_MIN) / (W_MAX - W_MIN)) * (X1 - X0);
	const py = (loss: number) => Y0 - (Math.min(loss, L_MAX) / L_MAX) * (Y0 - Y1);
	const inside = (point: { loss: number; weight: number }) => point.loss <= L_MAX && point.weight >= W_MIN && point.weight <= W_MAX;
	const curve = Array.from({ length: 121 }, (_, index) => W_MIN + (index * (W_MAX - W_MIN)) / 120)
		.filter((weight) => lossForWeight(weight) <= L_MAX)
		.map((weight, index) => `${index === 0 ? 'M' : 'L'} ${px(weight).toFixed(1)} ${py(lossForWeight(weight)).toFixed(1)}`)
		.join(' ');
	const tangent = $derived.by(() => {
		const half = 1.1;
		const from = { w: current.weight - half, l: current.loss - current.slope * half };
		const to = { w: current.weight + half, l: current.loss + current.slope * half };
		return { x1: px(from.w), y1: Y0 - (from.l / L_MAX) * (Y0 - Y1), x2: px(to.w), y2: Y0 - (to.l / L_MAX) * (Y0 - Y1) };
	});
	const trail = $derived(path.slice(0, step + 1).filter(inside));
	const escaped = $derived(!inside(current));

	function stop() {
		if (timer !== undefined) clearInterval(timer);
		timer = undefined;
		playing = false;
	}
	function play() {
		if (reducedMotion) return;
		if (step >= STEPS || escaped) step = 0;
		playing = true;
		timer = setInterval(() => {
			if (step >= STEPS || !inside(path[step])) return stop();
			step += 1;
		}, 900);
	}
	function chooseRate(value: number) {
		stop();
		rate = value;
		step = 0;
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

<div class="descent">
	<div class="experiment">
		<p class="experiment__title">El experimento del empujón</p>
		<p>Con <var>w = {ONE_WEIGHT.start}</var> la pérdida vale <strong>{fmt(nudge.lossBefore)}</strong>. Si empujo el peso apenas a <var>w = {fmt(ONE_WEIGHT.start + NUDGE)}</var>, la pérdida baja a <strong>{fmt(nudge.lossAfter)}</strong>.</p>
		<p class="experiment__math">cambio ÷ empujón = {fmt(nudge.change)} ÷ {NUDGE} = {fmt(nudge.slope, 2)} ≈ {fmt(Math.round(nudge.slope))}</p>
		<p>Ese número es la <strong>pendiente</strong>: por cada unidad que muevo <var>w</var>, la pérdida cambia unas {fmt(Math.abs(Math.round(nudge.slope)))} unidades. Como es negativa, mover <var>w</var> hacia la derecha hace bajar la pérdida.</p>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the SVG on narrow screens.) -->
	<div class="diagram-scroll" role="region" tabindex="0" aria-label="Curva de pérdida de un peso; en pantallas pequeñas, desplázate horizontalmente">
		<svg viewBox="0 0 640 330" role="img" aria-labelledby="gd1-title gd1-desc">
			<title id="gd1-title">La pérdida según el valor del peso w</title>
			<desc id="gd1-desc">Paso {step}: w = {fmt(current.weight, 3)}, pendiente {fmt(current.slope, 3)}, pérdida {fmt(current.loss, 3)}.</desc>
			<path d="M{X0} {Y0}H{X1}M{X0} {Y0}V{Y1}" fill="none" stroke="#9baec3" stroke-width="2" />
			{#each [0, 2, 4, 6, 8, 10] as tick (tick)}<text x={px(tick)} y={Y0 + 22} class="tick">{tick}</text>{/each}
			<text x={X1 + 20} y={Y0 + 5} class="axis">w</text><text x="18" y={Y1 + 6} class="axis">L</text>
			<path d={curve} fill="none" stroke="#1f4fd1" stroke-width="4" stroke-linecap="round" />
			<path d="M{px(5)} {Y0}V{Y1}" stroke="#0f6b5e" stroke-width="1.5" stroke-dasharray="5 6" />
			<text x={px(5) + 8} y={Y1 + 12} class="minimum">mínimo, w = 5</text>
			{#if trail.length > 1}
				<polyline points={trail.map((point) => `${px(point.weight).toFixed(1)},${py(point.loss).toFixed(1)}`).join(' ')} fill="none" stroke="#b7791f" stroke-width="2" stroke-dasharray="6 5" />
			{/if}
			{#each trail.slice(0, -1) as point, index (index)}<circle cx={px(point.weight)} cy={py(point.loss)} r="5" fill="#b7791f" opacity="0.45" />{/each}
			{#if !escaped}
				<line x1={tangent.x1} y1={tangent.y1} x2={tangent.x2} y2={tangent.y2} stroke="#14213d" stroke-width="2.5" />
				<text x={tangent.x2 + 6} y={tangent.y2} class="tangent">pendiente {fmt(current.slope, 2)}</text>
				<circle cx={px(current.weight)} cy={py(current.loss)} r="10" fill="#b7791f" stroke="#fff" stroke-width="3" />
			{:else}
				<text x="330" y="60" class="escaped">El peso se salió de la gráfica: w = {fmt(current.weight, 2)}, L = {fmt(current.loss, 1)}</text>
			{/if}
		</svg>
	</div>

	<fieldset class="rates">
		<legend>Tamaño del paso η</legend>
		{#each rates as option (option.value)}
			<label><input type="radio" name="gd1-rate" checked={rate === option.value} onchange={() => chooseRate(option.value)} /> {option.label}</label>
		{/each}
	</fieldset>

	<div class="readout" aria-live="polite">
		<p><strong>Paso {step}.</strong> w = {fmt(current.weight, 3)} · pendiente = {fmt(current.slope, 3)} · L = {fmt(current.loss, 3)}</p>
		{#if step < STEPS && !escaped}
			<p class="readout__rule">w<sub>nuevo</sub> = w − η × pendiente = {fmt(current.weight, 3)} − {rate} × ({fmt(current.slope, 3)}) = {fmt(next.weight, 3)}</p>
		{/if}
		<p class="readout__outcome">{outcome[behaviour]}</p>
	</div>

	<div class="controls" role="group" aria-label="Controles del descenso de un peso">
		<button type="button" onclick={playing ? stop : play} aria-pressed={playing} disabled={reducedMotion}>{playing ? 'Pausar' : 'Bajar solo'}</button>
		<button type="button" class="secondary" onclick={() => { stop(); step = Math.min(STEPS, step + 1); }} disabled={step >= STEPS || escaped}>Un paso</button>
		<button type="button" class="secondary" onclick={() => { stop(); step = 0; }} disabled={step === 0}>Volver a w = 3</button>
	</div>
</div>

<style>
	.descent { display: grid; gap: 0.9rem; }
	.experiment { padding: 0.9rem 1.1rem; border-left: 4px solid var(--color-ochre); border-radius: 0.3rem; background: var(--color-ochre-soft); }
	.experiment p { margin: 0.35rem 0 0; color: var(--color-muted); line-height: 1.5; }
	.experiment strong { color: var(--color-ink); }
	.experiment__title { margin: 0 !important; color: #7a4f12 !important; font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600; }
	.experiment__math { color: #7a4f12 !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; }
	.diagram-scroll { overflow-x: auto; overscroll-behavior-inline: contain; }
	.diagram-scroll:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	svg { display: block; width: 100%; height: auto; font-family: var(--font-sans); }
	.tick, .axis { fill: #4a5873; font-size: 14px; font-weight: 700; text-anchor: middle; }
	.minimum { fill: #0f6b5e; font-size: 14px; font-weight: 700; }
	.tangent { fill: #14213d; font-size: 14px; font-weight: 700; paint-order: stroke; stroke: #fff; stroke-width: 4px; }
	.escaped { fill: #a4282f; font-size: 16px; font-weight: 700; text-anchor: middle; }
	.rates { display: flex; flex-wrap: wrap; gap: 0.4rem 1.2rem; margin: 0; padding: 0.6rem 0.9rem; border: 1px solid var(--color-line); border-radius: 0.4rem; }
	.rates legend { padding: 0 0.3rem; color: var(--color-muted); font-size: 0.9rem; font-weight: 700; }
	.rates label { display: flex; align-items: center; gap: 0.4rem; }
	.readout { padding: 0.8rem 1rem; border-left: 4px solid var(--color-accent); border-radius: 0.3rem; background: #f3faf8; }
	.readout p { margin: 0; }
	.readout__rule { margin-top: 0.3rem !important; color: #0b4f45; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; overflow-wrap: anywhere; }
	.readout__outcome { margin-top: 0.4rem !important; color: var(--color-muted); }
	.controls { display: flex; flex-wrap: wrap; gap: 0.6rem; }
	button { min-height: 2.7rem; padding: 0.5rem 0.9rem; border: 1px solid var(--color-primary); border-radius: 0.4rem; background: var(--color-primary); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
	button.secondary { background: #fff; color: var(--color-primary); }
	button:disabled { opacity: 0.45; cursor: not-allowed; }
	button:focus-visible, input:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	@media (max-width: 700px) { svg { min-width: 560px; } }
</style>
