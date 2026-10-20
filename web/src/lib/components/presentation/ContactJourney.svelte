<script lang="ts">
	import { asset } from '$app/paths';

	// QR codes are pre-generated SVGs in static/images/qr; each one encodes exactly the url shown under it.
	const contacts = [
		{ id: 'youtube', platform: 'YouTube', handle: '@alvarogarciamachinelearning', url: 'https://www.youtube.com/@alvarogarciamachinelearning' },
		{ id: 'instagram', platform: 'Instagram', handle: '@alvaro_ngm._', url: 'https://www.instagram.com/alvaro_ngm._/' },
		{ id: 'github', platform: 'GitHub', handle: 'AlvaroG13191704', url: 'https://github.com/AlvaroG13191704' },
		{ id: 'linkedin', platform: 'LinkedIn', handle: 'alvarog13181704', url: 'https://www.linkedin.com/in/alvarog13181704/' }
	];
	const qrPath = (id: string) => asset(`images/qr/${id}.svg` as Parameters<typeof asset>[0]);
</script>

<header class="chapter-hero">
	<p class="chapter-hero__kicker">Slide 5 · Contacto</p>
	<h1>Sigamos conversando</h1>
	<p>Gracias por recorrer este taller, desde las neuronas hasta los agentes seguros. Si quieres seguir aprendiendo, compartir lo que construyas o hacer preguntas, aquí me encuentras. Escanea un código con la cámara de tu teléfono o toca el enlace.</p>
</header>

<ul class="contacts" aria-label="Redes de contacto">
	{#each contacts as contact (contact.id)}
		<li class="contact">
			<img class="contact__qr" src={qrPath(contact.id)} alt={`Código QR de ${contact.platform}: ${contact.url}`} width="240" height="240" />
			<h2>{contact.platform}</h2>
			<a href={contact.url} target="_blank" rel="noopener noreferrer">{contact.handle}</a>
		</li>
	{/each}
</ul>

<div class="closing-links">
	<a class="back-home" href="/">Volver a la introducción ↑</a>
</div>

<style>
	.contacts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(1rem, 2vw, 2rem); margin: 0 0 2rem; padding: 0; list-style: none; }
	@media (min-width: 1100px) { .contacts { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
	.contact { display: grid; justify-items: center; gap: 0.5rem; padding: clamp(1rem, 2vw, 1.75rem); border: 1px solid var(--color-line); border-top: 4px solid var(--color-ink); border-radius: 0 0 var(--radius-panel) var(--radius-panel); background: var(--color-surface); text-align: center; }
	.contact__qr { width: 100%; max-width: 15rem; height: auto; aspect-ratio: 1; image-rendering: pixelated; }
	h2 { margin: 0.5rem 0 0; font-size: 1.5rem; font-weight: 600; }
	a { color: var(--color-primary); font-weight: 700; overflow-wrap: anywhere; text-underline-offset: 0.2em; }
	a:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	.closing-links { margin-bottom: 2rem; }
	.back-home { display: inline-block; padding: 0.75rem 1.1rem; border-radius: 0.4rem; background: var(--color-primary); color: white; font-weight: 800; text-decoration: none; }
	.back-home:hover { background: #193fa8; }
</style>
