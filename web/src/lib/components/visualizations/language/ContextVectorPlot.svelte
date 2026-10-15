<script lang="ts">
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { ATTENTION_LAB, ATTENTION_MEANINGS, type deriveAttentionLabProgress } from '#lib/domain/language/attention-lab.js';

	let { progress }: { progress: ReturnType<typeof deriveAttentionLabProgress> } = $props();

	const min = -0.5;
	const max = 3.5;
	const left = 52;
	const top = 18;
	const size = 320;
	const scale = size / (max - min);
	const sx = (value: number) => left + (value - min) * scale;
	const sy = (value: number) => top + (max - value) * scale;
	const ticks = [0, 1, 2, 3];
	const fmt = (value: number) => Number(value.toFixed(3)).toString();

	const river = ATTENTION_LAB.river;
	const money = ATTENTION_LAB.money;
	const bancoVector = river.query;
	const sentences = [
		{ id: 'river', label: 'banco · río', data: river, color: '#0f766e' },
		{ id: 'money', label: 'banco · dinero', data: money, color: '#1d4ed8' }
	] as const;
	// Tokens other than "banco"; "banco" itself is drawn once as the shared static point.
	const otherTokens = sentences.flatMap((sentence) => sentence.data.tokens
		.map((token, index) => ({ ...token, index, sentence }))
		.filter((token) => token.word !== 'banco'));

	const showScores = $derived(progress.completedStages >= 1);
	const showWeights = $derived(progress.completedStages >= 2);
	const showContext = $derived(progress.completedStages >= 3);
	const showMeaning = $derived(progress.completedStages >= 4);

	const riverPoint = new Tween<[number, number]>([bancoVector[0], bancoVector[1]], { easing: cubicOut });
	const moneyPoint = new Tween<[number, number]>([bancoVector[0], bancoVector[1]], { easing: cubicOut });
	$effect(() => {
		const duration = prefersReducedMotion.current ? 0 : 1100;
		const riverTarget: [number, number] = showContext ? [river.context[0], river.context[1]] : [bancoVector[0], bancoVector[1]];
		const moneyTarget: [number, number] = showContext ? [money.context[0], money.context[1]] : [bancoVector[0], bancoVector[1]];
		riverPoint.set(riverTarget, { duration });
		moneyPoint.set(moneyTarget, { duration });
	});
	const animated = $derived([riverPoint.current, moneyPoint.current]);

	const meaningVectors = [
		{ ...ATTENTION_MEANINGS.seat, color: '#0f766e' },
		{ ...ATTENTION_MEANINGS.finance, color: '#1d4ed8' }
	];

	const status = $derived(showMeaning
		? 'Cada “banco” contextual apunta más cerca de su significado.'
		: showContext
			? 'Los dos “banco” contextuales se separaron del “banco” fijo.'
			: showWeights
				? 'El grosor de cada línea es el peso de atención.'
				: showScores
					? 'Las líneas muestran el puntaje q · k de cada palabra.'
					: 'Todavía no hay cálculos confirmados.');
</script>

<figure class="plot">
	<svg viewBox="0 0 390 392" role="img" aria-labelledby="context-plot-title context-plot-desc">
		<title id="context-plot-title">Plano de significados para “banco”</title>
		<desc id="context-plot-desc">Eje horizontal: naturaleza o aire libre. Eje vertical: dinero. El “banco” fijo está en [1, 1]. Palabras de la frase del río: {river.tokens.map((token) => `${token.word} [${token.vector.join(', ')}]`).join(', ')}. Palabras de la frase del dinero: {money.tokens.map((token) => `${token.word} [${token.vector.join(', ')}]`).join(', ')}.{showContext ? ` Banco con contexto del río: [${river.context.map(fmt).join(', ')}]. Banco con contexto del dinero: [${money.context.map(fmt).join(', ')}].` : ''}{showMeaning ? ' Vectores de significado: asiento [2, 1] e institución financiera [1, 2].' : ''}</desc>

		<defs>
			<marker id="meaning-arrow-teal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#0f766e" /></marker>
			<marker id="meaning-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#1d4ed8" /></marker>
		</defs>

		<rect x={left} y={top} width={size} height={size} class="frame" />
		{#each ticks as tick}
			<line class="grid" x1={sx(tick)} x2={sx(tick)} y1={top} y2={top + size} />
			<line class="grid" x1={left} x2={left + size} y1={sy(tick)} y2={sy(tick)} />
			<text class="tick" x={sx(tick)} y={top + size + 15} text-anchor="middle">{tick}</text>
			<text class="tick" x={left - 8} y={sy(tick) + 4} text-anchor="end">{tick}</text>
		{/each}
		<line class="axis" x1={sx(0)} x2={sx(0)} y1={top} y2={top + size} />
		<line class="axis" x1={left} x2={left + size} y1={sy(0)} y2={sy(0)} />
		<text class="axis-label" x={left + size / 2} y={top + size + 34} text-anchor="middle">naturaleza / aire libre →</text>
		<text class="axis-label" transform={`translate(16 ${top + size / 2}) rotate(-90)`} text-anchor="middle">dinero →</text>

		{#if showScores}
			{#each otherTokens as token (token.sentence.id + token.word)}
				{@const weight = token.sentence.data.weights[token.index]}
				<line
					class="attention-line"
					class:faded={showContext}
					x1={sx(bancoVector[0])} y1={sy(bancoVector[1])} x2={sx(token.vector[0])} y2={sy(token.vector[1])}
					stroke={token.sentence.color}
					stroke-width={showWeights ? 1 + weight * 9 : 1.5}
					stroke-dasharray={showWeights ? undefined : '4 4'}
				/>
				{#if !showContext}<text class="line-label" x={(sx(bancoVector[0]) + sx(token.vector[0])) / 2 + 6} y={(sy(bancoVector[1]) + sy(token.vector[1])) / 2 - 6} fill={token.sentence.color}>
					{showWeights ? `${Math.round(weight * 100)}%` : `q·k = ${fmt(token.sentence.data.scores[token.index])}`}
				</text>{/if}
			{/each}
		{/if}

		{#if showMeaning}
			{#each meaningVectors as meaning, index}
				<line class="meaning" x1={sx(0)} y1={sy(0)} x2={sx(meaning.vector[0])} y2={sy(meaning.vector[1])} stroke={meaning.color} marker-end={`url(#meaning-arrow-${index === 0 ? 'teal' : 'blue'})`} />
				<text class="meaning-label" x={sx(meaning.vector[0]) + 10} y={sy(meaning.vector[1]) + (index === 0 ? 16 : -10)} text-anchor="start" fill={meaning.color}>{meaning.label}</text>
			{/each}
		{/if}

		{#each otherTokens as token (token.sentence.id + token.word)}
			<circle cx={sx(token.vector[0])} cy={sy(token.vector[1])} r="7" fill={token.sentence.color} />
			<text class="token-label" x={sx(token.vector[0]) + 10} y={sy(token.vector[1]) - 9} fill={token.sentence.color}>{token.word}</text>
		{/each}

		{#if showContext}
			{#each sentences as sentence, index}
				{@const point = animated[index]}
				<line class="trail" x1={sx(bancoVector[0])} y1={sy(bancoVector[1])} x2={sx(point[0])} y2={sy(point[1])} stroke={sentence.color} />
				<rect x={sx(point[0]) - 7} y={sy(point[1]) - 7} width="14" height="14" rx="3" fill="#fff" stroke={sentence.color} stroke-width="3" />
				<text class="context-label" x={sx(point[0])} y={sy(point[1]) - 14} text-anchor="middle" fill={sentence.color}>{sentence.label}</text>
			{/each}
		{/if}

		<circle cx={sx(bancoVector[0])} cy={sy(bancoVector[1])} r="8" class="banco" />
		<text class="banco-label" x={sx(bancoVector[0]) - 11} y={sy(bancoVector[1]) + 20} text-anchor="end">banco (fijo)</text>
	</svg>
	<figcaption>
		<span class="legend"><span class="swatch teal"></span>frase del río</span>
		<span class="legend"><span class="swatch blue"></span>frase del dinero</span>
		<span class="legend"><span class="swatch gray"></span>“banco” sin contexto</span>
		<span class="status" aria-live="polite">{status}</span>
	</figcaption>
</figure>

<style>
	.plot { margin: .5rem 0 0; }
	svg { display: block; width: 100%; max-width: 30rem; height: auto; margin: 0 auto; }
	.frame { fill: #fff; stroke: #dbe4ee; }
	.grid { stroke: #eef2f7; }
	.axis { stroke: #94a3b8; stroke-width: 1.5; }
	.tick { fill: #64748b; font-size: 11px; }
	.axis-label { fill: #334155; font-size: 13px; font-weight: 700; }
	.attention-line { stroke-linecap: round; opacity: .55; transition: stroke-width .5s ease-out, opacity .5s ease-out; }
	.attention-line.faded { opacity: .18; }
	.line-label { font-size: 11px; font-weight: 800; paint-order: stroke; stroke: #fff; stroke-width: 3px; }
	.token-label, .context-label, .banco-label, .meaning-label { font-size: 13px; font-weight: 800; paint-order: stroke; stroke: #fff; stroke-width: 3px; }
	.banco { fill: #64748b; stroke: #fff; stroke-width: 2; }
	.banco-label { fill: #475569; }
	.trail { stroke-width: 2; stroke-dasharray: 3 4; opacity: .7; }
	.meaning { stroke-width: 3; opacity: .8; }
	figcaption { display: flex; flex-wrap: wrap; gap: .4rem .9rem; margin-top: .5rem; color: #52627a; font-size: .85rem; }
	.legend { display: inline-flex; align-items: center; gap: .35rem; }
	.swatch { width: .75rem; height: .75rem; border-radius: 50%; }
	.swatch.teal { background: #0f766e; }
	.swatch.blue { background: #1d4ed8; }
	.swatch.gray { background: #64748b; }
	.status { flex-basis: 100%; color: #24364b; font-weight: 700; }
	@media (prefers-reduced-motion: reduce) { .attention-line { transition: none; } }
</style>
