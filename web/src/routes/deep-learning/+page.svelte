<script lang="ts">
	import DeepLearningJourney from '#lib/components/presentation/DeepLearningJourney.svelte';
	import ScrollytellingShell from '#lib/components/presentation/ScrollytellingShell.svelte';
	import { getLocalSession } from '#lib/state/session-context.js';

	const localSession = getLocalSession();
</script>

<svelte:head>
	<title>Deep Learning: de la neurona al aprendizaje</title>
	<meta name="description" content="Un recorrido visual por neuronas artificiales, redes profundas y aprendizaje mediante descenso de gradiente." />
</svelte:head>

<ScrollytellingShell {localSession} mode="deep-learning">
	<DeepLearningJourney />
</ScrollytellingShell>
