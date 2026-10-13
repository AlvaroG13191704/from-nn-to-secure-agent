<script lang="ts">
	import { onMount } from 'svelte';
	import ConceptDiagram from '../visualizations/ConceptDiagram.svelte';

	type Concept = 'ia' | 'ml' | 'neural' | 'deep' | 'nlp' | 'llm' | 'agent';
	let { active, reducedMotion }: { active: boolean; reducedMotion: boolean } = $props();
	let sequence = $state<HTMLElement>();
	let visibleTopic = $state('ia');

	const topics: { id: string; kind: Concept; title: string; summary: string }[] = [
		{ id: 'ia', kind: 'ia', title: 'Inteligencia artificial', summary: 'Es el campo amplio que busca que una computadora realice tareas como interpretar información o tomar decisiones. Una ruta de reglas es una forma posible de construirla.' },
		{ id: 'ml', kind: 'ml', title: 'Machine learning', summary: 'En vez de escribir cada regla a mano, el sistema aprende patrones a partir de ejemplos. Los datos influyen en cómo separa distintas respuestas.' },
		{ id: 'neural', kind: 'neural', title: 'Redes neuronales', summary: 'Unidades conectadas combinan entradas con pesos, aplican una activación y producen una salida. El entrenamiento ajusta esos pesos a partir del error.' },
		{ id: 'deep', kind: 'deep', title: 'Deep learning', summary: 'Al apilar capas, una red aprende representaciones cada vez más elaboradas: desde señales de entrada hasta patrones y conceptos.' },
		{ id: 'nlp', kind: 'nlp', title: 'Procesamiento del lenguaje natural (NLP)', summary: 'El NLP reúne técnicas para que las computadoras interpreten, clasifiquen o generen lenguaje. Para procesar texto, los modelos lo dividen en tokens y los representan con números.' },
		{ id: 'llm', kind: 'llm', title: 'Grandes modelos de lenguaje (LLMs)', summary: 'Un LLM usa el contexto para estimar qué token podría seguir. Las probabilidades orientan la selección de una continuación.' },
		{ id: 'agent', kind: 'agent', title: 'Agentes de inteligencia artificial', summary: 'Un agente parte de un objetivo, puede usar una herramienta, observa el resultado y toma la siguiente decisión hasta avanzar en la tarea.' }
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
			{ rootMargin: '-12% 0px -58% 0px', threshold: [0.1, 0.35, 0.6] }
		);

		sequence.querySelectorAll('[data-topic]').forEach((topic) => observer.observe(topic));
		return () => observer.disconnect();
	});
</script>

<section class="mt-12 border-t border-line pt-8" aria-labelledby="concept-sequence-title">
	<p class="font-semibold uppercase tracking-[0.16em] text-accent">Fundamentos conectados</p>
	<h2 id="concept-sequence-title" class="mt-2 text-3xl font-bold tracking-tight text-ink">Siete ideas, una ruta de aprendizaje</h2>
	<p class="mt-3 max-w-3xl text-reading text-muted">Cada concepto amplía el anterior: pasamos de sistemas que siguen reglas a modelos que aprenden, procesan lenguaje y usan herramientas.</p>

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
						<ConceptDiagram topic={topic.kind} active={active && visibleTopic === topic.id} {reducedMotion} />
					</div>
				</div>
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

	.diagram-scroll { min-width: 0; overflow-x: auto; }

	@media (max-width: 720px) {
		.topic-content { grid-template-columns: 1fr; }
	}
</style>
