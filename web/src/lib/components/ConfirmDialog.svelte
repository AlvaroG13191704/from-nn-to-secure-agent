<script lang="ts">
	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel,
		cancelLabel = 'Cancelar',
		onConfirm
	}: { open: boolean; title: string; message: string; confirmLabel: string; cancelLabel?: string; onConfirm: () => void } = $props();

	const uid = $props.id();
	let dialog: HTMLDialogElement | undefined = $state();
	let cancelButton: HTMLButtonElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			// The safe choice gets focus first, so an accidental Enter never erases progress.
			cancelButton?.focus();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	function confirm() {
		open = false;
		onConfirm();
	}
</script>

<dialog
	bind:this={dialog}
	class="confirm"
	aria-labelledby={`${uid}-title`}
	aria-describedby={`${uid}-message`}
	oncancel={(event) => { event.preventDefault(); open = false; }}
	onclick={(event) => { if (event.target === dialog) open = false; }}
>
	<h3 id={`${uid}-title`}>{title}</h3>
	<p id={`${uid}-message`}>{message}</p>
	<div class="actions">
		<button type="button" class="cancel" bind:this={cancelButton} onclick={() => (open = false)}>{cancelLabel}</button>
		<button type="button" class="danger" onclick={confirm}>{confirmLabel}</button>
	</div>
</dialog>

<style>
	.confirm { width: min(32rem, calc(100vw - 2rem)); margin: auto; padding: clamp(1.25rem, 3vw, 1.75rem); border: 1px solid var(--color-line); border-top: 4px solid var(--color-ink); border-radius: 0 0 var(--radius-panel) var(--radius-panel); background: var(--color-surface); color: var(--color-ink); box-shadow: 0 24px 48px rgb(20 33 61 / 22%); }
	.confirm::backdrop { background: rgb(20 33 61 / 55%); }
	h3 { margin: 0 0 0.6rem; font-family: var(--font-serif); font-size: 1.35rem; font-weight: 600; }
	p { margin: 0 0 1.25rem; color: var(--color-muted); line-height: 1.55; }
	.actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.6rem; }
	button { min-height: 2.75rem; padding: 0.5rem 1.1rem; border-radius: 0.4rem; font: inherit; font-weight: 700; cursor: pointer; }
	button:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	.cancel { border: 1px solid var(--color-primary); background: var(--color-primary); color: #fff; }
	.danger { border: 1px solid #a4282f; background: #fff; color: #a4282f; }
	.danger:hover { background: #fcf3f3; }
</style>
