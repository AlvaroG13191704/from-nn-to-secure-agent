<script lang="ts">
	import { onMount } from 'svelte';
	import MachineLearningOverview from './MachineLearningOverview.svelte';
	import ConceptDiagram from '../visualizations/ConceptDiagram.svelte';

	type Concept = 'ia' | 'ml' | 'neural' | 'deep' | 'nlp' | 'llm' | 'agent';
	let { active, reducedMotion }: { active: boolean; reducedMotion: boolean } = $props();
	let sequence = $state<HTMLElement>();
	let visibleTopic = $state('ia');

	const topics: { id: string; kind: Concept; title: string; summary: string }[] = [
		{ id: 'ia', kind: 'ia', title: 'Inteligencia artificial', summary: 'Con la IA buscamos resolver tareas como reconocer imágenes, comprender lenguaje y tomar decisiones. Para lograrlo, representamos información y usamos reglas, búsqueda o modelos que aprenden patrones. No buscamos una máquina que lo sepa todo: definimos un problema y evaluamos sus respuestas.' },
		{ id: 'ml', kind: 'ml', title: 'Machine learning', summary: 'En lugar de escribir cada regla, entrenamos un modelo con datos para que encuentre patrones. Después probamos si lo aprendido funciona con ejemplos nuevos, no solo con los que ya vio.' },
		{ id: 'neural', kind: 'neural', title: 'Redes neuronales', summary: 'Combinamos entradas con pesos, sumamos un sesgo y aplicamos una activación para obtener una salida. Durante el entrenamiento ajustamos los parámetros a partir del error. Así conectamos vectores y cálculo con el aprendizaje.' },
		{ id: 'deep', kind: 'deep', title: 'Deep learning', summary: 'Apilamos capas de neuronas para aprender representaciones cada vez más elaboradas. Reducimos parte del diseño manual de características, aunque seguimos preparando los datos y evaluando el modelo.' },
		{ id: 'nlp', kind: 'nlp', title: 'Procesamiento del lenguaje natural (NLP)', summary: 'Aplicamos técnicas para interpretar, clasificar o generar lenguaje. Podemos usar reglas o modelos aprendidos; con los LLMs dividimos el texto en tokens y los representamos con números. Un token no siempre es una palabra completa.' },
		{ id: 'llm', kind: 'llm', title: 'Grandes modelos de lenguaje (LLMs)', summary: 'Con un LLM estimamos qué token puede seguir según el contexto y seleccionamos una continuación. En muchos modelos actuales preentrenamos prediciendo tokens y después ajustamos su comportamiento. Una respuesta probable no garantiza una respuesta verdadera.' },
		{ id: 'agent', kind: 'agent', title: 'Agentes de inteligencia artificial', summary: 'Damos un objetivo al sistema, permitimos herramientas concretas y observamos sus resultados para decidir el siguiente paso. En nuestro taller usaremos un LLM como parte del agente y añadiremos límites de seguridad.' }
	];

	onMount(() => {
		if (!sequence || !('IntersectionObserver' in window)) return;
		const observer = new IntersectionObserver(
			(entries) => {
				const mostVisible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
				const topicId = mostVisible?.target.getAttribute('data-topic');
				if (topicId) visibleTopic = topicId;
			},
			{ rootMargin: '-10% 0px -15% 0px', threshold: [0, 0.1, 0.35, 0.6] }
		);

		sequence.querySelectorAll('[data-topic]').forEach((topic) => observer.observe(topic));
		return () => observer.disconnect();
	});
</script>

<section class="concepts" aria-labelledby="concept-sequence-title">
	<h2 id="concept-sequence-title">Siete ideas, una ruta de aprendizaje</h2>
	<p class="concepts-lead">Seguiremos un recorrido, no una escalera obligatoria: la IA engloba al ML y el deep learning; el NLP puede usar reglas o modelos, y los agentes combinan distintas técnicas.</p>

	<div bind:this={sequence} class="concept-list">
		{#each topics as topic, index (topic.id)}
			<article class="topic" data-topic={topic.id} aria-labelledby={`${topic.id}-heading`}>
				<span class="topic-number" aria-hidden="true">{index + 1}</span>
				<div class="topic-body">
					<h3 id={`${topic.id}-heading`}>{topic.title}</h3>
					<div class="topic-content">
						<p class="topic-summary">{topic.summary}</p>
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<div class="diagram-scroll" role="region" tabindex="0" aria-label={`Visualización de ${topic.title}`}>
							<p class="diagram-hint">Podemos deslizar el diagrama hacia los lados para verlo completo.</p>
							<ConceptDiagram topic={topic.kind} active={active && visibleTopic === topic.id} {reducedMotion} />
						</div>
					</div>
					{#if topic.kind === 'ml'}<MachineLearningOverview active={active && visibleTopic === topic.id} {reducedMotion} />{/if}
				</div>
			</article>
		{/each}
	</div>
</section>

<style>
	.concepts { margin-top: clamp(2.5rem, 4vw, 4rem); padding-top: clamp(1.5rem, 3vw, 2.5rem); border-top: 1px solid var(--color-line); }
	.concepts h2 { margin: 0; color: var(--color-ink); font-size: clamp(1.75rem, 2.6vw, 2.75rem); font-weight: 600; line-height: 1.12; letter-spacing: -0.01em; }
	.concepts-lead { max-width: 68ch; margin: 0.75rem 0 0; color: #2b3a55; font-size: var(--text-reading); line-height: 1.6; }

	.concept-list { margin-top: clamp(1.5rem, 2.5vw, 2.5rem); }

	/* Each idea is a numbered textbook entry: serif numeral in the margin, explanation beside its diagram. */
	.topic {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		column-gap: clamp(1rem, 2vw, 2rem);
		padding: clamp(1.25rem, 2.5vw, 2.25rem) 0;
		border-top: 1px solid var(--color-line);
		scroll-margin-block: 1rem;
	}

	.topic-number {
		min-width: 1.5ch;
		color: #b9c6ea;
		font-family: var(--font-serif);
		font-size: clamp(2.25rem, 3.5vw, 3.75rem);
		font-weight: 600;
		line-height: 0.9;
		font-variant-numeric: lining-nums;
	}

	.topic-body { min-width: 0; }
	.topic h3 { margin: 0; color: var(--color-ink); font-size: clamp(1.35rem, 1.9vw, 1.9rem); font-weight: 600; line-height: 1.2; }

	.topic-content {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: center;
		gap: clamp(1rem, 2.5vw, 2.75rem);
		margin-top: 0.85rem;
	}

	.topic-summary { max-width: 68ch; margin: 0; color: #2b3a55; font-size: 1.05rem; line-height: 1.7; }

	@media (min-width: 900px) {
		.topic-content { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); }
	}

	.diagram-scroll { min-width: 0; overflow-x: auto; overscroll-behavior-x: contain; }
	.diagram-hint { display: none; color: var(--color-muted); font-size: 0.875rem; }
	@media (max-width: 640px) {
		.diagram-hint { display: block; position: sticky; left: 0; }
		.topic { grid-template-columns: minmax(0, 1fr); }
		.topic-number { margin-bottom: 0.5rem; }
	}
</style>
