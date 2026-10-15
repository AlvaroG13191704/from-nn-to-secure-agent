<script lang="ts">
	import { onMount } from 'svelte';
	import { EMBEDDED_WORDS, WORD_VECTORS, solveAnalogy, type EmbeddedWord } from '#lib/domain/language/word-embeddings.js';
	import { addVectors, cosineSimilarity, dot, subtractVectors, type Vector } from '#lib/domain/language/vector-math.js';
	import { getAnswerFeedbackPhase, isNumericAnswerCorrect } from '#lib/domain/deep-learning-lab.js';

	const uid = $props.id();

	// Plane geometry: -4..4 on both axes inside a 400 × 400 view box.
	const SIZE = 400;
	const PAD = 40;
	const UNIT = (SIZE - 2 * PAD) / 8;
	const ticks = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
	const toX = (x: number) => SIZE / 2 + x * UNIT;
	const toY = (y: number) => SIZE / 2 - y * UNIT;

	// Label placement avoids overlaps between close words.
	const labelOffsets: Record<EmbeddedWord, { dx: number; dy: number; anchor: 'start' | 'end' | 'middle' }> = {
		hombre: { dx: -12, dy: 5, anchor: 'end' },
		mujer: { dx: 0, dy: -14, anchor: 'middle' },
		rey: { dx: 12, dy: 5, anchor: 'start' },
		reina: { dx: 0, dy: -14, anchor: 'middle' },
		perro: { dx: -12, dy: 5, anchor: 'end' },
		gato: { dx: -12, dy: 5, anchor: 'end' },
		guatemala: { dx: -10, dy: 20, anchor: 'end' },
		chiquimula: { dx: 10, dy: 20, anchor: 'start' }
	};

	const formatNumber = (value: number) => (value < 0 ? `−${Math.abs(value)}` : `${value}`);
	const formatVector = (vector: Vector) => `(${vector.map(formatNumber).join(', ')})`;

	function substitution(a: EmbeddedWord, b: EmbeddedWord) {
		const va = WORD_VECTORS[a];
		const vb = WORD_VECTORS[b];
		const products = va.map((value, index) => value * vb[index]);
		const factors = va.map((value, index) => `(${formatNumber(value)} × ${formatNumber(vb[index])})`).join(' + ');
		const partials = products.map(formatNumber).join(' + ');
		return `${a} · ${b} = ${factors} = ${partials} = ${formatNumber(dot(va, vb))}`;
	}

	let reducedMotion = $state(false);
	let wordA = $state<EmbeddedWord | null>('rey');
	let wordB = $state<EmbeddedWord | null>('reina');

	function pick(word: EmbeddedWord) {
		if (wordA === null) wordA = word;
		else if (wordB === null && word !== wordA) wordB = word;
		else {
			wordA = word;
			wordB = null;
		}
	}

	const pairIsExercise = $derived(
		wordA !== null && wordB !== null && [wordA, wordB].includes('perro') && [wordA, wordB].includes('gato')
	);
	const pairDot = $derived(wordA && wordB ? dot(WORD_VECTORS[wordA], WORD_VECTORS[wordB]) : 0);
	const pairCosine = $derived(wordA && wordB ? cosineSimilarity(WORD_VECTORS[wordA], WORD_VECTORS[wordB]) : 0);

	// Learner exercise: perro · gato with hint-first feedback.
	const EXERCISE_EXPECTED = dot(WORD_VECTORS.perro, WORD_VECTORS.gato);
	let answer = $state('');
	let checkedAnswer = $state('');
	let incorrectAttempts = $state(0);
	let solutionRevealed = $state(false);
	let solved = $state(false);
	const phase = $derived(getAnswerFeedbackPhase(answer, EXERCISE_EXPECTED, checkedAnswer, incorrectAttempts, solutionRevealed));
	const exerciseUnlocked = $derived(solved || solutionRevealed);

	function checkAnswer(event: SubmitEvent) {
		event.preventDefault();
		if (!answer.trim()) return;
		checkedAnswer = answer;
		if (isNumericAnswerCorrect(answer, EXERCISE_EXPECTED)) solved = true;
		else incorrectAttempts += 1;
	}

	function resetExercise() {
		answer = '';
		checkedAnswer = '';
		incorrectAttempts = 0;
		solutionRevealed = false;
		solved = false;
	}

	// Analogy demo: rey − hombre + mujer, one step at a time.
	const analogy = solveAnalogy('rey', 'hombre', 'mujer');
	const afterSubtract = subtractVectors(WORD_VECTORS.rey, WORD_VECTORS.hombre);
	const afterAdd = addVectors(afterSubtract, WORD_VECTORS.mujer);
	const analogySteps = [
		`Empiezo en rey = ${formatVector(WORD_VECTORS.rey)}.`,
		`Le resto hombre: ${formatVector(WORD_VECTORS.rey)} − ${formatVector(WORD_VECTORS.hombre)} = ${formatVector(afterSubtract)}.`,
		`Le sumo mujer: ${formatVector(afterSubtract)} + ${formatVector(WORD_VECTORS.mujer)} = ${formatVector(afterAdd)}.`,
		`La palabra más cercana a ${formatVector(analogy.vector)} es «${analogy.word}».`
	];
	let analogyStep = $state(0);
	let analogyTimer: ReturnType<typeof setInterval> | undefined;

	function runAnalogy() {
		clearInterval(analogyTimer);
		if (reducedMotion) {
			analogyStep = analogySteps.length;
			return;
		}
		analogyStep = 1;
		analogyTimer = setInterval(() => {
			analogyStep += 1;
			if (analogyStep >= analogySteps.length) clearInterval(analogyTimer);
		}, 1200);
	}

	function resetAnalogy() {
		clearInterval(analogyTimer);
		analogyStep = 0;
	}

	onMount(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = query.matches;
		const update = (event: MediaQueryListEvent) => (reducedMotion = event.matches);
		query.addEventListener('change', update);
		return () => {
			query.removeEventListener('change', update);
			clearInterval(analogyTimer);
		};
	});

	const planeDescription = EMBEDDED_WORDS.map((word) => `${word} en ${formatVector(WORD_VECTORS[word])}`).join('; ');
</script>

<section class="embedding-plane" aria-labelledby="{uid}-title">
	<p class="stage-label">Embeddings</p>
	<h3 id="{uid}-title">Palabras como vectores</h3>
	<p class="intro">Voy a darle a cada palabra dos números, como un punto en el plano. Las palabras con significado parecido quedan cerca y apuntan en una dirección similar. Elige dos palabras (A y B) en el plano o en la lista.</p>

	<div class="layout">
		<div class="plot-wrap">
			<svg class="plot" viewBox="0 0 {SIZE} {SIZE}" role="img" aria-labelledby="{uid}-svg-title {uid}-svg-desc">
				<title id="{uid}-svg-title">Plano de palabras en dos dimensiones</title>
				<desc id="{uid}-svg-desc">Puntos: {planeDescription}.{wordA ? ` A = ${wordA}.` : ''}{wordB ? ` B = ${wordB}.` : ''}</desc>
				<defs>
					{#each [['a', '#1d4ed8'], ['b', '#0f766e'], ['warm', '#f97316']] as [name, color] (name)}
						<marker id="{uid}-arrow-{name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
							<path d="M0 0 L10 5 L0 10 z" fill={color} />
						</marker>
					{/each}
				</defs>
				{#each ticks as tick (tick)}
					<line class="grid" x1={toX(tick)} y1={toY(-4)} x2={toX(tick)} y2={toY(4)} />
					<line class="grid" x1={toX(-4)} y1={toY(tick)} x2={toX(4)} y2={toY(tick)} />
					{#if tick !== 0}
						<text class="tick" x={toX(tick)} y={toY(0) + 15} text-anchor="middle">{formatNumber(tick)}</text>
						<text class="tick" x={toX(0) - 7} y={toY(tick) + 4} text-anchor="end">{formatNumber(tick)}</text>
					{/if}
				{/each}
				<line class="axis" x1={toX(-4)} y1={toY(0)} x2={toX(4)} y2={toY(0)} />
				<line class="axis" x1={toX(0)} y1={toY(-4)} x2={toX(0)} y2={toY(4)} />
				<text class="axis-label" x={toX(4)} y={toY(0) + 32} text-anchor="end">dimensión 1</text>
				<text class="axis-label" x={toX(0) + 8} y={toY(4) + 4}>dimensión 2</text>

				{#if wordA}
					<line class="arrow arrow-a" x1={toX(0)} y1={toY(0)} x2={toX(WORD_VECTORS[wordA][0])} y2={toY(WORD_VECTORS[wordA][1])} marker-end="url(#{uid}-arrow-a)" />
				{/if}
				{#if wordB}
					<line class="arrow arrow-b" x1={toX(0)} y1={toY(0)} x2={toX(WORD_VECTORS[wordB][0])} y2={toY(WORD_VECTORS[wordB][1])} marker-end="url(#{uid}-arrow-b)" />
				{/if}

				{#if analogyStep >= 1}
					<line class="arrow warm" class:draw={!reducedMotion} pathLength="1" x1={toX(0)} y1={toY(0)} x2={toX(WORD_VECTORS.rey[0])} y2={toY(WORD_VECTORS.rey[1])} marker-end="url(#{uid}-arrow-warm)" />
				{/if}
				{#if analogyStep >= 2}
					<line class="arrow warm" class:draw={!reducedMotion} pathLength="1" x1={toX(WORD_VECTORS.rey[0])} y1={toY(WORD_VECTORS.rey[1])} x2={toX(afterSubtract[0])} y2={toY(afterSubtract[1])} marker-end="url(#{uid}-arrow-warm)" />
					<circle class="waypoint" cx={toX(afterSubtract[0])} cy={toY(afterSubtract[1])} r="5" />
				{/if}
				{#if analogyStep >= 3}
					<line class="arrow warm" class:draw={!reducedMotion} pathLength="1" x1={toX(afterSubtract[0])} y1={toY(afterSubtract[1])} x2={toX(afterAdd[0])} y2={toY(afterAdd[1])} marker-end="url(#{uid}-arrow-warm)" />
				{/if}
				{#if analogyStep >= 4}
					<circle class="landing" cx={toX(analogy.vector[0])} cy={toY(analogy.vector[1])} r="14" />
				{/if}

				{#each EMBEDDED_WORDS as word (word)}
					{@const [x, y] = WORD_VECTORS[word]}
					{@const offset = labelOffsets[word]}
					<circle class="point" class:point-a={word === wordA} class:point-b={word === wordB} cx={toX(x)} cy={toY(y)} r="7" />
					<text class="word-label" class:selected-label={word === wordA || word === wordB} x={toX(x) + offset.dx} y={toY(y) + offset.dy} text-anchor={offset.anchor}>{word}</text>
				{/each}
			</svg>
			<!-- Pointer targets over the points; the word list below is the keyboard path. -->
			{#each EMBEDDED_WORDS as word (word)}
				<button
					type="button"
					class="hit"
					tabindex="-1"
					aria-hidden="true"
					style:left="{(toX(WORD_VECTORS[word][0]) / SIZE) * 100}%"
					style:top="{(toY(WORD_VECTORS[word][1]) / SIZE) * 100}%"
					onclick={() => pick(word)}
				></button>
			{/each}
		</div>

		<div class="panel">
			<div class="word-list" role="group" aria-label="Elegir palabras A y B">
				{#each EMBEDDED_WORDS as word (word)}
					<button type="button" class:is-a={word === wordA} class:is-b={word === wordB} aria-pressed={word === wordA || word === wordB} onclick={() => pick(word)}>
						{#if word === wordA}<span class="badge">A</span>{:else if word === wordB}<span class="badge">B</span>{/if}
						{word}
					</button>
				{/each}
			</div>

			<div class="result" aria-live="polite">
				{#if wordA && wordB}
					<p><span class="vec-a">A = {wordA} = {formatVector(WORD_VECTORS[wordA])}</span><br /><span class="vec-b">B = {wordB} = {formatVector(WORD_VECTORS[wordB])}</span></p>
					{#if pairIsExercise && !exerciseUnlocked}
						<p class="locked">Este par es tu ejercicio: primero calcula perro · gato abajo.</p>
					{:else}
						<p class="formula">{substitution(wordA, wordB)}</p>
						<p>Similitud coseno: <strong>{pairCosine.toFixed(2)}</strong></p>
						<p class="explain">
							El coseno compara solo la dirección de las flechas: cerca de 1 significa que apuntan en una dirección parecida; cerca de 0, que son casi perpendiculares; negativo, que apuntan en sentidos opuestos.
							{#if pairDot < 0}Aquí el producto punto es negativo: estas palabras van en sentidos contrarios.{/if}
						</p>
					{/if}
				{:else if wordA}
					<p>A = {wordA}. Ahora elige la palabra B.</p>
				{:else}
					<p>Elige la palabra A.</p>
				{/if}
			</div>

			<form class="exercise" onsubmit={checkAnswer}>
				<h4>Tu turno</h4>
				<label for="{uid}-answer">Calcula perro · gato con perro = {formatVector(WORD_VECTORS.perro)} y gato = {formatVector(WORD_VECTORS.gato)}</label>
				<div class="answer-row">
					<input id="{uid}-answer" type="text" inputmode="decimal" autocomplete="off" bind:value={answer} disabled={solved} />
					<button type="submit" disabled={solved}>Comprobar</button>
					<button type="button" class="secondary" onclick={resetExercise}>Reiniciar</button>
				</div>
				<div aria-live="polite">
					{#if phase === 'correct' || solved}
						<p class="feedback ok">¡Correcto! Son palabras parecidas, por eso su producto punto es grande y positivo.</p>
					{:else if phase === 'hint' || phase === 'offer-solution'}
						<p class="feedback hint">Todavía no. Pista: multiplica las primeras componentes entre sí, luego las segundas, y suma los dos resultados. Recuerda que menos por menos da más.</p>
						{#if phase === 'offer-solution'}
							<button type="button" class="secondary" onclick={() => (solutionRevealed = true)}>Ver solución</button>
						{/if}
					{/if}
					{#if exerciseUnlocked}
						<p class="formula">{substitution('perro', 'gato')}</p>
					{/if}
				</div>
			</form>
		</div>
	</div>

	<div class="analogy">
		<h4>Una analogía con vectores</h4>
		<p>Veamos qué pasa si hago aritmética con las palabras.</p>
		<div class="answer-row">
			<button type="button" onclick={runAnalogy}>rey − hombre + mujer</button>
			{#if analogyStep > 0}<button type="button" class="secondary" onclick={resetAnalogy}>Borrar</button>{/if}
		</div>
		<ol class="steps" aria-live="polite">
			{#each analogySteps.slice(0, analogyStep) as step, index (index)}
				<li>{step}</li>
			{/each}
		</ol>
		{#if analogyStep >= analogySteps.length}
			<p class="caveat">Ojo: construí este plano de juguete para que la analogía saliera exacta. Los embeddings reales solo se acercan a este comportamiento, tienen cientos de dimensiones y ninguna de ellas tiene un nombre como «dimensión 1».</p>
		{/if}
	</div>
</section>

<style>
	.embedding-plane { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	h4 { margin: 0 0 .4rem; color: #17253a; font-size: 1.1rem; }
	.intro { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 1rem; align-items: start; margin-top: 1rem; }
	.plot-wrap { position: relative; min-width: 0; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.plot { display: block; width: 100%; height: auto; }
	.grid { stroke: #e6ecf3; stroke-width: 1; }
	.axis { stroke: #94a3b8; stroke-width: 1.5; }
	.tick { fill: #52627a; font-size: 11px; }
	.axis-label { fill: #52627a; font-size: 12px; font-weight: 700; }
	.arrow { stroke-width: 3; stroke-linecap: round; }
	.arrow-a { stroke: #1d4ed8; }
	.arrow-b { stroke: #0f766e; }
	.arrow.warm { stroke: #f97316; stroke-width: 3.5; }
	.arrow.draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .9s ease-out forwards; }
	@keyframes draw { to { stroke-dashoffset: 0; } }
	.waypoint { fill: white; stroke: #f97316; stroke-width: 2.5; }
	.landing { fill: none; stroke: #f97316; stroke-width: 3; stroke-dasharray: 5 4; }
	.point { fill: #52627a; stroke: white; stroke-width: 2; }
	.point-a { fill: #1d4ed8; }
	.point-b { fill: #0f766e; }
	.word-label { fill: #17253a; font-size: 15px; font-weight: 700; paint-order: stroke; stroke: #fbfdff; stroke-width: 4px; }
	.selected-label { font-weight: 900; }
	.hit { position: absolute; width: 2.2rem; height: 2.2rem; min-height: 0; padding: 0; border: 0; border-radius: 50%; background: transparent; transform: translate(-50%, -50%); cursor: pointer; }
	.panel { display: grid; gap: .9rem; min-width: 0; }
	.word-list { display: flex; flex-wrap: wrap; gap: .45rem; }
	button { min-height: 2.6rem; padding: .45rem .9rem; border: 1px solid #1d4ed8; border-radius: 999px; background: #1d4ed8; color: white; font: inherit; font-weight: 800; cursor: pointer; }
	button:disabled { opacity: .55; cursor: default; }
	button.secondary { background: white; color: #1d4ed8; }
	.word-list button { display: inline-flex; align-items: center; gap: .35rem; border-color: #94a3b8; background: white; color: #17253a; }
	.word-list button.is-a { border-color: #1d4ed8; background: #dbeafe; color: #1d4ed8; }
	.word-list button.is-b { border-color: #0f766e; background: #ccfbf1; color: #134e4a; }
	.badge { display: inline-grid; place-items: center; width: 1.35rem; height: 1.35rem; border: 2px solid currentColor; border-radius: 50%; background: white; font-size: .75rem; }
	button:focus-visible, input:focus-visible { outline: 3px solid #93c5fd; outline-offset: 3px; }
	.result, .exercise, .analogy { padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.result p, .exercise p, .analogy p { margin: .35rem 0; color: #24364b; line-height: 1.55; }
	.vec-a { color: #1d4ed8; font-weight: 800; }
	.vec-b { color: #0f766e; font-weight: 800; }
	.formula { padding: .5rem .65rem; border-radius: .55rem; background: #f0fdfa; color: #134e4a !important; font-size: 1.05rem; font-weight: 800; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
	.explain { color: #52627a !important; }
	.locked { color: #9a3412 !important; font-weight: 700; }
	.exercise label { display: block; margin-bottom: .45rem; color: #17253a; font-weight: 750; line-height: 1.45; }
	.answer-row { display: flex; flex-wrap: wrap; gap: .5rem; }
	.answer-row input { flex: 1 1 7rem; min-width: 0; min-height: 2.6rem; padding: .45rem .7rem; border: 1px solid #94a3b8; border-radius: .7rem; font: inherit; font-size: 1.1rem; }
	.feedback.ok { color: #134e4a; font-weight: 750; }
	.feedback.hint { color: #9a3412; }
	.analogy { margin-top: 1rem; border-left: 5px solid #f97316; }
	.steps { margin: .6rem 0 0; padding-left: 1.4rem; color: #17253a; font-size: 1.05rem; font-weight: 700; line-height: 1.6; font-variant-numeric: tabular-nums; }
	.caveat { padding: .6rem .7rem; border-radius: .6rem; background: #ffedd5; color: #7c2d12 !important; }
	@media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
	@media (prefers-reduced-motion: reduce) { .arrow.draw { animation: none; stroke-dashoffset: 0; } }
</style>
