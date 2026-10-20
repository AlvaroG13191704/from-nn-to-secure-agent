<script lang="ts">
	import { LOSS_EXAMPLES, averageLoss, squaredErrorLoss } from '#lib/domain/loss.js';
	import { formatNumber as fmt } from './format-number.js';

	const target = 10;
	let prediction = $state(6);
	const result = $derived(squaredErrorLoss(prediction, target));
	const par = (value: number) => (value < 0 ? `(${fmt(value)})` : fmt(value));

	// Number line from 0 to 20.
	const X0 = 40;
	const X1 = 600;
	const px = (value: number) => X0 + (value / 20) * (X1 - X0);
	const UNIT = (X1 - X0) / 20;
	// The square's side grows with the error (scaled to fit); its area is error².
	const side = $derived(Math.abs(result.error) * UNIT * 0.7);
	const verdict = $derived(
		result.error === 0 ? 'Predicción perfecta: no hay nada que corregir.' : Math.abs(result.error) <= 2 ? 'Error pequeño: la pérdida es baja.' : 'Error grande: el cuadrado crece rápido y la pérdida se dispara.'
	);
</script>

<div class="loss">
	<label class="loss__slider">
		<span>Predicción de la red <var>ŷ</var> = <strong>{fmt(prediction)}</strong> (respuesta esperada <var>y</var> = {target})</span>
		<input type="range" min="0" max="20" step="0.5" bind:value={prediction} />
	</label>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the SVG on narrow screens.) -->
	<div class="diagram-scroll" role="region" tabindex="0" aria-label="Error y pérdida; en pantallas pequeñas, desplázate horizontalmente">
		<svg viewBox="0 0 640 335" role="img" aria-labelledby="loss-title loss-desc">
			<title id="loss-title">El error como distancia y la pérdida como área</title>
			<desc id="loss-desc">ŷ = {fmt(prediction)}, y = {target}. Error {fmt(result.error)}, al cuadrado {fmt(result.squared)}, pérdida {fmt(result.loss)}.</desc>
			<line x1={X0} y1="70" x2={X1} y2="70" stroke="#9baec3" stroke-width="2" />
			{#each [0, 5, 10, 15, 20] as tick (tick)}
				<line x1={px(tick)} y1="64" x2={px(tick)} y2="76" stroke="#9baec3" stroke-width="2" />
				<text x={px(tick)} y="96" class="tick">{tick}</text>
			{/each}
			{#if result.error !== 0}
				<line x1={px(Math.min(prediction, target))} y1="70" x2={px(Math.max(prediction, target))} y2="70" stroke="#a4282f" stroke-width="6" stroke-linecap="round" />
				<text x={(px(prediction) + px(target)) / 2} y="54" class="error-label">error = {fmt(result.error)}</text>
			{/if}
			<circle cx={px(target)} cy="70" r="9" fill="#b7791f" stroke="#fff" stroke-width="3" />
			<text x={px(target)} y="28" class="mark mark--target">y = {target}</text>
			<circle cx={px(prediction)} cy="70" r="9" fill="#1f4fd1" stroke="#fff" stroke-width="3" />
			<text x={px(prediction)} y={prediction === target ? 120 : 28} class="mark mark--prediction">ŷ = {fmt(prediction)}</text>

			{#if side > 0}
				<rect class="square" x={px(Math.min(prediction, target))} y="128" width={side} height={side} />
				<text x={px(Math.min(prediction, target)) + side / 2} y={128 + side / 2 + 6} class="square-label">{fmt(result.squared)}</text>
				<text x={px(Math.min(prediction, target)) + side + 10} y={128 + Math.min(side, 40) / 2 + 6} class="square-note">área = error² = {fmt(result.squared)}</text>
			{/if}
		</svg>
	</div>

	<div class="loss__board" aria-live="polite">
		<p class="loss__line">error = ŷ − y = {fmt(prediction)} − {target} = {fmt(result.error)}</p>
		<p class="loss__line">error² = {par(result.error)}² = {fmt(result.squared)}</p>
		<p class="loss__line loss__line--result">L = ½ × {fmt(result.squared)} = {fmt(result.loss)}</p>
		<p class="loss__verdict">{verdict}</p>
	</div>

	<table class="batch">
		<caption>Con varios ejemplos, promediamos</caption>
		<thead><tr><th scope="col">Ejemplo</th><th scope="col">ŷ</th><th scope="col">y</th><th scope="col">Pérdida</th></tr></thead>
		<tbody>
			{#each LOSS_EXAMPLES as example, index (index)}
				<tr><th scope="row">{index + 1}</th><td>{example.prediction}</td><td>{example.target}</td><td>½({fmt(example.prediction - example.target)})² = {fmt(squaredErrorLoss(example.prediction, example.target).loss)}</td></tr>
			{/each}
		</tbody>
		<tfoot><tr><th scope="row" colspan="3">Pérdida del lote (promedio)</th><td>({LOSS_EXAMPLES.map((example) => fmt(squaredErrorLoss(example.prediction, example.target).loss)).join(' + ')}) ÷ {LOSS_EXAMPLES.length} = <strong>{fmt(averageLoss(LOSS_EXAMPLES))}</strong></td></tr></tfoot>
	</table>
</div>

<style>
	.loss { display: grid; gap: 0.9rem; }
	.loss__slider { display: grid; gap: 0.35rem; color: var(--color-ink); }
	.loss__slider input { width: 100%; accent-color: var(--color-primary); }
	.loss__slider input:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	.diagram-scroll { overflow-x: auto; overscroll-behavior-inline: contain; }
	.diagram-scroll:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	svg { display: block; width: 100%; height: auto; font-family: var(--font-sans); }
	.tick { fill: #4a5873; font-size: 14px; font-weight: 700; text-anchor: middle; }
	.mark { font-size: 16px; font-weight: 700; text-anchor: middle; }
	.mark--target { fill: #7a4f12; }
	.mark--prediction { fill: #1f4fd1; }
	.error-label { fill: #a4282f; font-size: 15px; font-weight: 700; text-anchor: middle; }
	.square { fill: rgb(164 40 47 / 14%); stroke: #a4282f; stroke-width: 2; transition: width 0.25s ease, height 0.25s ease, x 0.25s ease; }
	.square-label { fill: #a4282f; font-size: 18px; font-weight: 800; text-anchor: middle; }
	.square-note { fill: #4a5873; font-size: 14px; font-weight: 700; }
	.loss__board { padding: 0.8rem 1rem; border-left: 4px solid #a4282f; border-radius: 0.3rem; background: #fcf3f3; }
	.loss__board p { margin: 0; }
	.loss__line { color: #6b1a1f; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; }
	.loss__line--result { margin-top: 0.2rem !important; font-size: 1.15rem; font-weight: 800; }
	.loss__verdict { margin-top: 0.45rem !important; color: var(--color-muted); }
	.batch { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	.batch caption { margin-bottom: 0.4rem; color: var(--color-muted); font-weight: 700; text-align: left; }
	.batch th, .batch td { padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--color-line); text-align: left; font-variant-numeric: tabular-nums; }
	.batch thead th { color: var(--color-muted); font-size: 0.85rem; }
	.batch tfoot th, .batch tfoot td { border-bottom: 0; font-weight: 700; }
	@media (max-width: 700px) { svg { min-width: 520px; } }
	@media (prefers-reduced-motion: reduce) { .square { transition: none; } }
</style>
