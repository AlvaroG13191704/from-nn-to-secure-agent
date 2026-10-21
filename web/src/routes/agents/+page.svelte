<script lang="ts">
	import AgentsJourney from '#lib/components/presentation/AgentsJourney.svelte';
	import ScrollytellingShell from '#lib/components/presentation/ScrollytellingShell.svelte';
	import { getLocalSession } from '#lib/state/session-context.js';

	const localSession = getLocalSession();
</script>

<svelte:head>
	<title>Agentes: del modelo que responde al que actúa</title>
	<meta name="description" content="Agentes de IA, harness, prompt engineering, tokens y costo, RAG y buenas prácticas, con ejemplos interactivos y ejecuciones reales." />
</svelte:head>

<ScrollytellingShell {localSession} mode="agents">
	<AgentsJourney />
</ScrollytellingShell>
