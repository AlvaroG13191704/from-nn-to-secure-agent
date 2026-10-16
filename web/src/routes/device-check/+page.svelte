<script lang="ts">
	import DeviceCheck from '#lib/components/agents/DeviceCheck.svelte';
</script>

<svelte:head>
	<title>Prepara tu computadora · Laboratorio de agentes</title>
	<meta name="description" content="Revisa si tu computadora puede usar Gemini Nano en el navegador para el laboratorio de agentes del taller." />
</svelte:head>

<main class="device-check-page">
	<a class="back-link" href="/">← Volver al taller</a>
	<header>
		<p class="eyebrow">Antes del taller</p>
		<h1>Prepara tu computadora para el laboratorio de agentes</h1>
		<p>En el laboratorio vas a construir un agente que piensa con un modelo de lenguaje real. Si tu computadora lo permite, ese modelo será <strong>Gemini Nano</strong>, que corre dentro de Chrome: es gratis y tus datos no salen de tu equipo. Si no, usarás <strong>Gemini Flash</strong> en la nube con un presupuesto limitado.</p>
		<p>Haz esta revisión en casa. Si necesitas descargar el modelo, pesa varios gigabytes: descargarlo el día del taller, con 40 personas en la misma red, sería muy lento.</p>
	</header>
	<DeviceCheck />
</main>

<style>
	.device-check-page { max-width: 60rem; margin: 0 auto; padding: 5.5rem clamp(1rem, 4vw, 2.5rem) 4rem; }
	.back-link { display: inline-block; margin-bottom: 1.5rem; color: var(--color-primary); font-weight: 700; text-decoration: none; }
	.back-link:hover { text-decoration: underline; }
	header { margin-bottom: 1.75rem; }
	.eyebrow { margin: 0 0 0.6rem; color: var(--color-accent); font-size: 0.82rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
	h1 { margin: 0 0 1rem; color: var(--color-ink); font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.08; letter-spacing: -0.035em; }
	header p { max-width: 70ch; margin: 0 0 0.9rem; color: var(--color-muted); font-size: 1.08rem; line-height: 1.7; }
	header strong { color: var(--color-ink); }
</style>
