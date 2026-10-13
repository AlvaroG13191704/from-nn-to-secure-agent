<script lang="ts">
	import { onMount } from 'svelte';
	import type { LocalSessionController } from '../../state/local-session.js';
	import type { LocalSession } from '../../state/local-session.js';
	import { createPresenceService } from '../../services/presence/presence';
	import { simulatedPresenceProvider } from '../../services/presence/simulated-presence';

	let { localSession }: { localSession: LocalSessionController } = $props();
	const presence = createPresenceService(simulatedPresenceProvider).getSnapshot();
	let currentSession = $state<LocalSession>({ registration: null, progress: 0 });

	onMount(() => {
		localSession.hydrate();
		const unsubscribe = localSession.session.subscribe((value) => (currentSession = value));
		return unsubscribe;
	});
</script>

<header class="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface/95 shadow-sm backdrop-blur">
	<nav class="mx-auto flex min-h-16 max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6" aria-label="Navegación principal">
		<a class="workshop-title rounded-md font-bold tracking-tight text-ink" href="/" aria-label="De Neuronas a Agentes Seguros, inicio">
			De Neuronas a Agentes Seguros
		</a>
		<div class="flex items-center gap-2 text-sm sm:gap-6">
			<p class="flex items-center gap-1 text-xs text-muted sm:gap-2 sm:text-sm" aria-label="Cantidad simulada de personas activas">
				<span class="size-2 rounded-full bg-accent" aria-hidden="true"></span>
				<span><strong class="text-ink">{presence.activeUsers}</strong> activas · sim.</span>
			</p>
			<a class="rounded-full bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-800" href="/register">
				{#if currentSession.registration}
					Mi inscripción
				{:else}
					Inscribirme
				{/if}
			</a>
		</div>
	</nav>
</header>

<style>
	.workshop-title { max-width: 24rem; line-height: 1.15; }
	@media (max-width: 640px) {
		.workshop-title { max-width: 8rem; font-size: 0.8rem; }
		nav { gap: 0.5rem; }
		nav > div { gap: 0.5rem; }
		nav > div > a { padding: 0.5rem; font-size: 0.75rem; }
	}
</style>
