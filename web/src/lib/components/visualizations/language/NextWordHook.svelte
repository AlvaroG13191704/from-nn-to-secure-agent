<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { HOOK_EXAMPLE, nextTokenDistribution } from '#lib/domain/language/next-token.js';

	const candidates = HOOK_EXAMPLE.candidates;
	const probabilities = nextTokenDistribution(candidates, 1);
	const mostLikelyIndex = probabilities.indexOf(Math.max(...probabilities));

	let guessIndex = $state<number | null>(null);
	let barsGrown = $state(false);
	let reducedMotion = $state(false);

	const formatPercent = (value: number) => `${(value * 100).toFixed(0)} %`;
	const guessedMostLikely = $derived(guessIndex === mostLikelyIndex);

	onMount(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = query.matches;
		const update = (event: MediaQueryListEvent) => (reducedMotion = event.matches);
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	async function choose(index: number) {
		guessIndex = index;
		barsGrown = reducedMotion;
		if (reducedMotion) return;
		// Render the bars at zero width first so the width transition can play.
		await tick();
		requestAnimationFrame(() => (barsGrown = true));
	}

	function reset() {
		guessIndex = null;
		barsGrown = false;
	}
</script>

<section class="next-word-hook" aria-labelledby="next-word-hook-title">
	<p class="stage-label">Antes de empezar</p>
	<h3 id="next-word-hook-title">¿Qué palabra sigue?</h3>
	<p class="prompt">
		{HOOK_EXAMPLE.prompt} <span class="blank">{guessIndex === null ? '___' : candidates[guessIndex].token}</span>
	</p>

	{#if guessIndex === null}
		<p class="instruction">Elige tú primero la palabra que crees que sigue. Después te muestro qué haría un modelo de lenguaje.</p>
	{/if}

	<div class="choices" role="group" aria-label="Elige la siguiente palabra">
		{#each candidates as candidate, index (candidate.token)}
			<button
				type="button"
				class:selected={guessIndex === index}
				aria-pressed={guessIndex === index}
				disabled={guessIndex !== null}
				onclick={() => choose(index)}
			>
				{candidate.token}
			</button>
		{/each}
	</div>

	<div aria-live="polite">
		{#if guessIndex !== null}
			<div class="result">
				<h4>Probabilidades de nuestro modelo de juguete</h4>
				<ul class="bars">
					{#each candidates as candidate, index (candidate.token)}
						<li class:guess={index === guessIndex} class:top={index === mostLikelyIndex}>
							<span class="bar-label">
								{candidate.token}
								{#if index === guessIndex}<span class="tag guess-tag">tu elección</span>{/if}
								{#if index === mostLikelyIndex}<span class="tag top-tag">más probable</span>{/if}
							</span>
							<span class="track">
								<span class="fill" class:animated={!reducedMotion} style:width={barsGrown ? `${probabilities[index] * 100}%` : '0%'}></span>
							</span>
							<span class="value">{formatPercent(probabilities[index])}</span>
						</li>
					{/each}
				</ul>
				<p class="message">
					{#if guessedMostLikely}
						Elegiste la misma palabra que el modelo considera más probable.
					{:else}
						Elegiste «{candidates[guessIndex].token}» y el modelo prefiere «{candidates[mostLikelyIndex].token}», pero tu opción también tiene probabilidad.
					{/if}
					Voy a mostrarte que un modelo de lenguaje hace lo mismo que tú acabas de hacer: asigna una probabilidad a cada posible palabra siguiente. No hay una única respuesta «correcta».
				</p>
				<button type="button" class="reset" onclick={reset}>Volver a intentar</button>
			</div>
		{/if}
	</div>
</section>

<style>
	.next-word-hook { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	.prompt { margin: .5rem 0 1rem; color: #17253a; font-size: clamp(1.5rem, 4.5vw, 2.6rem); font-weight: 800; line-height: 1.25; overflow-wrap: anywhere; }
	.blank { color: #1d4ed8; border-bottom: 4px solid #f97316; }
	.instruction { color: #52627a; line-height: 1.6; max-width: 70ch; }
	.choices { display: flex; flex-wrap: wrap; gap: .6rem; margin: .8rem 0 1.2rem; }
	.choices button { min-height: 2.75rem; padding: .5rem 1rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-size: 1.05rem; font-weight: 800; cursor: pointer; }
	.choices button:disabled { cursor: default; opacity: .65; }
	.choices button.selected { border-color: #1d4ed8; background: #dbeafe; color: #1d4ed8; opacity: 1; }
	button:focus-visible { outline: 3px solid #93c5fd; outline-offset: 3px; }
	.result { padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	h4 { margin: 0 0 .75rem; color: #17253a; font-size: 1.1rem; }
	.bars { display: grid; gap: .55rem; margin: 0; padding: 0; list-style: none; }
	.bars li { display: grid; grid-template-columns: minmax(7rem, 12rem) minmax(0, 1fr) 3.5rem; align-items: center; gap: .6rem; }
	.bar-label { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem; color: #17253a; font-size: 1.05rem; font-weight: 800; }
	.tag { padding: .1rem .45rem; border-radius: 999px; font-size: .72rem; font-weight: 800; }
	.guess-tag { background: #ffedd5; color: #9a3412; }
	.top-tag { background: #ccfbf1; color: #134e4a; }
	.track { height: 1.4rem; border-radius: .5rem; background: #eef2f7; overflow: hidden; }
	.fill { display: block; height: 100%; border-radius: .5rem; background: #93c5fd; }
	.fill.animated { transition: width .8s ease-out; }
	.top .fill { background: #0f766e; }
	.guess .fill { background: #f97316; }
	.value { color: #17253a; font-weight: 800; font-variant-numeric: tabular-nums; text-align: right; }
	.message { margin: 1rem 0; color: #24364b; line-height: 1.6; max-width: 76ch; }
	.reset { min-height: 2.5rem; padding: .45rem 1rem; border: 1px solid #1d4ed8; border-radius: 999px; background: white; color: #1d4ed8; font: inherit; font-weight: 800; cursor: pointer; }
	@media (max-width: 560px) {
		.bars li { grid-template-columns: minmax(0, 1fr) 3.2rem; }
		.bar-label { grid-column: 1 / -1; }
	}
	@media (prefers-reduced-motion: reduce) { .fill.animated { transition: none; } }
</style>
