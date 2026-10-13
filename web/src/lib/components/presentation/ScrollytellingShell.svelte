<script lang="ts">
	import { onMount } from 'svelte';
	import type { LocalSessionController } from '../../state/local-session.js';
	import WorkshopJourney from './WorkshopJourney.svelte';

	let { localSession }: { localSession: LocalSessionController } = $props();
	let shell = $state<HTMLElement>();
	let track = $state<HTMLDivElement>();
	let reducedMotion = $state(false);
	let compactFallback = $state(false);
	let verticalAccess = $derived(reducedMotion || compactFallback);
	let lastProgress = -1;
	let activeIndex = $state(0);
	const panelIds = ['bienvenida', 'recorrido', 'aprendizaje'];
	const panels = [
		{ id: panelIds[0], eyebrow: 'Bienvenida', title: 'De la curiosidad a la inteligencia artificial.', copy: 'Un recorrido práctico para entender cómo aprenden los modelos y cómo se convierten en herramientas útiles.' },
		{ id: panelIds[1], eyebrow: 'Quién facilita', title: 'Experiencia técnica, enfoque para aprender.', copy: 'Álvaro es Senior AI Engineer en Deloitte Guatemala. Su trabajo abarca aprendizaje profundo, modelos de lenguaje, agentes, RAG y sistemas backend.' },
		{ id: panelIds[2], eyebrow: 'El taller', title: 'Cuatro horas para conectar fundamentos y aplicaciones.', copy: 'Dos sesiones de dos horas combinan explicaciones, demostraciones visuales y desafíos breves.' }
	];

	function recordProgress(index: number) {
		activeIndex = index;
		if (index !== lastProgress) {
			lastProgress = index;
			localSession.setProgress(index);
		}
	}

	function updatePosition() {
		if (!shell || !track) return;
		if (verticalAccess) {
			const viewportCenter = window.innerHeight / 2;
			const visibleIndex = panels.findIndex((panel) => {
				const bounds = document.getElementById(panel.id)?.getBoundingClientRect();
				return bounds !== undefined && bounds.top <= viewportCenter && bounds.bottom > viewportCenter;
			});
			if (visibleIndex >= 0) recordProgress(visibleIndex);
			return;
		}
		const bounds = shell.getBoundingClientRect();
		const totalScroll = Math.max(1, shell.offsetHeight - window.innerHeight);
		const progress = Math.max(0, Math.min(1, -bounds.top / totalScroll));
		const maxOffset = Math.max(0, track.scrollWidth - window.innerWidth);
		track.style.transform = `translate3d(${-maxOffset * progress}px, 0, 0)`;
		const currentProgress = Math.round(progress * (panels.length - 1));
		recordProgress(currentProgress);
	}

	function moveTo(index: number) {
		if (verticalAccess) {
			document.getElementById(panelIds[index])?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' });
			return;
		}
		const target = shell;
		if (!target) return;
		const ratio = index / (panels.length - 1);
		const top = target.offsetTop + ratio * (target.offsetHeight - window.innerHeight);
		window.scrollTo({ top, behavior: reducedMotion ? 'instant' : 'smooth' });
	}

	onMount(() => {
		localSession.hydrate();
		const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const compactViewport = window.matchMedia('(max-height: 700px) and (min-width: 641px)');
		let initialized = false;
		const restorePosition = (index: number) => {
			if (verticalAccess) {
				track && (track.style.transform = '');
				document.getElementById(panelIds[index])?.scrollIntoView({ behavior: 'instant' });
			} else if (shell) {
				const ratio = index / (panels.length - 1);
				const maxScroll = Math.max(0, shell.offsetHeight - window.innerHeight);
				window.scrollTo({ top: shell.offsetTop + ratio * maxScroll, behavior: 'instant' });
			}
			requestAnimationFrame(updatePosition);
		};
		const syncLayout = () => {
			const wasVertical = verticalAccess;
			reducedMotion = motionPreference.matches;
			compactFallback = compactViewport.matches;
			if (initialized && wasVertical !== verticalAccess) restorePosition(activeIndex);
		};
		const handleScroll = () => requestAnimationFrame(updatePosition);
		syncLayout();
		const savedProgress = localSession.getSnapshot().progress;
		activeIndex = savedProgress;
		lastProgress = savedProgress;
		restorePosition(savedProgress);
		initialized = true;
		motionPreference.addEventListener('change', syncLayout);
		compactViewport.addEventListener('change', syncLayout);
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', handleScroll);
		return () => {
			motionPreference.removeEventListener('change', syncLayout);
			compactViewport.removeEventListener('change', syncLayout);
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleScroll);
		};
	});
</script>

<main class="presentation-main">
	<div class="scroll-shell" bind:this={shell}>
		<div class="presentation-stage">
			<div class="presentation-track" bind:this={track}>
				{#each panels as panel, index (panel.id)}
					<section class="presentation-panel" id={panel.id} aria-labelledby={`${panel.id}-title`} aria-roledescription="diapositiva" inert={!reducedMotion && activeIndex !== index}>
						<div class="panel-card">
							<p class="mb-5 font-semibold uppercase tracking-[0.16em] text-accent">{panel.eyebrow} <span class="text-muted">· {index + 1} de {panels.length}</span></p>
							<h1 id={`${panel.id}-title`} class="max-w-4xl text-display font-bold tracking-tight text-ink">{panel.title}</h1>
							<p class="mt-7 max-w-2xl text-reading text-muted">{panel.copy}</p>
							{#if index === 0}
								<div class="mt-8 flex flex-wrap gap-3" role="group" aria-label="Características del taller">
									<span class="rounded-full bg-primary-soft px-4 py-2 font-semibold text-primary">2 sesiones · 4 horas</span>
									<span class="rounded-full bg-primary-soft px-4 py-2 font-semibold text-primary">Ideas, demostraciones y práctica</span>
								</div>
							{:else if index === 1}
								<div class="mt-8 grid gap-4 sm:grid-cols-2" role="group" aria-label="Experiencia del facilitador">
									<div class="rounded-2xl bg-canvas p-5">
										<h2 class="font-semibold text-ink">Formación</h2>
										<p class="mt-2 text-muted">Ingeniería en Ciencias y Sistemas, USAC; certificado profesional en PyTorch de DeepLearning.AI.</p>
									</div>
									<div class="rounded-2xl bg-canvas p-5">
										<h2 class="font-semibold text-ink">Comunidad y enseñanza</h2>
										<p class="mt-2 text-muted">Experiencia como auxiliar docente, instructor y creador de contenido, ponente y miembro de Cloud Native Guatemala.</p>
									</div>
								</div>
							{:else}
								<WorkshopJourney active={activeIndex === index} reducedMotion={reducedMotion} />
							{/if}
							<div class="mt-10 flex flex-wrap items-center gap-3">
								{#if index < panels.length - 1}
									<button class="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-blue-800" onclick={() => moveTo(index + 1)}>Siguiente sección</button>
								{/if}
								{#if index > 0}
									<button class="rounded-full border border-line px-6 py-3 font-semibold text-ink hover:bg-canvas" onclick={() => moveTo(index - 1)}>Sección anterior</button>
								{/if}
							</div>
						</div>
					</section>
				{/each}
			</div>
		</div>
	</div>
	<nav class="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface/95 p-2 shadow-panel" aria-label="Secciones de la presentación">
		{#each panelIds as id, index (id)}
			<button class="size-10 rounded-full font-semibold text-muted hover:bg-primary-soft hover:text-primary" aria-label={`Ir a la sección ${index + 1}`} aria-controls={id} aria-current={activeIndex === index ? 'step' : undefined} onclick={() => moveTo(index)}>{index + 1}</button>
		{/each}
	</nav>
</main>

<style>
	.presentation-main {
		padding-top: 4rem;
	}

	.scroll-shell {
		position: relative;
		height: 300svh;
	}

	.presentation-stage {
		position: sticky;
		top: 4rem;
		height: calc(100svh - 4rem);
		overflow: hidden;
	}

	.presentation-track {
		display: flex;
		width: max-content;
		height: 100%;
		will-change: transform;
	}

	.presentation-panel {
		display: grid;
		width: 100vw;
		height: 100%;
		min-height: 100%;
		place-items: center;
		padding: clamp(1.25rem, 5vw, 5rem);
	}

	.panel-card {
		width: min(100%, 76rem);
		max-height: 100%;
		overflow-y: auto;
		padding: clamp(1.5rem, 5vw, 5rem);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background: var(--color-surface);
		box-shadow: var(--shadow-panel);
	}

	@media (prefers-reduced-motion: reduce), (max-height: 700px) and (min-width: 641px) {
		.scroll-shell {
			height: auto;
		}

		.presentation-stage {
			position: static;
			height: auto;
			overflow: visible;
		}

		.presentation-track {
			width: 100%;
			height: auto;
			flex-direction: column;
			transform: none !important;
		}

		.presentation-panel {
			height: auto;
			min-height: calc(100svh - 4rem);
		}

		.panel-card {
			max-height: none;
			overflow: visible;
		}
	}

	@media (max-width: 640px) {
		.panel-card {
			padding: 1.5rem;
		}
	}
</style>
