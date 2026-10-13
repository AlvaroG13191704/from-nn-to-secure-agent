<script lang="ts">
	import ScrollytellingShell from '#lib/components/presentation/ScrollytellingShell.svelte';
	import { getLocalSession } from '#lib/state/session-context.js';

	const localSession = getLocalSession();
</script>

<svelte:head>
	<title>Introducción al taller de inteligencia artificial</title>
	<meta name="description" content="Recorrido introductorio del taller de inteligencia artificial." />
</svelte:head>

<ScrollytellingShell {localSession} />
