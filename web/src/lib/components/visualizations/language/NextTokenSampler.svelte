<script lang="ts">
	import { GENERATION_STEPS, NEXT_TOKEN_EXAMPLE, nextTokenDistribution, sampleTokenIndex } from '#lib/domain/language/next-token.js';

	const HISTORY_LIMIT = 12;

	let temperature = $state(1);
	let history = $state<Array<{ token: string; temperature: number }>>([]);
	let generationStep = $state(0);

	const candidates = NEXT_TOKEN_EXAMPLE.candidates;
	const probabilities = $derived(nextTokenDistribution(candidates, temperature));
	const regime = $derived(temperature === 0 ? 'greedy' : temperature < 0.7 ? 'low' : temperature <= 1.2 ? 'medium' : 'high');
	const lastPick = $derived(history.at(-1));

	const regimes = [
		{ id: 'greedy', label: 'T = 0', text: 'siempre elijo el token más probable (decodificación «greedy»).' },
		{ id: 'low', label: 'T baja', text: 'las respuestas son predecibles: casi siempre gana el favorito.' },
		{ id: 'medium', label: 'T ≈ 1', text: 'uso las probabilidades tal como las calculó el modelo.' },
		{ id: 'high', label: 'T alta', text: 'hay más variedad, pero también más riesgo de decir algo sin sentido.' }
	];

	const generatedTokens = $derived(GENERATION_STEPS.slice(0, generationStep).map((item) => item.chosen));
	const currentStep = $derived(generationStep > 0 ? GENERATION_STEPS[generationStep - 1] : undefined);
	const inputText = $derived(joinTokens(NEXT_TOKEN_EXAMPLE.prompt, generatedTokens.slice(0, -1)));

	function isPunctuation(token: string) {
		return /^[.,;:!?]$/.test(token);
	}

	function joinTokens(prompt: string, tokens: string[]) {
		return tokens.reduce((text, token) => (isPunctuation(token) ? `${text}${token}` : `${text} ${token}`), prompt);
	}

	function percent(value: number) {
		const rounded = value * 100;
		return `${rounded < 1 && rounded > 0 ? rounded.toFixed(1) : Math.round(rounded)} %`;
	}

	function sample() {
		const index = sampleTokenIndex(probabilities, Math.random());
		history = [...history, { token: candidates[index].token, temperature }].slice(-HISTORY_LIMIT);
	}
</script>

<section class="next-token" aria-labelledby="next-token-title">
	<p class="stage-label">Un LLM predice el siguiente token</p>
	<h3 id="next-token-title">La temperatura cambia cómo elijo</h3>
	<p>El modelo no escribe una respuesta completa de golpe: calcula una probabilidad para cada token que podría seguir. Mueve la temperatura y observa cómo se reparten las probabilidades.</p>

	<p class="prompt">{NEXT_TOKEN_EXAMPLE.prompt} <span class="blank">___</span></p>

	<label class="slider" for="temperature-slider">
		<span>Temperatura T: <strong>{temperature.toFixed(1)}</strong></span>
		<input id="temperature-slider" type="range" min="0" max="2" step="0.1" bind:value={temperature} />
		<span class="range-labels"><span>0 · predecible</span><span>1</span><span>2 · variada</span></span>
	</label>

	<ul class="bars" aria-label={`Probabilidades con temperatura ${temperature.toFixed(1)}`}>
		{#each candidates as candidate, index (candidate.token)}
			<li class:warning={candidate.token === 'Antigua'}>
				<span class="token">{candidate.token}</span>
				<span class="track"><span class="fill" style:width={`${probabilities[index] * 100}%`}></span></span>
				<span class="value">{percent(probabilities[index])}</span>
			</li>
		{/each}
	</ul>

	<ul class="regimes">
		{#each regimes as item (item.id)}
			<li class:active={regime === item.id}><strong>{item.label}:</strong> {item.text}</li>
		{/each}
	</ul>
	<p class="hallucination">«Antigua» fue la capital en la época colonial: es una continuación <em>plausible</em> pero incorrecta hoy. Así se ve una alucinación: un texto que suena bien y no es verdad.</p>

	<div class="sampler">
		<div class="sampler-actions">
			<button type="button" class="primary" onclick={sample}>Elegir un token</button>
			<button type="button" onclick={() => (history = [])} disabled={history.length === 0}>Borrar historial</button>
		</div>
		<p class="pick" aria-live="polite">
			{#if lastPick}Con T = {lastPick.temperature.toFixed(1)} salió «{lastPick.token}».{:else}Aún no has elegido ningún token.{/if}
		</p>
		{#if history.length > 0}
			<ol class="history" aria-label="Historial de tokens elegidos">
				{#each history as item, index (index)}
					<li class:warning={item.token === 'Antigua'}>{item.token} <small>T = {item.temperature.toFixed(1)}</small></li>
				{/each}
			</ol>
		{/if}
	</div>

	<div class="loop">
		<h4>El ciclo autorregresivo</h4>
		<p>Cada token nuevo se agrega a la entrada y todo el proceso se repite. Avanza paso a paso:</p>
		<p class="generated" aria-live="polite">
			{NEXT_TOKEN_EXAMPLE.prompt}{#each generatedTokens as token, index (index)}{isPunctuation(token) ? '' : ' '}<mark class:latest={index === generatedTokens.length - 1}>{token}</mark>{/each}
		</p>
		{#if currentStep}
			<div class="step-card">
				<p>Paso {generationStep} de {GENERATION_STEPS.length}. Entrada: «{inputText}»</p>
				<p>Elegí <strong>«{currentStep.chosen}»</strong>; también consideraba {currentStep.alternatives.map((item) => `«${item}»`).join(' y ')}.</p>
			</div>
		{:else}
			<div class="step-card"><p>Paso 0: solo tengo el texto inicial.</p></div>
		{/if}
		<div class="sampler-actions">
			<button type="button" class="primary" onclick={() => (generationStep += 1)} disabled={generationStep >= GENERATION_STEPS.length}>Siguiente token</button>
			<button type="button" onclick={() => (generationStep = 0)} disabled={generationStep === 0}>Reiniciar</button>
		</div>
		<p class="note">La <strong>ventana de contexto</strong> limita cuántos tokens caben en esa entrada: si la conversación crece demasiado, lo más antiguo queda fuera y el modelo ya no lo «ve».</p>
	</div>
</section>

<style>
	.next-token { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	h4 { margin: 0 0 .4rem; color: #17253a; font-size: 1.2rem; }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.prompt { margin: 1rem 0; color: #17253a; font-size: clamp(1.2rem, 3vw, 1.6rem); font-weight: 800; }
	.blank { color: #1d4ed8; }
	.slider { display: grid; gap: .35rem; max-width: 46rem; color: #17253a; font-weight: 750; }
	.slider input { width: 100%; accent-color: #1d4ed8; }
	.range-labels { display: flex; justify-content: space-between; color: #52627a; font-size: .82rem; font-weight: 600; }
	.bars { display: grid; gap: .5rem; margin: 1rem 0; padding: 0; list-style: none; }
	.bars li { display: grid; grid-template-columns: minmax(4.5rem, 6.5rem) minmax(0, 1fr) 4rem; align-items: center; gap: .6rem; }
	.token { color: #17253a; font-size: 1.05rem; font-weight: 800; }
	.track { height: 1.4rem; overflow: hidden; border: 1px solid #d9e1eb; border-radius: 999px; background: white; }
	.fill { display: block; height: 100%; border-radius: 999px; background: #1d4ed8; transition: width .45s ease; }
	.bars li.warning .fill { background: #f97316; }
	.value { color: #17253a; font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
	.regimes { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
	.regimes li { padding: .45rem .75rem; border: 1px solid transparent; border-radius: .6rem; color: #52627a; }
	.regimes li.active { border-color: #1d4ed8; background: #dbeafe; color: #17253a; }
	.hallucination { padding: .6rem .9rem; border-left: 4px solid #f97316; border-radius: .5rem; background: #fff7ed; color: #17253a; }
	.sampler, .loop { margin-top: 1rem; padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.sampler-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
	button { min-height: 2.75rem; padding: .45rem 1rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	button.primary { border-color: #1d4ed8; background: #1d4ed8; color: white; }
	button:disabled { opacity: .5; cursor: not-allowed; }
	button:focus-visible, .slider input:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.pick { margin: .6rem 0; color: #17253a; font-weight: 800; }
	.history { display: flex; flex-wrap: wrap; gap: .4rem; margin: 0; padding: 0; list-style: none; }
	.history li { padding: .25rem .65rem; border: 1px solid #d9e1eb; border-radius: 999px; background: white; color: #17253a; font-weight: 750; }
	.history li.warning { border-color: #f97316; background: #fff7ed; }
	.history small { color: #52627a; font-weight: 600; }
	.generated { margin: .6rem 0; padding: .75rem 1rem; border-radius: .7rem; background: white; color: #17253a; font-size: clamp(1.1rem, 2.6vw, 1.4rem); font-weight: 800; overflow-wrap: anywhere; }
	mark { padding: 0 .2rem; border-radius: .3rem; background: #ccfbf1; color: #134e4a; }
	mark.latest { background: #0f766e; color: white; }
	.step-card { margin-bottom: .75rem; padding: .5rem .9rem; border-left: 4px solid #0f766e; border-radius: .5rem; background: #f0fdfa; }
	.step-card p { margin: .2rem 0; color: #17253a; }
	.note { margin-bottom: 0; font-size: .95rem; }
	@media (prefers-reduced-motion: reduce) { .fill { transition: none; } }
</style>
