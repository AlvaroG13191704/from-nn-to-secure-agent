<script lang="ts">
	import { onMount } from 'svelte';

	let { step = $bindable(0), total, label, nextLabel = 'Siguiente cálculo', interval = 2200 }: {
		step: number;
		total: number;
		label: string;
		nextLabel?: string;
		interval?: number;
	} = $props();

	let playing = $state(false);
	let reducedMotion = $state(false);
	let timer: ReturnType<typeof setInterval> | undefined;

	function stop() {
		if (timer !== undefined) clearInterval(timer);
		timer = undefined;
		playing = false;
	}

	function play() {
		if (reducedMotion) return;
		if (step >= total - 1) step = 0;
		playing = true;
		timer = setInterval(() => {
			if (step >= total - 1) return stop();
			step += 1;
		}, interval);
	}

	function go(target: number) {
		stop();
		step = Math.max(0, Math.min(total - 1, target));
	}

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			reducedMotion = preference.matches;
			if (reducedMotion) stop();
		};
		sync();
		preference.addEventListener('change', sync);
		return () => {
			preference.removeEventListener('change', sync);
			stop();
		};
	});
</script>

<div class="step-controls" role="group" aria-label={label}>
	<button type="button" class="secondary" onclick={() => go(step - 1)} disabled={step === 0}>Anterior</button>
	<button type="button" onclick={() => go(step + 1)} disabled={step === total - 1}>{nextLabel}</button>
	<button type="button" class="secondary" onclick={playing ? stop : play} aria-pressed={playing} disabled={reducedMotion}>{playing ? 'Pausar' : 'Reproducir solo'}</button>
	<button type="button" class="secondary" onclick={() => go(0)} disabled={step === 0}>Volver al inicio</button>
	<span class="progress" aria-hidden="true">
		{#each { length: total } as _, index (index)}
			<span class:done={index <= step}></span>
		{/each}
	</span>
</div>

<style>
	.step-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; }
	button { min-height: 2.7rem; padding: 0.5rem 0.9rem; border: 1px solid var(--color-primary); border-radius: 0.4rem; background: var(--color-primary); color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
	button.secondary { background: #fff; color: var(--color-primary); }
	button:disabled { opacity: 0.45; cursor: not-allowed; }
	button:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	.progress { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-left: auto; }
	.progress span { width: 0.8rem; height: 0.35rem; border-radius: 1px; background: var(--color-line); }
	.progress span.done { background: var(--color-accent); }
</style>
