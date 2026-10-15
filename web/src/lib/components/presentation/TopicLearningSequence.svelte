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

<section class="mt-12 border-t border-line pt-8" aria-labelledby="concept-sequence-title">
	<p class="font-semibold uppercase tracking-[0.16em] text-accent">Fundamentos conectados</p>
	<h2 id="concept-sequence-title" class="mt-2 text-3xl font-bold tracking-tight text-ink">Siete ideas, una ruta de aprendizaje</h2>
	<p class="mt-3 max-w-3xl text-reading text-muted">Seguiremos un recorrido, no una escalera obligatoria: la IA engloba al ML y el deep learning; el NLP puede usar reglas o modelos, y los agentes combinan distintas técnicas.</p>

	<div bind:this={sequence} class="mt-7 space-y-5">
		{#each topics as topic, index (topic.id)}
			<article class="topic-card" data-topic={topic.id} aria-labelledby={`${topic.id}-heading`}>
				<div class="topic-heading">
					<span class="topic-number" aria-hidden="true">{index + 1}</span>
					<h3 id={`${topic.id}-heading`} class="text-xl font-bold text-ink">{topic.title}</h3>
				</div>
				<div class="topic-content">
					<p class="text-muted">{topic.summary}</p>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div class="diagram-scroll" role="region" tabindex="0" aria-label={`Visualización de ${topic.title}`}>
						<p class="diagram-hint">Podemos deslizar el diagrama hacia los lados para verlo completo.</p>
						<ConceptDiagram topic={topic.kind} active={active && visibleTopic === topic.id} {reducedMotion} />
					</div>
				</div>
				{#if topic.kind === 'ml'}<MachineLearningOverview active={active && visibleTopic === topic.id} {reducedMotion} />{/if}
			</article>
		{/each}
	</div>
</section>

<style>
	.topic-card {
		padding: clamp(1rem, 2vw, 1.5rem);
		border: 1px solid var(--color-line);
		border-radius: 1.25rem;
		background: var(--color-canvas);
		scroll-margin-block: 1rem;
	}

	.topic-heading {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.topic-number {
		display: grid;
		flex: 0 0 2.5rem;
		width: 2.5rem;
		height: 2.5rem;
		place-items: center;
		border-radius: 9999px;
		background: var(--color-primary-soft);
		color: var(--color-primary);
		font-weight: 700;
	}

	.topic-content {
		display: grid;
		grid-template-columns: minmax(14rem, 0.85fr) minmax(0, 1.15fr);
		align-items: center;
		gap: 1rem;
		margin-top: 0.85rem;
	}

	.diagram-scroll { min-width: 0; overflow-x: auto; overscroll-behavior-x: contain; }
	.diagram-hint { display: none; color: var(--color-muted); font-size: 0.875rem; }
	@media (max-width: 640px) { .diagram-hint { display: block; position: sticky; left: 0; } }

	@media (max-width: 720px) {
		.topic-content { grid-template-columns: 1fr; }
	}
</style>
