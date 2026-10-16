<script lang="ts">
	import data from '#lib/domain/agents/data/rag-embeddings.json';
	import { cosineSimilarity } from '#lib/domain/language/vector-math.js';

	type Chunk = { id: string; title: string; text: string; vector: number[] };
	type Query = { text: string; vector: number[] };

	const uid = $props.id();
	const chunks = data.chunks as Chunk[];
	const queries = data.queries as Query[];

	// Article that actually answers each preset question, keyed by the question text.
	const expectedById: Record<string, string> = {
		'¿Cuántas clases puedo faltar en un curso?': 'art-12',
		'¿Qué pasa si repruebo el examen final?': 'art-18',
		'¿Con qué nota apruebo una materia?': 'art-15',
		'¿Me puedo llevar libros a mi casa?': 'art-22',
		'¿Qué me pasa si me descubren haciendo trampa?': 'art-40'
	};
	const lowSimilarity = 0.25;

	let selected = $state(0);
	let topK = $state(2);

	const query = $derived(queries[selected]);
	const expected = $derived(expectedById[query.text]);
	const ranked = $derived(
		chunks
			.map((chunk) => ({ chunk, score: cosineSimilarity(query.vector, chunk.vector) }))
			.sort((a, b) => b.score - a.score)
	);
	const maxScore = $derived(Math.max(...ranked.map((item) => item.score), 0.01));
	const retrieved = $derived(ranked.slice(0, topK));
	const expectedRank = $derived(ranked.findIndex((item) => item.chunk.id === expected) + 1);
	const expectedRetrieved = $derived(expectedRank > 0 && expectedRank <= topK);

	const prompt = $derived(
		[
			'Usa SOLO estos fragmentos para responder. Si la respuesta no está en ellos, di que no la encontraste. Cita el artículo que usaste.',
			'',
			...retrieved.map((item) => `[${item.chunk.title}] ${item.chunk.text}`),
			'',
			`Pregunta: ${query.text}`
		].join('\n')
	);
	const approxTokens = $derived(Math.round(prompt.length / 4));

	const note = $derived.by(() => {
		const top = ranked[0];
		const expectedTitle = chunks.find((chunk) => chunk.id === expected)?.title ?? expected;
		if (top.score < lowSimilarity) {
			return {
				kind: 'low',
				title: 'Similitud baja: la pregunta usa otras palabras',
				text: `El mejor resultado apenas llega a ${top.score.toFixed(2)}. La pregunta dice «hacer trampa» y el reglamento dice «copiar en un examen». El significado es parecido, pero el modelo de embeddings no lo captó del todo. Un buen sistema avisa cuando la similitud es baja en lugar de responder con seguridad.`
			};
		}
		if (top.chunk.id !== expected) {
			return {
				kind: 'wrong',
				title: 'El primer resultado no es el correcto',
				text: `El artículo más parecido es «${top.chunk.title}», pero la respuesta está en «${expectedTitle}», que quedó en el puesto ${expectedRank}. Por eso recupero varios fragmentos (top-k) y no solo uno: con k = ${expectedRank} o más, el modelo sí recibe la información correcta.`
			};
		}
		return {
			kind: 'good',
			title: 'Buena recuperación',
			text: `«${top.chunk.title}» queda en primer lugar con ${top.score.toFixed(2)}, claramente por encima de los demás. Con este fragmento el modelo puede responder y citar la fuente.`
		};
	});
</script>

<div class="rag-explorer">
	<div class="intro">
		<p class="kicker">Prueba la búsqueda</p>
		<h3 id="{uid}-title">¿Qué artículos recupera cada pregunta?</h3>
		<p>Tengo un <strong>reglamento estudiantil ficticio</strong>, inventado para este taller, con 8 artículos. Cada artículo ya es un vector de 384 números. Elige una pregunta y mira cómo la ordeno por similitud coseno.</p>
	</div>

	<div class="question-picker" role="group" aria-label="Preguntas disponibles">
		{#each queries as item, index (item.text)}
			<button type="button" class:current={index === selected} aria-pressed={index === selected} onclick={() => (selected = index)}>{item.text}</button>
		{/each}
	</div>

	<div class="layout">
		<div class="ranking-card">
			<div class="ranking-head">
				<h4>Artículos ordenados por similitud</h4>
				<div class="topk" role="group" aria-label="Cantidad de fragmentos recuperados (top-k)">
					<span>top-k:</span>
					{#each [1, 2, 3, 4] as k (k)}
						<button type="button" class:current={topK === k} aria-pressed={topK === k} onclick={() => (topK = k)}>{k}</button>
					{/each}
				</div>
			</div>
			<ol class="ranking" aria-label={`Similitud de cada artículo con «${query.text}»`}>
				{#each ranked as item, index (item.chunk.id)}
					<li class:retrieved={index < topK}>
						<span class="title">
							{item.chunk.title}
							{#if item.chunk.id === expected}<em class="badge">tiene la respuesta</em>{/if}
						</span>
						<span class="bar" aria-hidden="true"><i style={`width:${Math.max(0, item.score / maxScore) * 100}%`}></i></span>
						<strong>{item.score.toFixed(2)}</strong>
					</li>
				{/each}
			</ol>
			<p class="hint">Las filas resaltadas son los {topK} fragmentos que le paso al modelo.</p>
		</div>

		<div class="side">
			<div class="note {note.kind}" aria-live="polite">
				<strong>{note.title}</strong>
				<p>{note.text}</p>
				{#if note.kind === 'wrong'}
					<p class="status">{expectedRetrieved ? `Con top-k = ${topK}, el artículo correcto sí entra en el prompt.` : `Con top-k = ${topK}, el artículo correcto todavía queda fuera. Sube k.`}</p>
				{/if}
			</div>

			<div class="prompt-card">
				<h4>Prompt aumentado que recibe el modelo</h4>
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div class="prompt-scroll" role="region" tabindex="0" aria-label="Prompt aumentado; desplázate para leerlo completo"><pre>{prompt}</pre></div>
				<p class="tokens">≈ <strong>{approxTokens}</strong> tokens (aproximado: 4 caracteres ≈ 1 token). Más fragmentos dan más contexto, pero también cuestan más tokens.</p>
			</div>
		</div>
	</div>

	<details class="how-built">
		<summary>¿Cómo obtuve estos vectores?</summary>
		<ul>
			<li><strong>Modelo:</strong> el mismo de la slide 3, <a href="https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2" target="_blank" rel="noreferrer">paraphrase-multilingual-MiniLM-L12-v2</a>, que convierte cada artículo y cada pregunta completa en un vector de 384 números.</li>
			<li><strong>Una sola vez:</strong> calculé los vectores fuera de línea con Transformers.js de Hugging Face y guardé solo los números en este proyecto. Esa es la fase de indexación.</li>
			<li><strong>En tu navegador:</strong> no se descarga ningún modelo. Aquí solo calculo la similitud coseno entre la pregunta y los 8 artículos.</li>
			<li><strong>Reglamento:</strong> es ficticio, lo escribí para el taller. No corresponde a ninguna universidad real.</li>
		</ul>
	</details>
</div>

<style>
	.rag-explorer { display: grid; gap: 1.1rem; margin-top: 1.5rem; }
	.kicker { margin: 0 0 0.4rem; color: #0f766e; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
	h3 { margin: 0 0 0.5rem; color: #17253a; font-size: clamp(1.2rem, 2.4vw, 1.6rem); }
	h4 { margin: 0; color: #17253a; font-size: 1rem; }
	p { margin: 0; color: #52627a; line-height: 1.6; }
	button { border: 1px solid #d9e1eb; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	button:focus-visible, .prompt-scroll:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
	button.current { border-color: #1d4ed8; background: #1d4ed8; color: white; }
	.question-picker { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.question-picker button { padding: 0.5rem 0.95rem; font-size: 0.92rem; text-align: left; }
	.layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 1.1rem; align-items: start; }
	.ranking-card, .prompt-card { min-width: 0; padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: white; }
	.side { display: grid; gap: 1rem; min-width: 0; }
	.ranking-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.6rem; margin-bottom: 0.75rem; }
	.topk { display: flex; align-items: center; gap: 0.3rem; color: #17253a; font-weight: 800; }
	.topk button { width: 2.3rem; height: 2.3rem; }
	.ranking { display: grid; gap: 0.35rem; margin: 0; padding: 0; list-style: none; }
	.ranking li { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) 2.8rem; align-items: center; gap: 0.6rem; padding: 0.45rem 0.6rem; border: 1px solid transparent; border-radius: 0.6rem; color: #52627a; }
	.ranking li.retrieved { border-color: #0f766e; background: #ccfbf1; color: #17253a; }
	.title { min-width: 0; font-size: 0.9rem; font-weight: 700; }
	.badge { display: inline-block; margin-left: 0.3rem; padding: 0.05rem 0.45rem; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 0.72rem; font-style: normal; font-weight: 800; }
	.bar { height: 0.8rem; overflow: hidden; border-radius: 999px; background: #eef2f7; }
	.bar i { display: block; height: 100%; border-radius: 999px; background: #94a3b8; transition: width 400ms; }
	.ranking li.retrieved .bar i { background: #0f766e; }
	.ranking strong { font-variant-numeric: tabular-nums; text-align: right; }
	.hint { margin-top: 0.6rem; font-size: 0.85rem; }
	.note { padding: 0.9rem 1rem; border-left: 4px solid; border-radius: 0 0.8rem 0.8rem 0; }
	.note strong { color: #17253a; }
	.note p { margin-top: 0.3rem; color: #17253a; font-size: 0.93rem; }
	.note.good { border-color: #0f766e; background: #ccfbf1; }
	.note.wrong { border-color: #f97316; background: #fff7ed; }
	.note.low { border-color: #f97316; background: #fff7ed; }
	.note .status { font-weight: 800; }
	.prompt-scroll { max-height: 18rem; margin: 0.6rem 0; overflow: auto; border-radius: 0.7rem; background: #17253a; }
	pre { margin: 0; padding: 0.8rem; background: #17253a; color: #e2e8f0; font-size: 0.82rem; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
	.tokens { font-size: 0.88rem; }
	.how-built { padding: 0.9rem 1.1rem; border: 1px solid #d9e1eb; border-radius: 0.85rem; background: #f8fbff; }
	.how-built summary { color: #1d4ed8; font-weight: 800; cursor: pointer; }
	.how-built ul { display: grid; gap: 0.5rem; margin: 0.75rem 0 0; padding-left: 1.2rem; color: #52627a; line-height: 1.55; }
	.how-built a { color: #1d4ed8; font-weight: 700; }
	@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
	@media (max-width: 560px) {
		.ranking li { grid-template-columns: minmax(0, 1fr) 2.8rem; }
		.bar { grid-column: 1 / -1; grid-row: 2; }
	}
	@media (prefers-reduced-motion: reduce) { .bar i { transition: none; } }
</style>
