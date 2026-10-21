<script lang="ts">
	import DeviceCheck from '#lib/components/agents/DeviceCheck.svelte';
</script>

<svelte:head>
	<title>Prepara tu computadora · Laboratorio de agentes</title>
	<meta name="description" content="Revisa si tu computadora puede usar Gemini Nano en el navegador para el laboratorio de agentes del taller." />
</svelte:head>

<main class="device-check-page">
	<a class="back-link" href="/">← Volver al taller</a>
	<header class="chapter-hero">
		<p class="chapter-hero__kicker">Antes del taller</p>
		<h1>Prepara tu computadora para el laboratorio de agentes</h1>
		<p>En el laboratorio vas a construir un agente que piensa con un modelo de lenguaje real. Si tu computadora lo permite, ese modelo será <strong>Gemini Nano</strong>, que corre dentro de Chrome: es gratis y tus datos no salen de tu equipo. Si no, usarás <strong>Gemini Flash</strong> en la nube con un presupuesto limitado.</p>
		<p>Haz esta revisión en casa. Si necesitas descargar el modelo, pesa varios gigabytes: descargarlo el día del taller, con 40 personas en la misma red, sería muy lento.</p>
	</header>
	<DeviceCheck />
</main>

<style>
	.device-check-page { max-width: 100rem; margin: 0 auto; padding: 5.5rem clamp(1rem, 3vw, 2.5rem) 4rem; }
	.back-link { display: inline-block; color: var(--color-primary); font-weight: 700; text-decoration: none; }
	.back-link:hover { text-decoration: underline; text-underline-offset: 0.2em; }
	.chapter-hero { padding-top: clamp(1.25rem, 3vw, 3rem); }
	/* Global `.chapter-hero p` outranks `.chapter-hero__kicker`; restore the kicker's own spacing and color. */
	.chapter-hero .chapter-hero__kicker { margin-bottom: 1rem; color: var(--color-accent); font-size: 1.05rem; }
	.chapter-hero p + p { margin-top: 1rem; }
	.chapter-hero strong { color: var(--color-ink); }
</style>
