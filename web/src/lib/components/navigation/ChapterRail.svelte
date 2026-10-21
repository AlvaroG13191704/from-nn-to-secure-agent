<script lang="ts">
	import { onMount } from 'svelte';

	let { chapter, title }: { chapter: number; title: string } = $props();
	type Item = { id: string; number: string; title: string };
	let items = $state<Item[]>([]);
	let activeId = $state('');

	onMount(() => {
		// The rail is built from the sections on the page, so every chapter gets it without extra config.
		const sections = [...document.querySelectorAll<HTMLElement>('.lesson-page__main [data-lesson]')];
		items = sections.map((section) => ({
			id: section.id,
			number: section.dataset.number ?? '',
			title: section.dataset.lesson || section.querySelector('h2')?.textContent?.trim() || ''
		}));
		// The current section is the last one whose top has passed 30 % of the viewport.
		const update = () => {
			const line = window.innerHeight * 0.3;
			const current = sections.filter((section) => section.getBoundingClientRect().top <= line).at(-1) ?? sections[0];
			activeId = current?.id ?? '';
		};
		update();
		window.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
	});
</script>

<nav class="chapter-rail" aria-label={`Secciones de la slide ${chapter}`}>
	{#if items.length}
		<p class="rail-chapter"><span>Slide {chapter}</span>{title}</p>
		<ol>
			{#each items as item (item.id)}
				<li>
					<a href={`#${item.id}`} aria-current={activeId === item.id ? 'location' : undefined}>
						<span class="rail-number">{item.number}</span>
						<span>{item.title}</span>
					</a>
				</li>
			{/each}
		</ol>
	{/if}
</nav>

<style>
	.chapter-rail { display: none; }
	@media (min-width: 1500px) {
		.chapter-rail { position: sticky; top: 5.5rem; display: block; max-height: calc(100dvh - 7rem); overflow-y: auto; padding-right: 0.5rem; }
	}
	.rail-chapter { display: grid; gap: 0.2rem; margin: 0 0 1.25rem; color: var(--color-ink); font-family: var(--font-serif); font-size: 1.2rem; font-weight: 600; line-height: 1.25; }
	.rail-chapter span { color: var(--color-muted); font-family: var(--font-sans); font-size: 0.85rem; font-weight: 700; }
	ol { display: grid; gap: 0.15rem; margin: 0; padding: 0; border-left: 2px solid var(--color-line); list-style: none; }
	a { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr); gap: 0.4rem; margin-left: -2px; padding: 0.45rem 0.6rem; border-left: 2px solid transparent; color: var(--color-muted); font-size: 0.92rem; line-height: 1.35; text-decoration: none; }
	a:hover { color: var(--color-ink); }
	a[aria-current='location'] { border-left-color: var(--color-primary); color: var(--color-ink); font-weight: 700; }
	.rail-number { color: var(--color-primary); font-family: var(--font-serif); font-variant-numeric: tabular-nums; }
	a:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }
</style>
