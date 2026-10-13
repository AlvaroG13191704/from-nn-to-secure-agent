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
	<nav class="mx-auto flex min-h-16 max-w-screen-2xl items-center justify-between gap-4 px-5 py-3 sm:px-8" aria-label="Navegación principal">
		<a class="rounded-md font-bold tracking-tight text-ink" href="/" aria-label="Taller de inteligencia artificial, inicio">
			Taller IA
		</a>
		<div class="flex items-center gap-4 text-sm sm:gap-6">
			<p class="flex items-center gap-1 text-xs text-muted sm:gap-2 sm:text-sm" aria-label="Cantidad simulada de personas activas">
				<span class="size-2 rounded-full bg-accent" aria-hidden="true"></span>
				<span><strong class="text-ink">{presence.activeUsers}</strong> activas · sim.</span>
			</p>
			<a class="rounded-full bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-800" href="/register">
				{#if currentSession.registration}
					Actualizar inscripción
				{:else}
					Inscribirme
				{/if}
			</a>
		</div>
	</nav>
</header>
