<script lang="ts">
	import { onMount } from 'svelte';

	let { tool, args, onDecide }: { tool: string; args: Record<string, unknown>; onDecide: (approved: boolean) => void } = $props();

	const uid = $props.id();
	let dialog: HTMLDialogElement | undefined = $state();
	let denyButton: HTMLButtonElement | undefined = $state();
	let decided = false;

	const value = (key: string) => String(args[key] ?? '').trim() || '(vacío)';
	const summary = $derived(tool === 'enviar_correo'
		? `Enviar un correo a ${value('destinatario')} con asunto «${value('asunto')}».`
		: `Usar la herramienta ${tool}.`);
	const details = $derived(Object.entries(args).filter(([, item]) => String(item ?? '').trim() !== ''));

	function decide(approved: boolean) {
		if (decided) return;
		decided = true;
		dialog?.close();
		onDecide(approved);
	}

	onMount(() => {
		if (dialog && !dialog.open) dialog.showModal();
		// The safe choice gets focus first, so pressing Enter by accident never approves a side effect.
		denyButton?.focus();
		return () => dialog?.close();
	});
</script>

<dialog
	bind:this={dialog}
	class="approval"
	aria-labelledby={`${uid}-title`}
	aria-describedby={`${uid}-summary`}
	oncancel={(event) => { event.preventDefault(); decide(false); }}
>
	<p class="eyebrow">Guardrail: confirmación humana</p>
	<h3 id={`${uid}-title`}>Tu agente quiere hacer algo con efectos reales</h3>
	<p id={`${uid}-summary`} class="summary">{summary}</p>
	{#if details.length}
		<dl>
			{#each details as [key, item] (key)}
				<div><dt>{key}</dt><dd>{String(item)}</dd></div>
			{/each}
		</dl>
	{/if}
	<p class="note">Si no lo pediste tú, no lo apruebes. Esc también lo rechaza.</p>
	<div class="actions">
		<button type="button" bind:this={denyButton} class="deny" onclick={() => decide(false)}>No, rechazar</button>
		<button type="button" class="approve" onclick={() => decide(true)}>Sí, permitir</button>
	</div>
</dialog>

<style>
	.approval { width: min(36rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem); padding: clamp(1rem, 3vw, 1.5rem); border: 2px solid #b45309; border-radius: 1rem; background: #fff; color: #17253a; box-shadow: 0 24px 48px rgb(23 37 58 / 25%); overflow-wrap: anywhere; }
	.approval::backdrop { background: rgb(15 23 42 / 55%); }
	.eyebrow { margin: 0 0 .4rem; color: #b45309; font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
	h3 { margin: 0 0 .6rem; font-size: clamp(1.15rem, 2.4vw, 1.45rem); }
	.summary { margin: 0 0 .75rem; font-size: 1.05rem; font-weight: 800; line-height: 1.5; }
	dl { display: grid; gap: .4rem; margin: 0 0 .75rem; }
	dl div { padding: .45rem .7rem; border-radius: .6rem; background: #f8fafc; }
	dt { color: #52627a; font-size: .8rem; font-weight: 800; }
	dd { margin: .1rem 0 0; white-space: pre-wrap; max-height: 10rem; overflow-y: auto; }
	.note { margin: 0 0 1rem; color: #52627a; font-size: .9rem; }
	.actions { display: flex; flex-wrap: wrap; gap: .6rem; }
	button { min-height: 2.75rem; padding: .5rem 1rem; border-radius: 999px; font: inherit; font-weight: 800; cursor: pointer; }
	.deny { border: 1px solid #1d4ed8; background: #1d4ed8; color: #fff; }
	.approve { border: 1px solid #b91c1c; background: #fff; color: #991b1b; }
	button:focus-visible { outline: 3px solid #f59e0b; outline-offset: 3px; }
</style>
