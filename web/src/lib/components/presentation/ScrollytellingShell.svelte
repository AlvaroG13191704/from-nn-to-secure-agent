<script lang="ts">
	import { onMount } from 'svelte';
	import type { LocalSessionController } from '../../state/local-session.js';

	let { localSession }: { localSession: LocalSessionController } = $props();
	let shell = $state<HTMLElement>();
	let track = $state<HTMLDivElement>();
	let reducedMotion = $state(false);
	let lastProgress = -1;
	let activeIndex = $state(0);
	const panelIds = ['bienvenida', 'recorrido', 'aprendizaje'];
	const panels = [
		{ id: panelIds[0], eyebrow: 'Introducción', title: 'Aprendamos inteligencia artificial, paso a paso.', copy: 'Una experiencia práctica para entender las ideas detrás de las herramientas que usamos cada día.' },
		{ id: panelIds[1], eyebrow: 'El recorrido', title: 'De las ideas a los agentes.', copy: 'Exploraremos conceptos esenciales y veremos cómo se conectan en una secuencia clara.' },
		{ id: panelIds[2], eyebrow: 'Tu progreso', title: 'Avanzá a tu ritmo.', copy: 'Desplazate hacia abajo para recorrer las secciones. El contenido seguirá siendo legible con movimiento reducido.' }
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
		if (reducedMotion) {
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
		if (reducedMotion) {
			document.getElementById(panelIds[index])?.scrollIntoView({ behavior: 'instant' });
			return;
		}
		const target = shell;
		if (!target) return;
		const ratio = index / (panels.length - 1);
		const top = target.offsetTop + ratio * (target.offsetHeight - window.innerHeight);
		window.scrollTo({ top, behavior: reducedMotion ? 'instant' : 'smooth' });
	}

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		const syncMotionPreference = () => {
			reducedMotion = media.matches;
			if (reducedMotion && track) track.style.transform = '';
			updatePosition();
		};
		const handleScroll = () => requestAnimationFrame(updatePosition);
		syncMotionPreference();
		media.addEventListener('change', syncMotionPreference);
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', handleScroll);
		return () => {
			media.removeEventListener('change', syncMotionPreference);
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
		min-height: 100%;
		place-items: center;
		padding: clamp(1.25rem, 5vw, 5rem);
	}

	.panel-card {
		width: min(100%, 76rem);
		padding: clamp(1.5rem, 5vw, 5rem);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background: var(--color-surface);
		box-shadow: var(--shadow-panel);
	}

	@media (prefers-reduced-motion: reduce) {
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
			min-height: calc(100svh - 4rem);
		}
	}

	@media (max-width: 640px) {
		.panel-card {
			padding: 1.5rem;
		}
	}
</style>
