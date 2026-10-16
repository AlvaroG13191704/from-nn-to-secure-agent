<script lang="ts">
	import type { AgentEvent } from '#lib/domain/agents/harness.js';

	type VisibleEvent = Exclude<AgentEvent, { type: 'done' }>;
	type BlockedEvent = Extract<AgentEvent, { type: 'blocked' }>;

	let { events }: { events: AgentEvent[] } = $props();

	const PREVIEW_CHARS = 160;
	let expanded = $state<Record<number, boolean>>({});

	const visible = $derived(events.filter((event): event is VisibleEvent => event.type !== 'done'));

	function filledArgs(args: Record<string, unknown>) {
		return Object.entries(args).filter(([, value]) => value !== '' && value !== undefined && value !== null);
	}

	function blockedReason(event: BlockedEvent) {
		if (event.reason === 'human-denied') return 'No aprobaste la acción, así que el harness no la ejecutó.';
		if (event.reason === 'missing-arguments') return `Faltan argumentos (${(event.missing ?? []).join(', ')}): el harness no la ejecutó y le pidió al modelo que los complete.`;
		return 'Tu agente no tiene esa herramienta entre sus bloques: el harness la bloqueó.';
	}

	function toggle(index: number) {
		expanded = { ...expanded, [index]: !expanded[index] };
	}
</script>

<ol class="log" aria-label="Registro de la ejecución">
	{#if visible.length === 0}
		<li class="empty">Cuando pruebes tu agente, aquí verás cada paso: lo que piensa, las herramientas que pide y lo que observa.</li>
	{/if}
	{#each visible as event, index (index)}
		<li class={`event ${event.type}`} class:danger={event.type === 'tool-result' && event.tool === 'enviar_correo'}>
			{#if event.type === 'usage'}
				<p class="usage">Paso {event.step} · {event.usage.inputTokens} tokens de entrada, {event.usage.outputTokens + event.usage.thinkingTokens} de salida{#if event.usage.thinkingTokens} ({event.usage.thinkingTokens} de razonamiento){/if}</p>
			{:else if event.type === 'thought'}
				<p><span class="tag">💭 Pensamiento</span> {event.text}</p>
			{:else if event.type === 'tool-call'}
				{@const args = filledArgs(event.args)}
				<p><span class="tag">🔧 Herramienta</span> <code>{event.tool}</code>{#if args.length === 0} sin argumentos{/if}</p>
				{#if args.length}
					<ul class="args">
						{#each args as [key, value] (key)}
							<li><code>{key}</code>: «{String(value)}»</li>
						{/each}
					</ul>
				{/if}
			{:else if event.type === 'tool-result'}
				{@const long = event.output.length > PREVIEW_CHARS}
				<p><span class="tag">👀 Observación</span> de <code>{event.tool}</code>: {long && !expanded[index] ? `${event.output.slice(0, PREVIEW_CHARS)}…` : event.output}</p>
				{#if long}
					<button type="button" class="small" aria-expanded={Boolean(expanded[index])} onclick={() => toggle(index)}>{expanded[index] ? 'Ver menos' : 'Ver todo'}</button>
				{/if}
				{#if event.tool === 'enviar_correo'}
					<p class="alert">Tu agente envió un correo. Revisa a quién y por qué.</p>
				{/if}
			{:else if event.type === 'blocked'}
				<p><span class="tag">⛔ Bloqueado</span> <code>{event.tool}</code>. {blockedReason(event)}</p>
			{:else if event.type === 'invalid'}
				<p><span class="tag">⚠️ Respuesta inválida</span> El modelo no respondió con un JSON válido; el harness le pidió que lo corrija.</p>
				<p class="raw"><code>{event.raw.length > PREVIEW_CHARS ? `${event.raw.slice(0, PREVIEW_CHARS)}…` : event.raw || '(vacío)'}</code></p>
			{:else if event.type === 'answer'}
				<p><span class="tag">✅ Respuesta final</span> {event.text || '(respuesta vacía)'}</p>
			{/if}
		</li>
	{/each}
</ol>

<style>
	.log { display: grid; gap: .5rem; margin: .75rem 0 0; padding: 0; list-style: none; }
	.log li { padding: .55rem .9rem; border: 1px solid #d9e1eb; border-left-width: 4px; border-radius: .7rem; background: white; overflow-wrap: anywhere; }
	.log p { margin: .15rem 0; color: #17253a; line-height: 1.55; }
	.event.thought { border-left-color: #1d4ed8; }
	.event.tool-call { border-left-color: #f97316; }
	.event.tool-result { border-left-color: #0f766e; }
	.event.blocked { border-left-color: #b45309; background: #fffbeb; }
	.event.invalid { border-left-color: #a16207; background: #fefce8; }
	.event.answer { border-left-color: #0f766e; background: #f0fdfa; }
	.event.usage { padding: .3rem .9rem; border-left-color: #d9e1eb; background: #fbfdff; }
	.event.usage .usage { color: #52627a; font-size: .85rem; }
	.event.danger { border-color: #b91c1c; background: #fef2f2; }
	.empty { color: #52627a; font-style: italic; }
	.tag { margin-right: .25rem; font-weight: 800; }
	.args { margin: .2rem 0 0; padding-left: 1.2rem; color: #17253a; }
	.raw code { font-size: .85em; }
	code { padding: 0 .25rem; border-radius: .3rem; background: #eef2f7; color: #17253a; font-size: .95em; }
	.alert { margin-top: .4rem; color: #b91c1c; font-weight: 800; }
	button.small { min-height: 2.2rem; padding: .2rem .8rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-size: .88rem; font-weight: 800; cursor: pointer; }
	button.small:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
</style>
