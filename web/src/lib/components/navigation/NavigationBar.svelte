<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { LocalSessionController } from '../../state/local-session.js';
	import type { LocalSession } from '../../state/local-session.js';

	let { localSession }: { localSession: LocalSessionController } = $props();
	let currentSession = $state<LocalSession>({ registration: null, progress: 0 });
	let menuOpen = $state(false);

	const slides = [
		{ href: '/', number: 1, label: 'Introducción' },
		{ href: '/deep-learning', number: 2, label: 'Deep Learning' },
		{ href: '/language-models', number: 3, label: 'Lenguaje y LLMs' },
		{ href: '/agents', number: 4, label: 'Agentes' }
	];
	const currentSlide = $derived(slides.find((slide) => slide.href === page.url.pathname));

	onMount(() => {
		localSession.hydrate();
		const unsubscribe = localSession.session.subscribe((value) => (currentSession = value));
		return unsubscribe;
	});
</script>

<svelte:window
	onkeydown={(event) => { if (event.key === 'Escape') menuOpen = false; }}
	onclick={(event) => { if (!(event.target as Element).closest('.slide-menu')) menuOpen = false; }}
/>

<header class="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface/95 shadow-sm backdrop-blur">
	<nav class="mx-auto flex min-h-16 max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6" aria-label="Navegación principal">
		<a class="workshop-title rounded-md font-bold tracking-tight text-ink" href="/" aria-label="De Neuronas a Agentes Seguros, inicio">
			De Neuronas a Agentes Seguros
		</a>

		<ul class="slide-links" aria-label="Slides del taller">
			{#each slides as slide (slide.href)}
				<li>
					<a href={slide.href} aria-current={currentSlide === slide ? 'page' : undefined}>
						<span class="slide-number">{slide.number}</span>{slide.label}
					</a>
				</li>
			{/each}
		</ul>

		<div class="flex items-center gap-2 text-sm sm:gap-6">
			<div class="slide-menu">
				<button type="button" aria-expanded={menuOpen} aria-controls="slide-menu-list" onclick={() => (menuOpen = !menuOpen)}>
					{currentSlide ? `${currentSlide.number} · Slides` : 'Slides'} <span aria-hidden="true">▾</span>
				</button>
				{#if menuOpen}
					<ul id="slide-menu-list" class="slide-menu-list">
						{#each slides as slide (slide.href)}
							<li>
								<a href={slide.href} aria-current={currentSlide === slide ? 'page' : undefined} onclick={() => (menuOpen = false)}>
									<span class="slide-number">{slide.number}</span>{slide.label}
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			<a class="rounded-full bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-800" href="/register">
				{#if currentSession.registration}
					Mi inscripción
				{:else}
					Inscribirme
				{/if}
			</a>
		</div>
	</nav>
</header>

<style>
	.workshop-title { max-width: 24rem; line-height: 1.15; }
	.slide-links { display: none; align-items: center; gap: 0.35rem; margin: 0; padding: 0; list-style: none; }
	.slide-links a, .slide-menu-list a { display: inline-flex; align-items: center; gap: 0.45rem; border-radius: 999px; padding: 0.45rem 0.8rem; color: var(--color-muted); font-size: 0.92rem; font-weight: 700; text-decoration: none; white-space: nowrap; }
	.slide-links a:hover, .slide-menu-list a:hover { background: var(--color-canvas); color: var(--color-ink); }
	.slide-links a[aria-current='page'], .slide-menu-list a[aria-current='page'] { background: var(--color-primary-soft); color: var(--color-primary); }
	.slide-number { display: inline-grid; width: 1.4rem; height: 1.4rem; place-items: center; border-radius: 50%; background: white; border: 1px solid var(--color-line); color: var(--color-ink); font-size: 0.75rem; font-weight: 800; }
	[aria-current='page'] .slide-number { border-color: var(--color-primary); background: var(--color-primary); color: white; }
	.slide-menu { position: relative; }
	.slide-menu button { border: 1px solid var(--color-line); border-radius: 999px; background: white; padding: 0.45rem 0.8rem; color: var(--color-ink); font-size: 0.85rem; font-weight: 800; cursor: pointer; white-space: nowrap; }
	.slide-menu-list { position: absolute; top: calc(100% + 0.5rem); right: 0; display: grid; gap: 0.2rem; min-width: 14rem; margin: 0; padding: 0.4rem; border: 1px solid var(--color-line); border-radius: 1rem; background: var(--color-surface); box-shadow: var(--shadow-panel); list-style: none; }
	.slide-menu-list a { width: 100%; }
	@media (min-width: 1240px) {
		.slide-links { display: flex; }
		.slide-menu { display: none; }
	}
	@media (max-width: 640px) {
		.workshop-title { max-width: 8rem; font-size: 0.8rem; }
		nav { gap: 0.4rem; padding-left: 0.75rem; padding-right: 0.75rem; }
		nav > div { gap: 0.4rem; }
		nav > div > a { padding: 0.5rem; font-size: 0.75rem; }
		.slide-menu button { padding: 0.45rem 0.6rem; font-size: 0.75rem; }
	}
</style>
