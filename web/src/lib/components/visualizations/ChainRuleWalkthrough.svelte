<script lang="ts">
	import { calculateChainRuleExample } from '#lib/domain/backpropagation.js';
	import { formatNumber as fmt } from './format-number.js';
	import StepControls from './StepControls.svelte';

	const x = 2;
	const w = 3;
	const y = 10;
	const nudge = 0.01;
	const r = calculateChainRuleExample({ input: x, weight: w, target: y, nudge });
	const change = r.nudgedLoss - r.loss;

	const steps = [
		{
			title: 'Punto de partida',
			general: 'x = 2,  w = 3,  y = 10',
			worked: 'todavía no calculamos nada',
			note: 'Tenemos una entrada x, un peso w que queremos ajustar y la respuesta esperada y.'
		},
		{
			title: 'Hacia adelante: predicción',
			general: 'ŷ = w · x',
			worked: `ŷ = ${w} × ${x} = ${fmt(r.prediction)}`,
			note: 'La predicción sale del peso multiplicado por la entrada.'
		},
		{
			title: 'Hacia adelante: pérdida',
			general: 'L = ½ (ŷ − y)²',
			worked: `L = ½ (${fmt(r.prediction)} − ${y})² = ½ × ${fmt((r.prediction - y) ** 2)} = ${fmt(r.loss)}`,
			note: 'La pérdida mide qué tan lejos quedó la predicción del objetivo.'
		},
		{
			title: 'Hacia atrás: tramo de la pérdida',
			general: '∂L/∂ŷ = ŷ − y',
			worked: `∂L/∂ŷ = ${fmt(r.prediction)} − ${y} = ${fmt(r.dLossDPrediction)}`,
			note: `Leemos este número como una tasa: si ŷ sube un poco, L cambia ${fmt(r.dLossDPrediction)} veces ese poco. El signo negativo dice que subir ŷ baja la pérdida.`
		},
		{
			title: 'Hacia atrás: tramo del peso',
			general: '∂ŷ/∂w = x',
			worked: `∂ŷ/∂w = ${fmt(r.dPredictionDWeight)}`,
			note: `Si w sube un poco, ŷ sube ${fmt(r.dPredictionDWeight)} veces ese poco, porque ŷ = w × ${x}.`
		},
		{
			title: 'Regla de la cadena: multiplicamos los tramos',
			general: '∂L/∂w = (∂L/∂ŷ) · (∂ŷ/∂w)',
			worked: `∂L/∂w = (${fmt(r.dLossDPrediction)}) × (${fmt(r.dPredictionDWeight)}) = ${fmt(r.gradient)}`,
			note: `Cada tramo aporta su factor y el efecto total es el producto. Este ${fmt(r.gradient)} es el gradiente que usaremos en el descenso de gradiente (2.9).`
		},
		{
			title: 'Comprobación con números',
			general: 'ΔL ≈ (∂L/∂w) · Δw',
			worked: `w = ${fmt(r.nudgedWeight)} → ŷ = ${fmt(r.nudgedPrediction)} → L = ${fmt(r.nudgedLoss)};  ΔL = ${fmt(change)} ≈ ${fmt(r.gradient)} × ${nudge} = ${fmt(r.gradient * nudge)}`,
			note: 'Movemos el peso apenas 0.01 y recalculamos todo. La pérdida cambia casi exactamente lo que predijo el gradiente.'
		}
	];

	let step = $state(0);
	const current = $derived(steps[step]);
</script>

<div class="chain-walk">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the SVG on narrow screens.) -->
	<div class="diagram-scroll" role="region" tabindex="0" aria-label="Diagrama de la regla de la cadena; en pantallas pequeñas, desplázate horizontalmente">
		<svg viewBox="0 0 760 290" role="img" aria-labelledby="chain-walk-title chain-walk-desc">
			<title id="chain-walk-title">Regla de la cadena con x = 2, w = 3 e y = 10</title>
			<desc id="chain-walk-desc">{current.title}. {current.worked}</desc>
			<defs>
				<marker id="chain-fwd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#1f4fd1" /></marker>
				<marker id="chain-back" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#0f6b5e" /></marker>
			</defs>

			<g class="edge" class:lit={step === 1} fill="none" stroke="#1f4fd1" stroke-width="3" marker-end="url(#chain-fwd)"><path d="M182 92H300" /></g>
			<g class="edge" class:lit={step === 2} fill="none" stroke="#1f4fd1" stroke-width="3" marker-end="url(#chain-fwd)"><path d="M442 92H560" /></g>
			<g fill="#4a5873" font-size="15" font-weight="700" text-anchor="middle"><text x="241" y="78">× x = {x}</text><text x="501" y="78">½(ŷ − y)²</text></g>

			<g class="edge back" class:shown={step >= 3} class:lit={step === 3} fill="none" stroke="#0f6b5e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#chain-back)"><path d="M560 168H442" /></g>
			<g class="edge back" class:shown={step >= 4} class:lit={step === 4} fill="none" stroke="#0f6b5e" stroke-width="3" stroke-dasharray="7 6" marker-end="url(#chain-back)"><path d="M300 168H182" /></g>

			<rect x="60" y="56" width="122" height="72" rx="8" fill="#dfe7fb" stroke="#1f4fd1" stroke-width="2.5" />
			<rect x="300" y="56" width="142" height="72" rx="8" fill={step >= 1 ? '#dfe7fb' : '#fff'} stroke="#1f4fd1" stroke-width="2.5" />
			<rect x="560" y="56" width="142" height="72" rx="8" fill={step >= 2 ? '#dfe7fb' : '#fff'} stroke="#1f4fd1" stroke-width="2.5" />
			<rect x="580" y="218" width="102" height="40" rx="6" fill="#fbf3e2" stroke="#b7791f" stroke-width="2" />
			<path d="M631 218V128" stroke="#b7791f" stroke-width="2" stroke-dasharray="4 4" />

			<g fill="#14213d" font-weight="700" text-anchor="middle">
				<text x="121" y="88" font-size="16">peso</text><text x="121" y="113" font-size="22">w = {step === 6 ? fmt(r.nudgedWeight) : w}</text>
				<text x="371" y="88" font-size="16">predicción</text><text x="371" y="113" font-size="22">ŷ = {step === 0 ? '?' : step === 6 ? fmt(r.nudgedPrediction) : fmt(r.prediction)}</text>
				<text x="631" y="88" font-size="16">pérdida</text><text x="631" y="113" font-size="22">L = {step < 2 ? '?' : step === 6 ? fmt(r.nudgedLoss) : fmt(r.loss)}</text>
				<text x="631" y="244" font-size="17" fill="#7a4f12">y = {y}</text>
			</g>

			<g class="badge" class:shown={step >= 3}><rect x="436" y="182" width="130" height="34" rx="17" fill="#d5efe9" /><text x="501" y="205" text-anchor="middle" font-size="16" font-weight="700" fill="#0f6b5e">∂L/∂ŷ = {fmt(r.dLossDPrediction)}</text></g>
			<g class="badge" class:shown={step >= 4}><rect x="176" y="182" width="130" height="34" rx="17" fill="#d5efe9" /><text x="241" y="205" text-anchor="middle" font-size="16" font-weight="700" fill="#0f6b5e">∂ŷ/∂w = {fmt(r.dPredictionDWeight)}</text></g>
			<g class="badge" class:shown={step >= 5}><rect x="40" y="226" width="162" height="40" rx="6" fill="#0f6b5e" /><text x="121" y="252" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">∂L/∂w = {fmt(r.gradient)}</text></g>
			<g fill="#4a5873" font-size="13" font-weight="700" text-anchor="middle"><text x="371" y="36">hacia adelante: calculamos valores</text><text x="371" y="282" class="badge" class:shown={step >= 3}>hacia atrás: multiplicamos tasas de cambio</text></g>
		</svg>
	</div>

	<div class="board" aria-live="polite">
		<p class="board__title"><strong>Paso {step + 1} de {steps.length}.</strong> {current.title}</p>
		<p class="board__general">{current.general}</p>
		<p class="board__worked">{current.worked}</p>
		<p class="board__note">{current.note}</p>
	</div>

	<StepControls bind:step total={steps.length} label="Controles de la regla de la cadena" />
</div>

<style>
	.chain-walk { display: grid; gap: 0.9rem; }
	.diagram-scroll { overflow-x: auto; overscroll-behavior-inline: contain; }
	.diagram-scroll:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	svg { display: block; width: 100%; height: auto; font-family: var(--font-sans); }
	.edge { opacity: 0.35; transition: opacity 0.3s ease; }
	.edge.back { opacity: 0; }
	.edge.back.shown { opacity: 0.55; }
	.edge.lit, .edge.back.lit { opacity: 1; }
	.edge.back.lit path { animation: flow-back 0.9s linear infinite; }
	.badge { opacity: 0; transition: opacity 0.35s ease; }
	.badge.shown { opacity: 1; }
	.board { padding: 0.9rem 1.1rem; border-left: 4px solid var(--color-accent); border-radius: 0.3rem; background: #f3faf8; }
	.board p { margin: 0; }
	.board__title { color: var(--color-ink); }
	.board__general { margin-top: 0.5rem !important; color: var(--color-muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1rem; font-weight: 700; }
	.board__worked { margin-top: 0.25rem !important; color: #0b4f45; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(1rem, 1.5vw, 1.25rem); font-weight: 800; overflow-wrap: anywhere; }
	.board__note { margin-top: 0.5rem !important; color: var(--color-muted); line-height: 1.5; }
	@keyframes flow-back { to { stroke-dashoffset: -26; } }
	@media (max-width: 700px) { svg { min-width: 640px; } }
	@media (prefers-reduced-motion: reduce) { .edge, .badge { transition: none; } .edge.back.lit path { animation: none; } }
</style>
