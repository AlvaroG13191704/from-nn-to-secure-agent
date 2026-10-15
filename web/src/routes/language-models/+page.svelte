<script lang="ts">
	import LanguageModelsJourney from '#lib/components/presentation/LanguageModelsJourney.svelte';
	import ScrollytellingShell from '#lib/components/presentation/ScrollytellingShell.svelte';
	import { getLocalSession } from '#lib/state/session-context.js';

	const localSession = getLocalSession();
</script>

<svelte:head>
	<title>Lenguaje y LLMs: de las palabras a la atención</title>
	<meta name="description" content="Un recorrido visual por NLP, tokens, embeddings, el mecanismo de atención, los Transformers y los grandes modelos de lenguaje." />
</svelte:head>

<ScrollytellingShell {localSession} mode="language-models">
	<LanguageModelsJourney />
</ScrollytellingShell>
