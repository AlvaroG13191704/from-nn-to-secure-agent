<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { LocalSessionController } from '../../state/local-session.js';
	import PresenterPortrait from './PresenterPortrait.svelte';
	import WorkshopJourney from './WorkshopJourney.svelte';
	import TopicLearningSequence from './TopicLearningSequence.svelte';
	import ChapterRail from '../navigation/ChapterRail.svelte';

	let { localSession, mode = 'introduction', children }: { localSession: LocalSessionController; mode?: 'introduction' | 'deep-learning' | 'language-models' | 'agents'; children?: Snippet } = $props();
	const chapters = {
		introduction: { number: 1, title: 'Introducción', previous: { href: '/', label: 'Introducción' } },
		'deep-learning': { number: 2, title: 'Deep Learning', previous: { href: '/', label: 'Volver a la introducción' } },
		'language-models': { number: 3, title: 'Lenguaje y LLMs', previous: { href: '/deep-learning', label: 'Volver a Deep Learning' } },
		agents: { number: 4, title: 'Agentes', previous: { href: '/language-models', label: 'Volver a lenguaje y LLMs' } }
	};
	const chapterNumber = $derived(chapters[mode].number);
	const chapterTitle = $derived(chapters[mode].title);
	const previousChapter = $derived(chapters[mode].previous);
	let shell = $state<HTMLElement>();
	let track = $state<HTMLDivElement>();
	let reducedMotion = $state(false);
	let compactFallback = $state(false);
	let verticalAccess = $derived(reducedMotion || compactFallback);
	let lastProgress = -1;
	let activeIndex = $state(0);
	const panelIds = ['bienvenida', 'recorrido', 'aprendizaje'];
	const panels = [
		{ id: panelIds[0], eyebrow: 'Bienvenida', title: 'De Neuronas a Agentes Seguros', copy: 'Vamos a descubrir cómo aprenden los modelos, construir agentes y comprender cómo protegerlos. Conectaremos las matemáticas que ya conocemos con herramientas que podemos crear.' },
		{ id: panelIds[1], eyebrow: 'Quién soy', title: 'Soy Álvaro. Construyamos conocimiento juntos.', copy: 'Soy Senior AI Engineer en Deloitte Guatemala. Trabajo con aprendizaje profundo, modelos de lenguaje, agentes, RAG y sistemas backend.' },
		{ id: panelIds[2], eyebrow: 'El taller', title: 'Conectemos fundamentos y aplicaciones.', copy: 'Durante dos sesiones de dos horas combinaremos explicaciones, demostraciones visuales y laboratorios guiados.' }
	];

	// The four slides of the workshop, in teaching order; the introduction is the current page.
	const workshopSlides = [
		{ number: 1, session: 1, title: 'Introducción', href: undefined, detail: 'Estamos aquí: quién soy, cómo será el taller y siete ideas que conectan la IA con los agentes.' },
		{ number: 2, session: 1, title: 'Deep Learning', href: '/deep-learning', detail: 'Cómo aprende una red neuronal: neuronas, capas y el ajuste de pesos a partir del error.' },
		{ number: 3, session: 2, title: 'Lenguaje y LLMs', href: '/language-models', detail: 'Cómo una máquina lee y genera texto: tokens, embeddings y atención.' },
		{ number: 4, session: 2, title: 'Agentes', href: '/agents', detail: 'Qué le falta a un LLM para actuar: herramientas, harness, RAG y límites de seguridad.' }
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

	function restorePosition(index: number) {
		if (verticalAccess) {
			track && (track.style.transform = '');
			document.getElementById(panelIds[index])?.scrollIntoView({ behavior: 'instant' });
		} else if (shell) {
			const ratio = index / (panels.length - 1);
			const maxScroll = Math.max(0, shell.offsetHeight - window.innerHeight);
			window.scrollTo({ top: shell.offsetTop + ratio * maxScroll, behavior: 'instant' });
		}
		requestAnimationFrame(updatePosition);
	}

	afterNavigate(({ to }) => {
		if (to?.url.pathname !== '/') return;

		localSession.hydrate();
		const savedProgress = localSession.getSnapshot().progress;
		activeIndex = savedProgress;
		lastProgress = savedProgress;
		restorePosition(savedProgress);
	});

	onMount(() => {
		localSession.hydrate();
		if (mode !== 'introduction') return;
		const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const compactViewport = window.matchMedia('(max-height: 700px) and (min-width: 641px)');
		let initialized = false;
		const syncLayout = () => {
			const wasVertical = verticalAccess;
			reducedMotion = motionPreference.matches;
			compactFallback = compactViewport.matches;
			if (initialized && wasVertical !== verticalAccess) restorePosition(activeIndex);
		};
		const handleScroll = () => requestAnimationFrame(updatePosition);
		syncLayout();
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

{#if mode !== 'introduction'}
	<div class="lesson-page">
		<ChapterRail chapter={chapterNumber} title={chapterTitle} />
		<main class="lesson-page__main">
			<div class="deep-learning-topline">
				<a class="back-link" href={previousChapter.href}>← {previousChapter.label}</a>
				<span class="chapter-count">Slide {chapterNumber} de 4 · {chapterTitle}</span>
			</div>
			{@render children?.()}
		</main>
	</div>
{:else}
<main class="presentation-main">
	<div class="scroll-shell" bind:this={shell}>
		<div class="presentation-stage">
			<div class="presentation-track" bind:this={track}>
				{#each panels as panel, index (panel.id)}
					<section class="presentation-panel" id={panel.id} aria-labelledby={`${panel.id}-title`} aria-roledescription="diapositiva" inert={!verticalAccess && activeIndex !== index}>
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<div class="panel-card" role="region" tabindex="0" aria-labelledby={`${panel.id}-title`}>
							<div class="panel-grid" class:panel-grid--presenter={index === 1} class:panel-grid--journey={index === 2}>
								<div class="panel-text">
									<p class="panel-kicker">{panel.eyebrow}, {index + 1} de {panels.length}</p>
									<h1 class="panel-title" class:panel-title--section={index > 0} id={`${panel.id}-title`}>{panel.title}</h1>
									<p class="panel-copy">{panel.copy}</p>
									{#if index === 0}
										<div class="panel-facts" role="group" aria-label="Características del taller">
											<span class="fact">2 sesiones de 2 horas</span>
											<span class="fact">Ideas, demostraciones y práctica</span>
										</div>
									{:else if index === 1}
										<div class="bio-grid" role="group" aria-label="Experiencia del facilitador">
									<div class="bio-item">
										<h2>Formación</h2>
										<p class="mt-2 text-muted">Me formé en Ingeniería en Ciencias y Sistemas en la USAC.</p>
									</div>
									<div class="bio-item">
										<h2>Comunidad y enseñanza</h2>
										<p class="mt-2 text-muted">He sido auxiliar docente, creador de contenido y ponente en diversas comunidades. (IEEE, CONESCAPAN, entre otras)</p>
									</div>
										</div>
									{/if}
								</div>
								{#if index === 0}
									<nav class="workshop-contents" aria-labelledby="contents-title">
										<h2 id="contents-title">Contenido del taller</h2>
										<ol>
											{#each workshopSlides as slide, slideIndex (slide.number)}
												<li aria-current={slide.href ? undefined : 'step'}>
													<span class="contents-number" aria-hidden="true">{slide.number}</span>
													<div>
														{#if slideIndex === 0 || workshopSlides[slideIndex - 1].session !== slide.session}<p class="contents-session">Sesión {slide.session}</p>{/if}
														{#if slide.href}
															<a class="contents-title" href={slide.href}>{slide.title}</a>
														{:else}
															<span class="contents-title">{slide.title}</span>
														{/if}
														<p class="contents-detail">{slide.detail}</p>
													</div>
												</li>
											{/each}
										</ol>
									</nav>
								{:else if index === 1}
									<PresenterPortrait />
								{:else}
									<WorkshopJourney active={activeIndex === index} reducedMotion={reducedMotion} />
								{/if}
							</div>
							{#if index === 2}<TopicLearningSequence active={activeIndex === index} {reducedMotion} />{/if}
							<div class="panel-actions">
								{#if index === 0}
									<a class="btn" href="/deep-learning">Explorar Deep Learning</a>
									<a class="btn" href="/language-models">Explorar lenguaje y LLMs</a>
									<a class="btn btn--accent" href="/device-check">Prepara tu computadora</a>
								{/if}
								{#if index < panels.length - 1}
									<button class="btn btn--primary" onclick={() => moveTo(index + 1)}>Continuemos</button>
								{/if}
								{#if index > 0}
									<button class="btn" onclick={() => moveTo(index - 1)}>Volvamos</button>
								{/if}
							</div>
						</div>
					</section>
				{/each}
			</div>
		</div>
	</div>
	<nav class="panel-nav" aria-label="Secciones de la presentación">
		{#each panelIds as id, index (id)}
			<button aria-label={`Ir a la sección ${index + 1}`} aria-controls={id} aria-current={activeIndex === index ? 'step' : undefined} onclick={() => moveTo(index)}>{index + 1}</button>
		{/each}
	</nav>
</main>
{/if}

<style>

	.deep-learning-topline {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.back-link { color: var(--color-primary); font-weight: 700; text-decoration: none; }
	.back-link:hover { text-decoration: underline; text-underline-offset: 0.2em; }
	.chapter-count { color: var(--color-muted); font-size: 0.85rem; font-weight: 700; }

	@media (max-width: 760px) {
		.deep-learning-topline { align-items: flex-start; flex-direction: column; }
	}

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
		padding: clamp(0.75rem, 1.5vw, 2rem);
		padding-bottom: 4.75rem;
	}

	/* The panel is a flat textbook sheet: ink top rule, no shadow, full projector width. */
	.panel-card {
		width: min(100%, 112rem);
		max-height: 100%;
		overflow-y: auto;
		padding: clamp(1.25rem, 3vw, 3.5rem);
		border: 1px solid var(--color-line);
		border-top: 4px solid var(--color-ink);
		border-radius: 0 0 var(--radius-panel) var(--radius-panel);
		background: var(--color-surface);
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

	.panel-grid { display: grid; gap: clamp(1.75rem, 3vw, 4rem); align-items: start; }
	.panel-text { min-width: 0; }
	@media (min-width: 900px) {
		.panel-grid--presenter { grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.45fr); align-items: center; }
	}
	@media (min-width: 1100px) {
		.panel-grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); align-items: center; }
		.panel-grid--journey { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); align-items: start; }
	}

	.panel-kicker { margin: 0 0 1rem; color: var(--color-accent); font-size: 1.05rem; font-weight: 700; }
	.panel-title {
		max-width: 16ch;
		margin: 0;
		color: var(--color-ink);
		font-size: var(--text-display);
		font-weight: 600;
		line-height: 1.04;
		letter-spacing: -0.02em;
	}
	.panel-title--section { max-width: 22ch; font-size: clamp(2rem, 4vw, 3.75rem); line-height: 1.08; }
	.panel-copy { max-width: 60ch; margin: 1.5rem 0 0; color: #2b3a55; font-size: var(--text-reading); line-height: 1.6; }

	.panel-facts { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem; }
	.fact { padding: 0.45rem 0.9rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: var(--color-canvas); color: var(--color-ink); font-weight: 600; }

	.bio-grid { display: grid; gap: 1.25rem 2rem; margin-top: 2rem; }
	@media (min-width: 640px) { .bio-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	.bio-item { padding-top: 1rem; border-top: 1px solid var(--color-line); }
	.bio-item h2 { margin: 0; color: var(--color-ink); font-size: 1.35rem; font-weight: 600; }

	/* Table of contents: the four slides are a real sequence, so they carry serif numerals. */
	.workshop-contents { min-width: 0; padding: clamp(1.25rem, 2vw, 2rem); border: 1px solid var(--color-line); border-radius: var(--radius-panel); background: var(--color-canvas); }
	.workshop-contents h2 { margin: 0 0 0.5rem; color: var(--color-ink); font-size: clamp(1.35rem, 1.8vw, 1.75rem); font-weight: 600; }
	.workshop-contents ol { display: grid; margin: 0; padding: 0; list-style: none; }
	.workshop-contents li { display: grid; grid-template-columns: 2.75rem minmax(0, 1fr); align-items: baseline; gap: 1rem; padding: 1rem 0; border-top: 1px solid var(--color-line); }
	.workshop-contents li:first-child { border-top: 0; }
	.contents-number { color: #b9c6ea; font-family: var(--font-serif); font-size: clamp(2rem, 3vw, 2.75rem); font-weight: 600; line-height: 0.9; font-variant-numeric: lining-nums; }
	.workshop-contents li[aria-current] .contents-number { color: var(--color-primary); }
	.contents-session { margin: 0 0 0.25rem; color: var(--color-accent); font-size: 0.9rem; font-weight: 700; }
	.contents-title { color: var(--color-ink); font-family: var(--font-serif); font-size: 1.3rem; font-weight: 600; }
	a.contents-title { color: var(--color-primary); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 0.2em; }
	a.contents-title:hover { text-decoration-thickness: 2px; }
	.contents-detail { margin: 0.3rem 0 0; color: var(--color-muted); line-height: 1.5; }

	.panel-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-top: 2.5rem; }
	.btn {
		display: inline-flex;
		align-items: center;
		min-height: 3rem;
		padding: 0.65rem 1.35rem;
		border: 1px solid var(--color-line);
		border-radius: 0.5rem;
		background: var(--color-surface);
		color: var(--color-ink);
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
	}
	.btn:hover { background: var(--color-canvas); }
	.btn--primary { border-color: var(--color-primary); background: var(--color-primary); color: #fff; }
	.btn--primary:hover { border-color: #1a42b0; background: #1a42b0; }
	.btn--accent { border-color: var(--color-accent); color: var(--color-accent); }
	.btn--accent:hover { background: var(--color-accent-soft); }

	.panel-nav {
		position: fixed;
		bottom: 1.25rem;
		left: 50%;
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-panel);
		background: var(--color-surface);
		transform: translateX(-50%);
	}
	.panel-nav button { width: 2.5rem; height: 2.5rem; border: 0; border-radius: 0.5rem; background: transparent; color: var(--color-muted); font-family: var(--font-serif); font-weight: 600; cursor: pointer; }
	.panel-nav button:hover { background: var(--color-primary-soft); color: var(--color-primary); }
	.panel-nav button[aria-current='step'] { background: var(--color-ink); color: #fff; }

	@media (max-width: 640px) {
		.panel-card {
			padding: 1.5rem;
		}
	}
</style>
