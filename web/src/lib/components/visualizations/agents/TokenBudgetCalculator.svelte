<script lang="ts">
	import { BUDGET_LIMITS, REFERENCE_PRICING, formatUsd } from '#lib/domain/agents/budget.js';

	const id = $props.id();

	// Teaching estimates (approximate token counts per piece).
	const TOKENS_PER_TOOL = 60;
	const TOKENS_PER_FRAGMENT = 70;
	const TOKENS_PER_PREVIOUS_STEP = 120;
	const WORKSHOP_STUDENTS = 40;

	const instructionOptions = [
		{ id: 'short', label: 'Corto', tokens: 80 },
		{ id: 'medium', label: 'Medio', tokens: 250 },
		{ id: 'long', label: 'Largo', tokens: 700 }
	];
	const answerOptions = [
		{ id: 'short', label: 'Corta', tokens: 60 },
		{ id: 'medium', label: 'Media', tokens: 200 },
		{ id: 'long', label: 'Larga', tokens: 500 }
	];

	let tools = $state(3);
	let fragments = $state(3);
	let steps = $state(3);
	let instructionId = $state('medium');
	let answerId = $state('short');

	const instructionTokens = $derived(instructionOptions.find((option) => option.id === instructionId)?.tokens ?? 0);
	const outputPerStep = $derived(answerOptions.find((option) => option.id === answerId)?.tokens ?? 0);
	const toolTokens = $derived(tools * TOKENS_PER_TOOL);
	const ragTokens = $derived(fragments * TOKENS_PER_FRAGMENT);
	const fixedInput = $derived(instructionTokens + toolTokens + ragTokens);

	// Step k (1-based) re-sends the fixed part plus the history of the k - 1 previous steps.
	const lastHistory = $derived((steps - 1) * TOKENS_PER_PREVIOUS_STEP);
	const lastStepInput = $derived(fixedInput + lastHistory);
	const totalInput = $derived(steps * fixedInput + TOKENS_PER_PREVIOUS_STEP * ((steps * (steps - 1)) / 2));
	const totalOutput = $derived(steps * outputPerStep);
	const inputCost = $derived((totalInput * REFERENCE_PRICING.inputPerMillion) / 1_000_000);
	const outputCost = $derived((totalOutput * REFERENCE_PRICING.outputPerMillion) / 1_000_000);
	const runCost = $derived(inputCost + outputCost);
	const runsPerStudent = $derived(Math.floor(BUDGET_LIMITS.studentCapUsd / runCost));
	const runsWorkshop = $derived(Math.floor(BUDGET_LIMITS.globalCapUsd / runCost));
	const outputRatio = REFERENCE_PRICING.outputPerMillion / REFERENCE_PRICING.inputPerMillion;

	const segments = $derived([
		{ id: 'instructions', label: 'Instrucciones', tokens: instructionTokens, color: '#1d4ed8' },
		{ id: 'tools', label: 'Herramientas', tokens: toolTokens, color: '#0f766e' },
		{ id: 'rag', label: 'Fragmentos RAG', tokens: ragTokens, color: '#7c3aed' },
		{ id: 'history', label: 'Historial', tokens: lastHistory, color: '#f97316' }
	]);

	function format(value: number) {
		return value.toLocaleString('es-GT');
	}
</script>

<section class="token-budget" aria-labelledby="{id}-title">
	<p class="stage-label">Tokens, contexto y costo</p>
	<h3 id="{id}-title">¿Cuánto cuesta una corrida de mi agente?</h3>
	<p>Cada paso del ciclo es una llamada nueva al modelo, y en cada llamada vuelvo a enviar todo: instrucciones, herramientas, fragmentos y el historial. Mueve los controles y mira cómo crece la cuenta.</p>

	<div class="controls">
		<label class="slider" for="{id}-tools">
			<span>Herramientas: <strong>{tools}</strong> <small>(≈ {TOKENS_PER_TOOL} tokens c/u)</small></span>
			<input id="{id}-tools" type="range" min="0" max="6" step="1" bind:value={tools} />
		</label>
		<label class="slider" for="{id}-fragments">
			<span>Fragmentos RAG (top-k): <strong>{fragments}</strong> <small>(≈ {TOKENS_PER_FRAGMENT} tokens c/u)</small></span>
			<input id="{id}-fragments" type="range" min="0" max="5" step="1" bind:value={fragments} />
		</label>
		<label class="slider" for="{id}-steps">
			<span>Pasos del ciclo: <strong>{steps}</strong> <small>(máximo {BUDGET_LIMITS.maxSteps})</small></span>
			<input id="{id}-steps" type="range" min="1" max={BUDGET_LIMITS.maxSteps} step="1" bind:value={steps} />
		</label>
		<fieldset>
			<legend>Largo de las instrucciones</legend>
			<div class="options">
				{#each instructionOptions as option (option.id)}
					<label class:selected={instructionId === option.id}><input type="radio" name="{id}-instructions" value={option.id} bind:group={instructionId} /> {option.label} <small>≈ {option.tokens}</small></label>
				{/each}
			</div>
		</fieldset>
		<fieldset>
			<legend>Largo de la respuesta por paso</legend>
			<div class="options">
				{#each answerOptions as option (option.id)}
					<label class:selected={answerId === option.id}><input type="radio" name="{id}-answer" value={option.id} bind:group={answerId} /> {option.label} <small>≈ {option.tokens}</small></label>
				{/each}
			</div>
		</fieldset>
	</div>

	<div class="window">
		<h4>Ventana de contexto en el último paso (paso {steps})</h4>
		<div class="stack" role="img" aria-label={`Entrada del último paso: ${segments.map((segment) => `${segment.label} ${segment.tokens} tokens`).join(', ')}; total ${lastStepInput} tokens`}>
			{#each segments as segment (segment.id)}
				{#if segment.tokens > 0}
					<span class="segment" style:flex-grow={segment.tokens} style:background={segment.color}></span>
				{/if}
			{/each}
		</div>
		<ul class="legend">
			{#each segments as segment (segment.id)}
				<li><span class="swatch" style:background={segment.color}></span>{segment.label}: <strong>{format(segment.tokens)}</strong></li>
			{/each}
		</ul>
		<p class="note">Total de entrada en este paso: <strong>{format(lastStepInput)}</strong> tokens. La parte naranja crece en cada paso.</p>
	</div>

	<dl class="results" aria-live="polite">
		<div><dt>Entrada en toda la corrida</dt><dd>{format(totalInput)} tokens</dd></div>
		<div><dt>Salida en toda la corrida</dt><dd>{format(totalOutput)} tokens</dd></div>
		<div><dt>Costo por corrida</dt><dd>{formatUsd(runCost)}</dd><small>entrada {formatUsd(inputCost)} · salida {formatUsd(outputCost)}</small></div>
		<div class="highlight"><dt>Corridas con tus {formatUsd(BUDGET_LIMITS.studentCapUsd)}</dt><dd>{format(runsPerStudent)}</dd></div>
		<div><dt>Corridas con el tope del taller ({formatUsd(BUDGET_LIMITS.globalCapUsd)} para ~{WORKSHOP_STUDENTS})</dt><dd>{format(runsWorkshop)}</dd></div>
	</dl>

	<ul class="lessons">
		<li><strong>El contexto se reenvía en cada paso.</strong> Un agente de 6 pasos paga sus instrucciones 6 veces.</li>
		<li><strong>La salida cuesta {outputRatio} veces más</strong> que la entrada: pide respuestas cortas y con formato.</li>
		<li><strong>Más no siempre es mejor.</strong> Más herramientas o fragmentos llenan el contexto, confunden al modelo y no siempre mejoran la respuesta.</li>
	</ul>

	<details>
		<summary>¿Cómo lo calculo?</summary>
		<ul class="formulas">
			<li>Parte fija = instrucciones + {TOKENS_PER_TOOL} × herramientas + {TOKENS_PER_FRAGMENT} × fragmentos = {instructionTokens} + {toolTokens} + {ragTokens} = <strong>{fixedInput}</strong></li>
			<li>Entrada del paso k = parte fija + {TOKENS_PER_PREVIOUS_STEP} × (k − 1)</li>
			<li>Entrada total = {steps} × {fixedInput} + {TOKENS_PER_PREVIOUS_STEP} × ({steps} × {steps - 1} ÷ 2) = <strong>{format(totalInput)}</strong></li>
			<li>Salida total = {steps} × {outputPerStep} = <strong>{format(totalOutput)}</strong></li>
			<li>Costo = (entrada × ${REFERENCE_PRICING.inputPerMillion} + salida × ${REFERENCE_PRICING.outputPerMillion}) ÷ 1 000 000 = <strong>{formatUsd(runCost)}</strong></li>
			<li>Corridas = ⌊presupuesto ÷ costo por corrida⌋</li>
		</ul>
		<p class="note">Los tokens por pieza son estimaciones aproximadas; el modelo real puede gastar además tokens de «pensamiento», que se cobran como salida.</p>
	</details>
</section>

<style>
	.token-budget { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	h4 { margin: 0 0 .5rem; color: #17253a; font-size: 1.15rem; }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr)); gap: .9rem; margin-top: 1rem; padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.slider { display: grid; gap: .35rem; color: #17253a; font-weight: 750; }
	.slider small, .options small { color: #52627a; font-weight: 600; }
	.slider input { width: 100%; accent-color: #1d4ed8; }
	.slider input:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
	legend { margin-bottom: .35rem; padding: 0; color: #17253a; font-weight: 750; }
	.options { display: flex; flex-wrap: wrap; gap: .4rem; }
	.options label { display: inline-flex; gap: .35rem; align-items: center; min-height: 2.75rem; padding: .3rem .85rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font-weight: 800; cursor: pointer; box-sizing: border-box; }
	.options label.selected { border-color: #1d4ed8; background: #dbeafe; }
	.options input { accent-color: #1d4ed8; }
	.options label:has(input:focus-visible) { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.window { margin-top: 1rem; padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: white; }
	.stack { display: flex; height: 2.2rem; overflow: hidden; border: 1px solid #d9e1eb; border-radius: .6rem; background: #f1f5f9; }
	.segment { flex-basis: 0; min-width: 3px; transition: flex-grow .4s ease; }
	.legend { display: flex; flex-wrap: wrap; gap: .4rem 1rem; margin: .6rem 0 0; padding: 0; color: #17253a; list-style: none; }
	.legend li { display: inline-flex; gap: .35rem; align-items: center; }
	.swatch { width: .9rem; height: .9rem; border-radius: .2rem; }
	.results { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: .5rem; margin: 1rem 0; }
	.results div { padding: .6rem .8rem; border: 1px solid #d9e1eb; border-radius: .8rem; background: white; }
	.results .highlight { border-color: #0f766e; background: #ccfbf1; }
	.results dt { color: #52627a; font-size: .85rem; font-weight: 700; }
	.results dd { margin: 0; color: #17253a; font-size: 1.35rem; font-weight: 800; font-variant-numeric: tabular-nums; }
	.results small { color: #52627a; font-size: .82rem; }
	.lessons { display: grid; gap: .4rem; margin: 0 0 1rem; padding-left: 1.2rem; color: #17253a; line-height: 1.5; }
	details { padding: .75rem 1rem; border: 1px solid #d9e1eb; border-radius: .8rem; background: #fbfdff; }
	summary { color: #1d4ed8; font-weight: 800; cursor: pointer; }
	summary:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.formulas { display: grid; gap: .35rem; margin: .6rem 0; padding-left: 1.2rem; color: #17253a; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
	.note { margin-bottom: 0; font-size: .95rem; }
	@media (prefers-reduced-motion: reduce) { .segment { transition: none; } }
</style>
