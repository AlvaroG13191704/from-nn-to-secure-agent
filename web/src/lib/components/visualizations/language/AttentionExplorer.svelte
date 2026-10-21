<script lang="ts">
	import { attentionMatrix, EXPLORER_SENTENCES } from '#lib/domain/language/attention-lab.js';

	const COLUMN = 96;
	const BASE_Y = 150;

	let sentenceId = $state<'river' | 'money'>('river');
	let causal = $state(false);
	let queryIndex = $state(EXPLORER_SENTENCES[0].tokens.length - 1);

	const sentence = $derived(EXPLORER_SENTENCES.find((item) => item.id === sentenceId) ?? EXPLORER_SENTENCES[0]);
	const tokens = $derived(sentence.tokens);
	const matrix = $derived(attentionMatrix(tokens.map((token) => token.vector), causal));
	const weights = $derived(matrix[Math.min(queryIndex, tokens.length - 1)] ?? []);
	const queryWord = $derived(tokens[queryIndex]?.word ?? '');
	const width = $derived(tokens.length * COLUMN);

	const topOther = $derived.by(() => {
		let best = -1;
		weights.forEach((weight, index) => {
			if (index !== queryIndex && weight > 0 && (best === -1 || weight > weights[best])) best = index;
		});
		return best;
	});

	const summary = $derived(
		topOther === -1
			? `«${queryWord}» es la primera palabra: con atención causal solo puede mirarse a sí misma (100 %).`
			: `«${queryWord}» presta ${percent(weights[topOther])} de su atención a «${tokens[topOther].word}».`
	);

	function percent(value: number) {
		return `${Math.round(value * 100)} %`;
	}

	function isMasked(index: number) {
		return causal && index > queryIndex;
	}

	function centerX(index: number) {
		return index * COLUMN + COLUMN / 2;
	}

	function arcPath(target: number) {
		const from = centerX(queryIndex);
		if (target === queryIndex) {
			return `M ${from - 12} ${BASE_Y} C ${from - 34} ${BASE_Y - 46}, ${from + 34} ${BASE_Y - 46}, ${from + 12} ${BASE_Y}`;
		}
		const to = centerX(target);
		const height = Math.min(BASE_Y - 12, Math.abs(to - from) * 0.42 + 24);
		return `M ${from} ${BASE_Y} Q ${(from + to) / 2} ${BASE_Y - height * 2} ${to} ${BASE_Y}`;
	}

	function selectSentence(id: 'river' | 'money') {
		sentenceId = id;
		const next = EXPLORER_SENTENCES.find((item) => item.id === id) ?? EXPLORER_SENTENCES[0];
		queryIndex = next.tokens.length - 1;
	}
</script>

<section class="attention-explorer" aria-labelledby="attention-explorer-title">
	<p class="stage-label">Mapa de atención interactivo</p>
	<h3 id="attention-explorer-title">¿A quién mira «banco»?</h3>
	<p>Voy a tomar una palabra como <strong>consulta</strong> y medir cuánto se parece a cada palabra de la frase. Los arcos más gruesos indican más atención. Haz clic en cualquier palabra para convertirla en la consulta.</p>

	<div class="controls">
		<div class="toggle-group" role="group" aria-label="Frase de ejemplo">
			{#each EXPLORER_SENTENCES as option (option.id)}
				<button type="button" class:active={sentenceId === option.id} aria-pressed={sentenceId === option.id} onclick={() => selectSentence(option.id)}>
					{option.tokens.map((token) => token.word).join(' ')}
				</button>
			{/each}
		</div>
		<label class="causal-toggle">
			<input type="checkbox" bind:checked={causal} />
			<span>Atención causal (como en un LLM): solo mira hacia atrás</span>
		</label>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The map is keyboard-scrollable on narrow screens.) -->
	<div class="map-scroll" tabindex="0" role="region" aria-label="Mapa de atención; desplázate horizontalmente si no cabe">
		<div class="map" style:width={`${width}px`}>
			<svg viewBox={`0 0 ${width} ${BASE_Y + 6}`} width={width} height={BASE_Y + 6} role="img" aria-labelledby="attention-svg-title attention-svg-desc">
				<title id="attention-svg-title">Arcos de atención desde «{queryWord}»</title>
				<desc id="attention-svg-desc">
					{tokens.map((token, index) => `${token.word}: ${isMasked(index) ? 'oculta' : percent(weights[index] ?? 0)}`).join('; ')}
				</desc>
				{#each tokens as token, index (`${sentenceId}-${index}`)}
					{#if !isMasked(index)}
						<path
							d={arcPath(index)}
							class="arc"
							class:self={index === queryIndex}
							style:stroke-width={1.5 + (weights[index] ?? 0) * 16}
							style:opacity={0.2 + (weights[index] ?? 0) * 0.8}
						>
							<title>{token.word}: {percent(weights[index] ?? 0)}</title>
						</path>
					{/if}
				{/each}
				<circle cx={centerX(queryIndex)} cy={BASE_Y} r="7" class="query-dot" />
			</svg>
			<ol class="token-row" style:grid-template-columns={`repeat(${tokens.length}, ${COLUMN}px)`}>
				{#each tokens as token, index (`${sentenceId}-token-${index}`)}
					<li class:masked={isMasked(index)}>
						<button
							type="button"
							class:query={index === queryIndex}
							aria-pressed={index === queryIndex}
							aria-label={`${token.word}: ${isMasked(index) ? 'oculta por la máscara causal' : `recibe ${percent(weights[index] ?? 0)}`}. Usar como consulta.`}
							onclick={() => (queryIndex = index)}
						>{token.word}</button>
						<span class="weight">{isMasked(index) ? '0 %' : percent(weights[index] ?? 0)}</span>
						{#if isMasked(index)}<span class="mask-note">oculta</span>{/if}
					</li>
				{/each}
			</ol>
			<div class="heat-strip" aria-hidden="true" style:grid-template-columns={`repeat(${tokens.length}, ${COLUMN}px)`}>
				{#each tokens as _, index (`${sentenceId}-heat-${index}`)}
					<span class:masked={isMasked(index)} style:background-color={`rgba(249, 115, 22, ${isMasked(index) ? 0 : 0.08 + (weights[index] ?? 0) * 0.92})`}></span>
				{/each}
			</div>
		</div>
	</div>

	<p class="summary" aria-live="polite">{summary}</p>
	{#if causal && queryIndex === tokens.length - 1}
		<p class="hint">«{queryWord}» es la última palabra, así que la máscara causal no le oculta nada. Elige una palabra anterior para ver cómo se apagan las que vienen después.</p>
	{/if}

	<p class="caption">Aquí simplifico: cada palabra usa su propio vector como consulta <var>q</var>, clave <var>k</var> y valor <var>v</var>. En un Transformer real, la red <strong>aprende matrices</strong> que producen <var>q</var>, <var>k</var> y <var>v</var> a partir de cada embedding, y varias «cabezas» de atención buscan relaciones distintas en paralelo (por ejemplo, quién hace la acción o dónde ocurre).</p>
</section>

<style>
	.attention-explorer { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.controls { display: grid; gap: .75rem; margin: 1rem 0; }
	.toggle-group { display: flex; flex-wrap: wrap; gap: .5rem; }
	.toggle-group button, .token-row button { min-height: 2.75rem; padding: .45rem .85rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	.toggle-group button { font-size: .95rem; text-align: left; }
	.toggle-group button.active { border-color: #1d4ed8; background: #dbeafe; color: #1e3a8a; }
	.causal-toggle { display: flex; align-items: center; gap: .6rem; color: #17253a; font-weight: 750; cursor: pointer; }
	.causal-toggle input { width: 1.3rem; height: 1.3rem; accent-color: #0f766e; flex: none; }
	button:focus-visible, .causal-toggle input:focus-visible, .map-scroll:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.map-scroll { max-width: 100%; overflow-x: auto; padding: .75rem .25rem .5rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.map { margin: 0 auto; }
	svg { display: block; overflow: visible; }
	.arc { fill: none; stroke: #f97316; stroke-linecap: round; transition: stroke-width .35s ease, opacity .35s ease; }
	.arc.self { stroke: #1d4ed8; }
	.query-dot { fill: #1d4ed8; }
	.token-row { display: grid; margin: .25rem 0 0; padding: 0; list-style: none; }
	.token-row li { display: grid; justify-items: center; gap: .3rem; padding: 0 .2rem; text-align: center; transition: opacity .3s ease; }
	.token-row button { width: 100%; padding: .4rem .3rem; font-size: 1.05rem; border-radius: .7rem; }
	.token-row button.query { border-color: #1d4ed8; background: #1d4ed8; color: white; }
	.weight { color: #17253a; font-size: 1.1rem; font-weight: 800; font-variant-numeric: tabular-nums; }
	.token-row li.masked { opacity: .45; }
	.token-row li.masked button { border-style: dashed; background: repeating-linear-gradient(135deg, #f1f5f9 0 6px, #e2e8f0 6px 12px); color: #52627a; }
	.mask-note { color: #52627a; font-size: .78rem; font-weight: 700; }
	.heat-strip { display: grid; height: 1.1rem; margin-top: .6rem; }
	.heat-strip span { margin: 0 2px; border-radius: .3rem; border: 1px solid #fed7aa; transition: background-color .35s ease; }
	.heat-strip span.masked { border: 1px dashed #cbd5e1; background: repeating-linear-gradient(135deg, #f8fafc 0 4px, #e2e8f0 4px 8px) !important; }
	.summary { margin: 1rem 0 .4rem; padding: .75rem 1rem; border-left: 4px solid #f97316; border-radius: .5rem; background: white; color: #17253a; font-size: 1.15rem; font-weight: 800; }
	.hint { font-size: .95rem; }
	.caption { margin-bottom: 0; font-size: .95rem; }
	@media (prefers-reduced-motion: reduce) { .arc, .token-row li, .heat-strip span { transition: none; } }
</style>
