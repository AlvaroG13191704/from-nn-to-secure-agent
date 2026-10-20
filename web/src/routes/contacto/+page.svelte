<script lang="ts">
	import ContactJourney from '#lib/components/presentation/ContactJourney.svelte';
	import ScrollytellingShell from '#lib/components/presentation/ScrollytellingShell.svelte';
	import { getLocalSession } from '#lib/state/session-context.js';

	const localSession = getLocalSession();
</script>

<svelte:head>
	<title>Contacto · De Neuronas a Agentes Seguros</title>
	<meta name="description" content="Redes de contacto de Álvaro García con códigos QR: YouTube, Instagram, GitHub y LinkedIn." />
</svelte:head>

<ScrollytellingShell {localSession} mode="contact">
	<ContactJourney />
</ScrollytellingShell>
