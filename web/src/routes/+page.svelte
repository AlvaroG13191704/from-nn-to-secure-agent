<script lang="ts">
	import ScrollytellingShell from '#lib/components/presentation/ScrollytellingShell.svelte';
	import { getLocalSession } from '#lib/state/session-context.js';

	const localSession = getLocalSession();
</script>

<svelte:head>
	<title>De Neuronas a Agentes Seguros</title>
	<meta name="description" content="Conectamos matemáticas, inteligencia artificial y seguridad en un recorrido práctico." />
</svelte:head>

<ScrollytellingShell {localSession} />
