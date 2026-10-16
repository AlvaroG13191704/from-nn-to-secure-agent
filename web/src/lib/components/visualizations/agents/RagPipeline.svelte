<script lang="ts">
	import { onMount } from 'svelte';

	type Stage = { phase: 1 | 2; title: string; detail: string; explanation: string };

	const uid = $props.id();

	const problems = [
		{ title: 'No conoce tus documentos', text: 'El modelo aprendió con textos públicos hasta su fecha de corte. No vio el reglamento de tu universidad ni lo que pasó la semana pasada.' },
		{ title: 'Si no sabe, inventa', text: 'Cuando le falta información, el modelo igual produce una respuesta que suena segura. A eso le llamamos alucinación.' },
		{ title: 'No cabe todo en el prompt', text: 'Pegar cientos de páginas en cada pregunta cuesta muchos tokens y además la ventana de contexto tiene un límite.' }
	];

	const stages: Stage[] = [
		{ phase: 1, title: 'Documentos', detail: 'reglamento, apuntes, manuales', explanation: 'Empiezo con los documentos que el modelo no conoce: por ejemplo, el reglamento estudiantil.' },
		{ phase: 1, title: 'Fragmentar', detail: 'un artículo = un fragmento', explanation: 'Corto el texto en fragmentos pequeños para poder recuperar solo la parte útil, no el documento entero.' },
		{ phase: 1, title: 'Embeddings', detail: 'cada fragmento → 384 números', explanation: 'Con un modelo de embeddings, como el MiniLM que viste en la slide 3, convierto cada fragmento en un vector.' },
		{ phase: 1, title: 'Base vectorial', detail: 'vectores + texto original', explanation: 'Guardo cada vector junto con su texto. Esto se hace una sola vez, no en cada pregunta.' },
		{ phase: 2, title: 'Pregunta', detail: '«¿Cuántas clases puedo faltar?»', explanation: 'Llega una pregunta de un estudiante, escrita con sus propias palabras.' },
		{ phase: 2, title: 'Embedding', detail: 'pregunta → 384 números', explanation: 'Convierto la pregunta en un vector con el mismo modelo de embeddings, para que viva en el mismo espacio que los fragmentos.' },
		{ phase: 2, title: 'Buscar parecidos', detail: 'similitud coseno, top-k', explanation: 'Calculo la similitud coseno entre la pregunta y cada fragmento, y me quedo con los k más parecidos.' },
		{ phase: 2, title: 'Aumentar el prompt', detail: 'fragmentos + pregunta', explanation: 'Armo un prompt nuevo: «Usa solo estos fragmentos para responder», seguido de los fragmentos y de la pregunta.' },
		{ phase: 2, title: 'Generar con fuente', detail: '«Según el Artículo 12…»', explanation: 'El modelo de lenguaje responde apoyándose en los fragmentos y cita de dónde sacó la información.' }
	];

	const phases = [
		{ id: 1 as const, title: 'Fase 1 · Indexación', note: 'una sola vez' },
		{ id: 2 as const, title: 'Fase 2 · Consulta', note: 'en cada pregunta' }
	];

	let current = $state(0);
	let playing = $state(false);
	let reducedMotion = $state(false);

	const stage = $derived(stages[current]);
	const isLast = $derived(current === stages.length - 1);

	function next() {
		if (isLast) {
			playing = false;
			return;
		}
		current += 1;
	}
	function reset() {
		playing = false;
		current = 0;
	}
	function togglePlay() {
		if (isLast) current = 0;
		playing = !playing;
	}

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			reducedMotion = preference.matches;
			if (reducedMotion) playing = false;
		};
		sync();
		preference.addEventListener('change', sync);
		const timer = window.setInterval(() => {
			if (playing) next();
		}, 2600);
		return () => {
			window.clearInterval(timer);
			preference.removeEventListener('change', sync);
		};
	});
</script>

<div class="rag-pipeline">
	<div class="why" aria-labelledby="{uid}-why">
		<p class="kicker">¿Por qué RAG?</p>
		<h3 id="{uid}-why">El modelo no sabe lo que no leyó</h3>
		<ul class="problems">
			{#each problems as problem (problem.title)}
				<li><strong>{problem.title}</strong><p>{problem.text}</p></li>
			{/each}
		</ul>
		<p class="definition"><strong>RAG</strong> (<em>Retrieval-Augmented Generation</em>, generación aumentada con recuperación) resuelve esto: antes de responder, busco los fragmentos relevantes de mis documentos y se los doy al modelo dentro del prompt.</p>
	</div>

	<div class="flow" aria-labelledby="{uid}-flow">
		<h3 id="{uid}-flow">El recorrido completo, paso a paso</h3>
		{#each phases as phase (phase.id)}
			<section class="phase" class:active={stage.phase === phase.id} aria-label={phase.title}>
				<header><strong>{phase.title}</strong><span>{phase.note}</span></header>
				<ol>
					{#each stages as item, index (item.title)}
						{#if item.phase === phase.id}
							<li class:current={index === current} class:done={index < current} aria-current={index === current ? 'step' : undefined}>
								<span class="number">{index + 1}</span>
								<strong>{item.title}</strong>
								<span class="detail">{item.detail}</span>
							</li>
						{/if}
					{/each}
				</ol>
			</section>
		{/each}

		<p class="explanation" aria-live="polite">
			<span class="step-label">Paso {current + 1} de {stages.length}:</span>
			{stage.explanation}
		</p>

		<div class="controls">
			<button type="button" class="primary" onclick={next} disabled={isLast}>Siguiente</button>
			<button type="button" onclick={reset} disabled={current === 0 && !playing}>Reiniciar</button>
			<button type="button" onclick={togglePlay} disabled={reducedMotion} aria-pressed={playing}>{playing ? 'Pausar' : 'Reproducir solo'}</button>
		</div>
		{#if reducedMotion}<p class="motion-note">Tienes activada la reducción de movimiento, así que avanzo solo cuando presionas «Siguiente».</p>{/if}
	</div>

	<div class="bridge">
		<strong>RAG también puede ser una herramienta.</strong>
		<p>Un agente no tiene que buscar siempre: puede decidir cuándo hacerlo. En el laboratorio, tu agente tendrá la herramienta <code>buscar_reglamento</code>, que hace exactamente esta búsqueda y le devuelve los artículos más parecidos.</p>
	</div>
</div>

<style>
	.rag-pipeline { display: grid; gap: 1.25rem; margin-top: 1.5rem; }
	.kicker { margin: 0 0 0.4rem; color: #0f766e; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
	h3 { margin: 0 0 0.75rem; color: #17253a; font-size: clamp(1.2rem, 2.4vw, 1.6rem); }
	p { margin: 0; color: #52627a; line-height: 1.6; }
	.why, .flow { padding: 1.1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: white; }
	.problems { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; margin: 0 0 1rem; padding: 0; list-style: none; }
	.problems li { padding: 0.85rem; border: 1px solid #d9e1eb; border-top: 4px solid #f97316; border-radius: 0.8rem; background: #fffaf5; }
	.problems strong { display: block; margin-bottom: 0.3rem; color: #17253a; }
	.problems p { font-size: 0.92rem; }
	.definition { padding: 0.8rem 1rem; border-radius: 0.8rem; background: #dbeafe; color: #17253a; }
	.phase { margin-bottom: 0.9rem; padding: 0.8rem; border: 1px solid #d9e1eb; border-radius: 0.9rem; background: #f8fbff; transition: border-color 300ms, background 300ms; }
	.phase.active { border-color: #1d4ed8; background: #eff6ff; }
	.phase header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; margin-bottom: 0.6rem; color: #17253a; }
	.phase header span { color: #52627a; font-size: 0.85rem; }
	.phase ol { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: 0.9rem; margin: 0; padding: 0; list-style: none; }
	.phase li { position: relative; display: grid; gap: 0.2rem; padding: 0.7rem; border: 1px solid #d9e1eb; border-radius: 0.8rem; background: white; opacity: 0.6; transition: opacity 300ms, border-color 300ms, transform 300ms, box-shadow 300ms; }
	.phase li:not(:last-child)::after { position: absolute; top: 50%; right: -0.85rem; color: #0f766e; content: '→'; font-weight: 900; transform: translateY(-50%); }
	.phase li.done { border-color: #0f766e; background: #ccfbf1; opacity: 1; }
	.phase li.current { border: 2px solid #1d4ed8; background: white; box-shadow: 0 0.4rem 1rem rgb(29 78 216 / 18%); opacity: 1; transform: translateY(-0.15rem); }
	.number { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: #17253a; color: white; font-size: 0.8rem; font-weight: 800; }
	.phase li.current .number { background: #1d4ed8; }
	.phase li strong { color: #17253a; font-size: 0.95rem; }
	.detail { color: #52627a; font-size: 0.82rem; }
	.explanation { min-height: 3.4rem; padding: 0.8rem 1rem; border-left: 4px solid #1d4ed8; border-radius: 0 0.8rem 0.8rem 0; background: #dbeafe; color: #17253a; font-size: 1.02rem; }
	.step-label { font-weight: 800; }
	.controls { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.9rem; }
	button { padding: 0.55rem 1.1rem; border: 1px solid #d9e1eb; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	button.primary { border-color: #1d4ed8; background: #1d4ed8; color: white; }
	button:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
	button:disabled { cursor: not-allowed; opacity: 0.5; }
	.motion-note { margin-top: 0.5rem; font-size: 0.85rem; }
	.bridge { padding: 1rem 1.1rem; border-left: 4px solid #0f766e; border-radius: 0 0.8rem 0.8rem 0; background: #ccfbf1; }
	.bridge strong { color: #17253a; }
	.bridge p { margin-top: 0.35rem; color: #17253a; }
	code { padding: 0.1rem 0.35rem; border-radius: 0.35rem; background: white; color: #0f766e; font-weight: 700; }
	@media (max-width: 900px) {
		.problems { grid-template-columns: 1fr; }
		.phase ol { grid-auto-flow: row; }
		.phase li:not(:last-child)::after { top: auto; right: 50%; bottom: -0.95rem; content: '↓'; transform: translateX(50%); }
	}
	@media (prefers-reduced-motion: reduce) {
		.phase, .phase li { transition: none; }
		.phase li.current { transform: none; }
	}
</style>
