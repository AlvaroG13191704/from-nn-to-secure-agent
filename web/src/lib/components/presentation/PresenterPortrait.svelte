<script lang="ts">
	import { asset } from '$app/paths';
	// The optional portrait is not in generated AssetPath types until the user adds it.
	const portraitPath = 'images/alvaro.jpg' as Parameters<typeof asset>[0];
	let loaded = $state(false);
	let failed = $state(false);
</script>

<figure class="portrait">
	{#if !failed}
		<img src={asset(portraitPath)} alt="Retrato de Álvaro, facilitador del workshop" class:loaded onload={() => (loaded = true)} onerror={() => (failed = true)} />
	{/if}
	{#if !loaded || failed}
		<div class="placeholder" role="img" aria-label="Espacio reservado para mi fotografía">
			<svg viewBox="0 0 180 180" aria-hidden="true">
				<circle cx="90" cy="90" r="82" fill="none" stroke="currentColor" stroke-dasharray="4 8" />
				<circle cx="90" cy="64" r="25" fill="currentColor" opacity=".2" />
				<path d="M40 144 Q40 103 90 103 Q140 103 140 144" fill="currentColor" opacity=".2" />
			</svg>
			<p>Mi fotografía</p>
			<span>Pronto nos conoceremos</span>
		</div>
	{/if}
	<figcaption>Álvaro · AI Engineer</figcaption>
</figure>

<style>
	.portrait { position: relative; width: 100%; max-width: 25rem; aspect-ratio: 4 / 5; margin: 0 auto; overflow: hidden; border: 1px solid var(--color-line); border-top: 4px solid var(--color-ink); border-radius: 0 0 var(--radius-panel) var(--radius-panel); background: var(--color-canvas); }
	img { width: 100%; height: 100%; object-fit: cover; opacity: 0; }
	img.loaded { opacity: 1; }
	.placeholder { position: absolute; inset: 0 0 4rem; display: grid; align-content: center; justify-items: center; padding: 1.5rem; color: var(--color-muted); }
	.placeholder svg { width: 75%; max-width: 12rem; }
	.placeholder p { margin-top: 1rem; font-weight: 700; }
	.placeholder span { margin-top: 0.5rem; font-size: 0.875rem; }
	figcaption { position: absolute; bottom: 0; width: 100%; padding: 0.85rem 1rem; border-top: 1px solid var(--color-line); background: var(--color-surface); color: var(--color-ink); font-family: var(--font-serif); font-weight: 600; text-align: center; }
</style>
