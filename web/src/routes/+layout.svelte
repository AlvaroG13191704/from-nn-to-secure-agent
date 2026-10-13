<script lang="ts">
	import { setContext } from 'svelte';
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import NavigationBar from '#lib/components/navigation/NavigationBar.svelte';
	import { createLocalSession } from '#lib/state/local-session.js';
	import { sessionContextKey } from '#lib/state/session-context.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	const localSession = createLocalSession();
	setContext(sessionContextKey, localSession);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<NavigationBar {localSession} />
{@render children()}
