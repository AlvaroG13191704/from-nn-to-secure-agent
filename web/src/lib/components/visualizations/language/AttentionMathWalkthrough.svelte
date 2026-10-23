<script lang="ts">
	import { ATTENTION_MEANINGS, ATTENTION_PROJECTIONS, EXPLORER_SENTENCES, project } from '#lib/domain/language/attention-lab.js';
	import { attentionWalkthrough } from '#lib/domain/language/attention-walkthrough.js';
	import { formatNumber as fmt } from '../format-number.js';
	import StepControls from '../StepControls.svelte';

	let sentenceId = $state<'river' | 'money'>('river');
	let step = $state(0);
	const sentence = $derived(EXPLORER_SENTENCES.find((item) => item.id === sentenceId) ?? EXPLORER_SENTENCES[0]);
	const tokens = $derived(sentence.tokens);
	const words = $derived(tokens.map((token) => token.word));
	const vectors = $derived(tokens.map((token) => token.vector));
	let queryIndex = $state(EXPLORER_SENTENCES[0].tokens.length - 1);
	const walk = $derived(attentionWalkthrough(vectors, queryIndex));
	const query = $derived(words[queryIndex]);
	// The key we use to show a single score: the word that gets the most attention besides the query itself.
	const focusKey = $derived.by(() => {
		let best = queryIndex === 0 ? 1 : 0;
		walk.weights.forEach((weight, index) => { if (index !== queryIndex && weight > walk.weights[best]) best = index; });
		return best;
	});
	const pct = (value: number) => `${fmt(value * 100, 1)} %`;
	const vec = (value: number[]) => `(${value.map((item) => fmt(item, 2)).join(', ')})`;
	// The context lives in the space of V, so the meanings pass through W_V before comparing.
	const seatV = project(ATTENTION_MEANINGS.seat.vector, ATTENTION_PROJECTIONS.value);
	const financeV = project(ATTENTION_MEANINGS.finance.vector, ATTENTION_PROJECTIONS.value);
	const seatScore = $derived(walk.context[0] * seatV[0] + walk.context[1] * seatV[1]);
	const financeScore = $derived(walk.context[0] * financeV[0] + walk.context[1] * financeV[1]);
	const matrices = [
		{ name: 'W_Q', label: 'para preguntar', matrix: ATTENTION_PROJECTIONS.query },
		{ name: 'W_K', label: 'para etiquetar', matrix: ATTENTION_PROJECTIONS.key },
		{ name: 'W_V', label: 'para el contenido', matrix: ATTENTION_PROJECTIONS.value }
	];
	const projection = (vector: number[], matrix: number[][]) => `(${fmt(vector[0], 2)}·${fmt(matrix[0][0], 2)} + ${fmt(vector[1], 2)}·${fmt(matrix[1][0], 2)}, ${fmt(vector[0], 2)}·${fmt(matrix[0][1], 2)} + ${fmt(vector[1], 2)}·${fmt(matrix[1][1], 2)})`;

	const steps = $derived([
		{ title: 'Cada palabra es una fila de números', worked: [`${query} = ${vec(vectors[queryIndex])}`], note: 'Apilo los vectores de la frase en una tabla X: una fila por palabra y una columna por dimensión (naturaleza, dinero).' },
		{ title: 'Tres versiones de cada palabra: q, k y v', worked: [`q = ${vec(vectors[queryIndex])} · W_Q = ${projection(vectors[queryIndex], ATTENTION_PROJECTIONS.query)} = ${vec(walk.queries[queryIndex])}`, `k = ${vec(walk.keys[queryIndex])}    v = ${vec(walk.values[queryIndex])}`], note: 'Multiplico X por tres matrices de pesos distintas: Q = X·W_Q, K = X·W_K y V = X·W_V. Así la misma palabra tiene una versión para preguntar, otra para ofrecerse y otra con su contenido. Estas W son las que el modelo aprende al entrenar, como los pesos de la slide 2.' },
		{ title: 'Volteamos K: Kᵀ', worked: ['las filas de K se vuelven columnas'], note: 'La transpuesta Kᵀ pone cada palabra en una columna. Así, al multiplicar Q · Kᵀ, cada fila de Q se encuentra con cada palabra.' },
		{ title: `Un puntaje: «${query}» contra «${words[focusKey]}»`, worked: [`${walk.queryTerms[focusKey].map(([q, k]) => `${fmt(q, 2)} × ${fmt(k, 2)}`).join(' + ')} = ${fmt(walk.scores[queryIndex][focusKey], 2)}`], note: 'Para cada casilla multiplico la q de la consulta por la k de la otra palabra, número por número, y sumo. Es el producto punto: mientras mejor coincide lo que busca q con lo que ofrece k, más grande el puntaje.' },
		{ title: `Toda la fila de «${query}»`, worked: [`puntajes = (${walk.scores[queryIndex].map((score) => fmt(score, 2)).join(', ')})`], note: 'Repito lo mismo con cada columna: un puntaje por palabra de la frase, incluida la propia consulta.' },
		{ title: 'Q · Kᵀ completa: todos contra todos', worked: [`«${query}» → «${words[focusKey]}» = ${fmt(walk.scores[queryIndex][focusKey], 2)}    «${words[focusKey]}» → «${query}» = ${fmt(walk.scores[focusKey][queryIndex], 2)}`], note: 'Una sola multiplicación de matrices calcula los puntajes de todas las consultas a la vez; por eso la atención es tan rápida en una GPU. Fíjate que la tabla no es simétrica: lo que una palabra busca (W_Q) no es lo mismo que lo que ofrece (W_K).' },
		{ title: 'Softmax, parte 1: e elevado a cada puntaje', worked: [`e^${fmt(walk.scores[queryIndex][focusKey], 2)} = ${fmt(walk.exponentials[focusKey], 2)}`, `suma de todos = ${fmt(walk.sumExp, 2)}`], note: 'Elevar e ≈ 2.718 a cada puntaje vuelve todo positivo y hace que los puntajes altos destaquen mucho más que los bajos.' },
		{ title: 'Softmax, parte 2: dividimos entre la suma', worked: [`${fmt(walk.exponentials[focusKey], 2)} ÷ ${fmt(walk.sumExp, 2)} = ${pct(walk.weights[focusKey])}`, `todos suman ${pct(walk.weights.reduce((sum, value) => sum + value, 0))}`], note: `Estos son los porcentajes de la figura 3.10: «${query}» presta ${pct(walk.weights[focusKey])} de su atención a «${words[focusKey]}».` },
		{ title: 'Multiplicamos por V: cada vector pesa su porcentaje', worked: [`${pct(walk.weights[focusKey])} × ${vec(walk.values[focusKey])} = ${vec(walk.contributions[focusKey])}`], note: 'Cada palabra aporta su vector v, multiplicado por el porcentaje de atención que recibió. Las palabras ignoradas aportan casi nada.' },
		{ title: `El nuevo vector de «${query}»`, worked: [`suma de los aportes = ${vec(walk.context)}`, `· asiento ${vec(seatV)} = ${fmt(seatScore, 2)}    · institución financiera ${vec(financeV)} = ${fmt(financeScore, 2)}`], note: `Sumo los aportes y obtengo el vector de «${query}» con contexto. Para compararlo, los dos significados también pasan por W_V. Se parece más a «${seatScore >= financeScore ? ATTENTION_MEANINGS.seat.label : ATTENTION_MEANINGS.finance.label}»: el contexto le cambió el significado.` }
	]);
	const current = $derived(steps[step]);
	const phase = $derived(step === 1 ? 'projection' : step <= 5 ? 'scores' : step <= 7 ? 'softmax' : 'mix');

	const scoreShown = (row: number, column: number) => step >= 5 || (step === 4 && row === queryIndex) || (step === 3 && row === queryIndex && column === focusKey);
	const cellClass = (row: number, column: number) =>
		row === queryIndex && column === focusKey && step >= 3 ? 'cell--focus' : row === queryIndex && step >= 3 ? 'cell--row' : '';

	function selectSentence(id: 'river' | 'money') {
		sentenceId = id;
		const next = EXPLORER_SENTENCES.find((item) => item.id === id) ?? EXPLORER_SENTENCES[0];
		queryIndex = next.tokens.length - 1;
	}
</script>

<div class="attention-math">
	<div class="options">
		<div class="toggle-group" role="group" aria-label="Frase del ejemplo">
			{#each EXPLORER_SENTENCES as option (option.id)}
				<button type="button" class:active={sentenceId === option.id} aria-pressed={sentenceId === option.id} onclick={() => selectSentence(option.id)}>{option.tokens.map((token) => token.word).join(' ')}</button>
			{/each}
		</div>
		<label class="query-select">Consulta
			<select bind:value={queryIndex}>
				{#each words as word, index (index)}<option value={index}>{word}</option>{/each}
			</select>
		</label>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The matrices are keyboard-scrollable on narrow screens.) -->
	<div class="stage" role="region" tabindex="0" aria-label="Cálculo de la atención con matrices">
		{#if phase === 'projection'}
			<div class="equation-row">
				{#each matrices as item (item.name)}
					<div class="matrix-block">
						<p class="matrix-name">{item.name} <span>{item.label}</span></p>
						<table class="matrix"><tbody>
							{#each item.matrix as values, row (row)}<tr>{#each values as value, column (column)}<td>{fmt(value, 2)}</td>{/each}</tr>{/each}
						</tbody></table>
					</div>
				{/each}
				<span class="operator">→</span>
				<div class="matrix-block">
					<p class="matrix-name">Cada palabra en sus tres versiones</p>
					<table class="matrix matrix--strip">
						<thead><tr><th></th><th scope="col">x</th><th scope="col">q = x · W_Q</th><th scope="col">k = x · W_K</th><th scope="col">v = x · W_V</th></tr></thead>
						<tbody>
							{#each words as word, row (row)}
								<tr class:row--query={row === queryIndex}><th scope="row">{word}</th><td>{vec(vectors[row])}</td><td>{vec(walk.queries[row])}</td><td>{vec(walk.keys[row])}</td><td>{vec(walk.values[row])}</td></tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{:else if phase === 'scores'}
			<div class="equation-row">
				<div class="matrix-block">
					<p class="matrix-name">{step === 0 ? 'X' : 'Q = X · W_Q'} <span>{words.length} × 2</span></p>
					<table class="matrix">
						<tbody>
							{#each step === 0 ? vectors : walk.queries as vector, row (row)}
								<tr class:row--query={row === queryIndex && step >= 3}><th scope="row">{words[row]}</th>{#each vector as value, column (column)}<td>{fmt(value, 2)}</td>{/each}</tr>
							{/each}
						</tbody>
					</table>
				</div>
				{#if step >= 2}
					<span class="operator">·</span>
					<div class="matrix-block">
						<p class="matrix-name">Kᵀ (K = X · W_K) <span>2 × {words.length}</span></p>
						<table class="matrix">
							<thead><tr><th></th>{#each words as word, column (column)}<th scope="col" class:col--focus={column === focusKey && step >= 3}>{word}</th>{/each}</tr></thead>
							<tbody>
								{#each walk.keysTransposed as values, row (row)}
									<tr><th scope="row">d{row + 1}</th>{#each values as value, column (column)}<td class:col--focus={column === focusKey && step >= 3}>{fmt(value, 2)}</td>{/each}</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
				{#if step >= 3}
					<span class="operator">=</span>
					<div class="matrix-block">
						<p class="matrix-name">Q · Kᵀ (puntajes) <span>{words.length} × {words.length}</span></p>
						<table class="matrix matrix--scores">
							<thead><tr><th></th>{#each words as word, column (column)}<th scope="col">{word}</th>{/each}</tr></thead>
							<tbody>
								{#each walk.scores as values, row (row)}
									<tr><th scope="row">{words[row]}</th>{#each values as value, column (column)}<td class={cellClass(row, column)}>{scoreShown(row, column) ? fmt(value, 2) : ''}</td>{/each}</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{:else if phase === 'softmax'}
			<table class="matrix matrix--strip">
				<caption>Fila de «{query}» en Q · Kᵀ, convertida en porcentajes</caption>
				<thead><tr><th></th>{#each words as word, column (column)}<th scope="col" class:col--focus={column === focusKey}>{word}</th>{/each}<th scope="col">suma</th></tr></thead>
				<tbody>
					<tr><th scope="row">puntaje</th>{#each walk.scores[queryIndex] as value, column (column)}<td class:col--focus={column === focusKey}>{fmt(value, 2)}</td>{/each}<td></td></tr>
					<tr class="appear"><th scope="row">e<sup>puntaje</sup></th>{#each walk.exponentials as value, column (column)}<td class:col--focus={column === focusKey}>{fmt(value, 2)}</td>{/each}<td class="sum">{fmt(walk.sumExp, 2)}</td></tr>
					{#if step === 7}
						<tr class="appear row--result"><th scope="row">÷ suma</th>{#each walk.weights as value, column (column)}<td class:col--focus={column === focusKey}>{pct(value)}</td>{/each}<td class="sum">100 %</td></tr>
					{/if}
				</tbody>
			</table>
			{#if step === 7}
				<div class="bars" aria-hidden="true">
					{#each walk.weights as value, column (column)}
						<div class="bar"><span class="bar__fill" class:bar__fill--focus={column === focusKey} style:height={`${Math.max(2, value * 100)}%`}></span><span class="bar__label">{words[column]}</span></div>
					{/each}
				</div>
			{/if}
		{:else}
			<table class="matrix matrix--strip">
				<caption>Porcentajes de «{query}» × filas de V</caption>
				<thead><tr><th scope="col">palabra</th><th scope="col">porcentaje</th><th scope="col">v = x · W_V</th><th scope="col">porcentaje × v</th></tr></thead>
				<tbody>
					{#each words as word, row (row)}
						<tr class:row--focus={row === focusKey}><th scope="row">{word}</th><td>{pct(walk.weights[row])}</td><td>{vec(walk.values[row])}</td><td>{vec(walk.contributions[row])}</td></tr>
					{/each}
				</tbody>
				{#if step === 9}
					<tfoot><tr class="appear row--result"><th scope="row" colspan="3">nuevo vector de «{query}» (suma)</th><td>{vec(walk.context)}</td></tr></tfoot>
				{/if}
			</table>
		{/if}
	</div>

	<div class="board" aria-live="polite">
		<p class="board__title"><strong>Paso {step + 1} de {steps.length}.</strong> {current.title}</p>
		{#each current.worked as line, index (index)}<p class="board__worked">{line}</p>{/each}
		<p class="board__note">{current.note}</p>
	</div>

	<StepControls bind:step total={steps.length} label="Controles del cálculo de la atención" interval={2800} />
	<p class="honest-note">Las matrices W_Q, W_K y W_V de este ejemplo las elegí a mano; un modelo real las aprende durante el entrenamiento y usa vectores de cientos de dimensiones. Para que los números sean sencillos y coincidan con la figura 3.10, aquí omito la división entre √dₖ (sería √2 ≈ 1.41).</p>
</div>

<style>
	.attention-math { display: grid; gap: 0.9rem; }
	.options { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1.2rem; }
	.toggle-group { display: flex; flex-wrap: wrap; gap: 0.4rem; }
	.toggle-group button { min-height: 2.5rem; padding: 0.4rem 0.8rem; border: 1px solid var(--color-line); border-radius: 0.4rem; background: #fff; color: var(--color-ink); font: inherit; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
	.toggle-group button.active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary); }
	.query-select { display: flex; align-items: center; gap: 0.5rem; color: var(--color-muted); font-weight: 700; }
	.query-select select { min-height: 2.5rem; padding: 0.3rem 0.6rem; border: 1px solid var(--color-line); border-radius: 0.4rem; background: #fff; color: var(--color-ink); font: inherit; font-weight: 700; }
	button:focus-visible, select:focus-visible, .stage:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }

	.stage { min-height: 22rem; padding: 1rem; overflow-x: auto; border: 1px solid var(--color-line); border-radius: 0.4rem; background: #fbfcfe; }
	.equation-row { display: flex; align-items: center; gap: 0.6rem; width: max-content; }
	.matrix-block { display: grid; gap: 0.35rem; animation: appear 0.4s ease-out both; }
	.matrix-name { margin: 0; color: var(--color-ink); font-family: var(--font-serif); font-size: 1.05rem; font-weight: 600; }
	.matrix-name span { color: var(--color-muted); font-family: var(--font-sans); font-size: 0.8rem; font-weight: 700; }
	.operator { color: var(--color-muted); font-size: 1.8rem; font-weight: 700; }
	.matrix { border-collapse: collapse; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9rem; font-variant-numeric: tabular-nums; }
	.matrix th { padding: 0.2rem 0.35rem; color: var(--color-muted); font-family: var(--font-sans); font-size: 0.8rem; font-weight: 700; text-align: right; white-space: nowrap; }
	.matrix thead th { text-align: center; }
	.matrix td { min-width: 2.9rem; height: 2rem; padding: 0.2rem 0.35rem; border: 1px solid var(--color-line); background: #fff; color: var(--color-ink); text-align: center; transition: background 0.3s ease; }
	.matrix--scores td { min-width: 2.7rem; }
	.row--query td, .cell--row { background: var(--color-primary-soft) !important; }
	.col--focus { background: var(--color-ochre-soft) !important; }
	th.col--focus { color: #7a4f12; }
	.cell--focus { background: #1f4fd1 !important; color: #fff !important; font-weight: 800; }
	.matrix--strip { width: max-content; }
	.matrix--strip caption { margin-bottom: 0.5rem; color: var(--color-muted); font-family: var(--font-sans); font-weight: 700; text-align: left; }
	.matrix--strip td.sum { background: #f3f6fd; font-weight: 800; }
	.row--result td { color: var(--color-accent); font-weight: 800; }
	.row--focus td { background: var(--color-ochre-soft); }
	.appear { animation: appear 0.4s ease-out both; }

	.bars { display: flex; align-items: flex-end; gap: 0.5rem; height: 8rem; margin-top: 0.9rem; }
	.bar { display: grid; grid-template-rows: 1fr auto; justify-items: center; width: 3.4rem; height: 100%; }
	.bar__fill { align-self: end; width: 70%; border-radius: 0.2rem 0.2rem 0 0; background: #9baec3; animation: grow 0.5s ease-out both; transform-origin: bottom; }
	.bar__fill--focus { background: var(--color-primary); }
	.bar__label { margin-top: 0.2rem; color: var(--color-muted); font-size: 0.75rem; font-weight: 700; }

	.board { padding: 0.9rem 1.1rem; border-left: 4px solid var(--color-primary); border-radius: 0.3rem; background: #f3f6fd; }
	.board p { margin: 0; }
	.board__worked { margin-top: 0.3rem !important; color: #17349a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(0.95rem, 1.4vw, 1.15rem); font-weight: 800; overflow-wrap: anywhere; }
	.board__note { margin-top: 0.5rem !important; color: var(--color-muted); line-height: 1.5; }
	.honest-note { margin: 0; color: var(--color-muted); font-size: 0.85rem; }

	@keyframes appear { from { opacity: 0; } to { opacity: 1; } }
	@keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
	@media (prefers-reduced-motion: reduce) { .matrix-block, .appear, .bar__fill { animation: none; } .matrix td { transition: none; } }
</style>
