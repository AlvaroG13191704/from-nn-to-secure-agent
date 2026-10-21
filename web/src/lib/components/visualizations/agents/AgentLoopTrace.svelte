<script lang="ts">
	import { onMount } from 'svelte';
	import recordedRuns from '#lib/domain/agents/data/recorded-runs.json';
	import type { AgentEvent } from '#lib/domain/agents/harness.js';
	import { costUsd, formatUsd, REFERENCE_PRICING, type TokenUsage } from '#lib/domain/agents/budget.js';

	type RunId = 'library' | 'injection';
	type Phase = 'think' | 'act' | 'observe' | 'answer';
	type VisibleEvent = Exclude<AgentEvent, { type: 'done' }>;

	const uid = $props.id();
	const AUTOPLAY_MS = 1400;
	const PREVIEW_CHARS = 140;

	const RUNS: Record<RunId, { label: string; goal: string; events: VisibleEvent[] }> = {
		library: { label: 'Misión 2: biblioteca', goal: recordedRuns.library.goal, events: visibleEvents(recordedRuns.library.events) },
		injection: { label: 'Misión 3 sin guardrails', goal: recordedRuns.injection.goal, events: visibleEvents(recordedRuns.injection.events) }
	};

	const PHASES: Array<{ id: Phase; label: string; detail: string }> = [
		{ id: 'think', label: 'Pensar', detail: 'el modelo decide qué hacer' },
		{ id: 'act', label: 'Actuar', detail: 'pide una herramienta' },
		{ id: 'observe', label: 'Observar', detail: 'lee el resultado' },
		{ id: 'answer', label: 'Responder', detail: 'termina el ciclo' }
	];

	let runId = $state<RunId>('library');
	let revealed = $state(0);
	let playing = $state(false);
	let reducedMotion = $state(false);
	let expanded = $state<Record<number, boolean>>({});
	let timer: ReturnType<typeof setInterval> | undefined;

	const run = $derived(RUNS[runId]);
	const shown = $derived(run.events.slice(0, revealed));
	const finished = $derived(revealed >= run.events.length);
	const current = $derived(shown.at(-1));
	const phase = $derived(current ? phaseOf(current) : undefined);
	const totals = $derived.by(() => {
		const usage: TokenUsage = { inputTokens: 0, outputTokens: 0, thinkingTokens: 0 };
		for (const event of shown) {
			if (event.type !== 'usage') continue;
			usage.inputTokens += event.usage.inputTokens;
			usage.outputTokens += event.usage.outputTokens;
			usage.thinkingTokens += event.usage.thinkingTokens;
		}
		const steps = shown.reduce((max, event) => Math.max(max, event.step), 0);
		return { usage, steps, cost: costUsd(usage, REFERENCE_PRICING) };
	});

	function visibleEvents(events: unknown[]) {
		return (events as AgentEvent[]).filter((event): event is VisibleEvent => event.type !== 'done');
	}

	function phaseOf(event: VisibleEvent): Phase {
		if (event.type === 'tool-call' || event.type === 'blocked') return 'act';
		if (event.type === 'tool-result') return 'observe';
		if (event.type === 'answer') return 'answer';
		return 'think';
	}

	function isEmailEvent(event: VisibleEvent) {
		return (event.type === 'tool-call' || event.type === 'tool-result') && event.tool === 'enviar_correo';
	}

	function filledArgs(args: Record<string, unknown>) {
		return Object.entries(args).filter(([, value]) => value !== '' && value !== undefined && value !== null);
	}

	function stopPlaying() {
		playing = false;
		if (timer) clearInterval(timer);
		timer = undefined;
	}

	function next() {
		if (revealed < run.events.length) revealed += 1;
		if (revealed >= run.events.length) stopPlaying();
	}

	function play() {
		if (reducedMotion) {
			next();
			return;
		}
		if (finished) revealed = 0;
		playing = true;
		timer = setInterval(next, AUTOPLAY_MS);
	}

	function reset() {
		stopPlaying();
		revealed = 0;
		expanded = {};
	}

	function selectRun(id: RunId) {
		if (id === runId) return;
		reset();
		runId = id;
	}

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const syncMotion = () => {
			reducedMotion = preference.matches;
			if (reducedMotion) stopPlaying();
		};
		syncMotion();
		preference.addEventListener('change', syncMotion);
		return () => {
			preference.removeEventListener('change', syncMotion);
			stopPlaying();
		};
	});
</script>

<section class="loop-trace" aria-labelledby={`${uid}-title`}>
	<p class="stage-label">02 · El ciclo del agente</p>
	<h3 id={`${uid}-title`}>Pensar, actuar, observar… y responder</h3>
	<p>Veamos una ejecución real paso a paso. El modelo no resuelve todo de una vez: piensa, pide una herramienta, observa el resultado y vuelve a pensar, hasta que decide que ya puede responder.</p>
	<p class="recorded">Ejecución real con {recordedRuns.model} grabada el 15 de octubre de 2026.</p>

	<div class="run-switch" role="group" aria-label="Ejecución grabada">
		{#each Object.entries(RUNS) as [id, item] (id)}
			<button type="button" aria-pressed={runId === id} class:selected={runId === id} onclick={() => selectRun(id as RunId)}>{item.label}</button>
		{/each}
	</div>
	<p class="goal"><strong>Meta:</strong> «{run.goal}»</p>

	<ol class="cycle" aria-label="Fases del ciclo">
		{#each PHASES as item (item.id)}
			<li class:active={phase === item.id} aria-current={phase === item.id ? 'step' : undefined}>
				<strong>{item.label}</strong><span>{item.detail}</span>
			</li>
		{/each}
	</ol>

	<div class="controls">
		<button type="button" class="primary" onclick={next} disabled={finished || playing}>Siguiente paso</button>
		{#if playing}
			<button type="button" onclick={stopPlaying}>Pausar</button>
		{:else}
			<button type="button" onclick={play} disabled={finished && reducedMotion}>{reducedMotion ? 'Avanzar' : 'Reproducir'}</button>
		{/if}
		<button type="button" onclick={reset} disabled={revealed === 0}>Reiniciar</button>
	</div>

	<dl class="totals" aria-live="polite">
		<div><dt>Pasos</dt><dd>{totals.steps}</dd></div>
		<div><dt>Tokens de entrada</dt><dd>{totals.usage.inputTokens}</dd></div>
		<div><dt>Tokens de salida</dt><dd>{totals.usage.outputTokens + totals.usage.thinkingTokens}</dd></div>
		<div><dt>Costo</dt><dd>{formatUsd(totals.cost)}</dd></div>
	</dl>
	<p class="note">La salida incluye los tokens de razonamiento interno, que también se cobran. Costo calculado con la tarifa de {recordedRuns.model}: ${REFERENCE_PRICING.inputPerMillion} por millón de tokens de entrada y ${REFERENCE_PRICING.outputPerMillion} por millón de salida.</p>

	<ol class="log" aria-live="polite" aria-label="Registro de la ejecución">
		{#if shown.length === 0}
			<li class="empty">Presiona «Siguiente paso» para ver el primer evento.</li>
		{/if}
		{#each shown as event, index (index)}
			<li class={`event ${event.type}`} class:danger={runId === 'injection' && isEmailEvent(event)}>
				{#if event.type === 'usage'}
					<p class="usage">Paso {event.step} · {event.usage.inputTokens} tokens de entrada, {event.usage.outputTokens + event.usage.thinkingTokens} de salida{#if event.usage.thinkingTokens} ({event.usage.thinkingTokens} de razonamiento){/if}</p>
				{:else if event.type === 'thought'}
					<p><span class="tag">💭 Pensamiento</span> {event.text}</p>
				{:else if event.type === 'tool-call'}
					<p><span class="tag">🔧 Herramienta</span> <code>{event.tool}</code></p>
					<ul class="args">
						{#each filledArgs(event.args) as [key, value] (key)}
							<li><code>{key}</code>: «{String(value)}»</li>
						{/each}
					</ul>
				{:else if event.type === 'tool-result'}
					{@const long = event.output.length > PREVIEW_CHARS}
					<p><span class="tag">👀 Observación</span> de <code>{event.tool}</code>: {long && !expanded[index] ? `${event.output.slice(0, PREVIEW_CHARS)}…` : event.output}</p>
					{#if long}
						<button type="button" class="small" aria-expanded={Boolean(expanded[index])} onclick={() => (expanded = { ...expanded, [index]: !expanded[index] })}>{expanded[index] ? 'Ver menos' : 'Ver todo'}</button>
					{/if}
				{:else if event.type === 'blocked'}
					<p><span class="tag">⛔ Bloqueado</span> El harness no permitió usar <code>{event.tool}</code>.</p>
				{:else if event.type === 'invalid'}
					<p><span class="tag">⚠️ Respuesta inválida</span> El modelo no respondió con el formato esperado.</p>
				{:else if event.type === 'answer'}
					<p><span class="tag">✅ Respuesta final</span> {event.text}</p>
				{/if}
				{#if runId === 'injection' && isEmailEvent(event)}
					<p class="alert">El agente obedeció una instrucción escondida en un archivo: envió datos a una dirección externa. Más adelante veremos cómo los guardrails lo detienen.</p>
				{/if}
			</li>
		{/each}
		{#if finished}
			<li class="end">Fin: el modelo decidió terminar en el paso {totals.steps}.</li>
		{/if}
	</ol>
</section>

<style>
	.loop-trace { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.recorded { display: inline-block; padding: .3rem .75rem; border-radius: 999px; background: #ccfbf1; color: #134e4a; font-weight: 800; }
	.run-switch, .controls { display: flex; flex-wrap: wrap; gap: .5rem; margin: .75rem 0; }
	.goal { color: #17253a; overflow-wrap: anywhere; }
	.cycle { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); gap: .5rem; margin: 1rem 0; padding: 0; list-style: none; counter-reset: phase; }
	.cycle li { position: relative; display: grid; gap: .15rem; padding: .6rem .8rem; border: 2px solid #d9e1eb; border-radius: 1rem; background: white; color: #52627a; transition: background .3s ease, border-color .3s ease; }
	.cycle li strong { color: #17253a; font-size: 1.05rem; }
	.cycle li span { font-size: .88rem; }
	.cycle li.active { border-color: #1d4ed8; background: #dbeafe; }
	.cycle li:nth-child(3)::after { content: '↺ vuelve a pensar'; color: #0f766e; font-size: .78rem; font-weight: 800; }
	.totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr)); gap: .5rem; margin: .5rem 0; }
	.totals div { padding: .5rem .75rem; border: 1px solid #d9e1eb; border-radius: .8rem; background: white; }
	.totals dt { color: #52627a; font-size: .8rem; font-weight: 700; }
	.totals dd { margin: 0; color: #17253a; font-size: 1.25rem; font-weight: 800; font-variant-numeric: tabular-nums; }
	.note { font-size: .9rem; }
	.log { display: grid; gap: .5rem; margin: 1rem 0 0; padding: 0; list-style: none; }
	.log li { padding: .55rem .9rem; border: 1px solid #d9e1eb; border-left-width: 4px; border-radius: .7rem; background: white; overflow-wrap: anywhere; }
	.log p { margin: .15rem 0; color: #17253a; }
	.event.thought { border-left-color: #1d4ed8; }
	.event.tool-call { border-left-color: #f97316; }
	.event.tool-result { border-left-color: #0f766e; }
	.event.answer { border-left-color: #0f766e; background: #f0fdfa; }
	.event.usage { padding: .3rem .9rem; border-left-color: #d9e1eb; background: #fbfdff; }
	.event.usage .usage { color: #52627a; font-size: .85rem; }
	.event.danger { border-color: #b91c1c; background: #fef2f2; }
	.empty, .end { color: #52627a; font-style: italic; }
	.tag { margin-right: .25rem; font-weight: 800; }
	.args { margin: .2rem 0 0; padding-left: 1.2rem; color: #17253a; }
	code { padding: 0 .25rem; border-radius: .3rem; background: #eef2f7; color: #17253a; font-size: .95em; }
	.alert { margin-top: .4rem; color: #b91c1c; font-weight: 800; }
	button { min-height: 2.75rem; padding: .45rem 1rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	button.small { min-height: 2.2rem; padding: .2rem .8rem; font-size: .88rem; }
	button.primary { border-color: #1d4ed8; background: #1d4ed8; color: white; }
	button.selected { border-color: #1d4ed8; background: #dbeafe; }
	button:disabled { opacity: .5; cursor: not-allowed; }
	button:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .cycle li { transition: none; } }
</style>
