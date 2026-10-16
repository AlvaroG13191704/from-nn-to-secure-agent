<script lang="ts">
	import { onMount } from 'svelte';
	import { classifyNanoAvailability, NANO_REQUIREMENTS, type BrainSelection } from '#lib/domain/agents/brain-selection.js';
	import { costUsd, formatUsd, REFERENCE_PRICING, type TokenUsage } from '#lib/domain/agents/budget.js';
	import { createNanoBrain, downloadNano, isPromptApiSupported, nanoAvailability } from '#lib/brains/nano-brain.js';
	import { loadBrainPreference, saveBrainPreference } from '#lib/state/brain-preference.js';

	type Phase = 'idle' | 'checking' | 'checked' | 'downloading' | 'testing';
	let phase = $state<Phase>('idle');
	let selection = $state<BrainSelection | null>(null);
	let progress = $state(0);
	let errorMessage = $state('');
	let test = $state<{ answer: string; seconds: number; usage: TokenUsage } | null>(null);
	let previous = $state<ReturnType<typeof loadBrainPreference>>(null);

	const testSchema = { type: 'object', properties: { respuesta: { type: 'string' } }, required: ['respuesta'] };

	function remember(result: BrainSelection) {
		selection = result;
		saveBrainPreference({ brain: result.brain, status: result.status, checkedAt: Date.now() });
		previous = loadBrainPreference();
	}

	async function check() {
		phase = 'checking';
		errorMessage = '';
		test = null;
		try {
			remember(classifyNanoAvailability({ supported: isPromptApiSupported(), availability: await nanoAvailability() }));
		} catch (error) {
			remember(classifyNanoAvailability({ supported: isPromptApiSupported(), error: (error as Error).name }));
		}
		phase = 'checked';
	}

	async function download() {
		phase = 'downloading';
		progress = 0;
		errorMessage = '';
		try {
			await downloadNano((fraction) => (progress = fraction));
			await check();
		} catch (error) {
			errorMessage = `La descarga se detuvo: ${(error as Error).message}. Revisa tu espacio libre y vuelve a intentarlo.`;
			phase = 'checked';
		}
	}

	async function tryNano() {
		phase = 'testing';
		errorMessage = '';
		const started = performance.now();
		try {
			const reply = await createNanoBrain()({
				system: 'Eres un asistente breve. Respondes en español con un objeto JSON.',
				messages: [{ role: 'user', text: '¿Cuál es la capital de Guatemala? Responde en una oración.' }],
				schema: testSchema
			});
			const parsed = JSON.parse(reply.text) as { respuesta?: string };
			test = { answer: parsed.respuesta ?? reply.text, seconds: (performance.now() - started) / 1000, usage: reply.usage };
		} catch (error) {
			errorMessage = `Gemini Nano no pudo responder: ${(error as Error).message}`;
		}
		phase = 'checked';
	}

	onMount(() => {
		previous = loadBrainPreference();
	});
</script>

<div class="device-check">
<div class="device-check__steps">
<section class="lesson step" aria-labelledby="check-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">1</span><h2 id="check-title"><span class="sr-only">Paso 1: </span>Revisa tu computadora</h2></div>
	<p>Voy a preguntarle a tu navegador si puede usar Gemini Nano. No se envía ningún dato a internet.</p>
	<button class="primary" type="button" onclick={check} disabled={phase === 'checking' || phase === 'downloading' || phase === 'testing'}>
		{phase === 'checking' ? 'Revisando…' : selection ? 'Revisar otra vez' : 'Revisar mi computadora'}
	</button>
	{#if previous && !selection}
		<p class="previous">Última revisión en este navegador: {previous.brain === 'nano' ? 'Gemini Nano' : 'Gemini Flash con presupuesto'} ({new Date(previous.checkedAt).toLocaleString('es-GT')}).</p>
	{/if}

	{#if selection}
		<div class="result" class:nano={selection.brain === 'nano'} role="status" aria-live="polite">
			<p class="result-label">Tu cerebro para el laboratorio</p>
			<h3>{selection.brain === 'nano' ? 'Gemini Nano, en tu computadora' : 'Gemini Flash, con presupuesto'}</h3>
			<p>{selection.message}</p>
		</div>
	{/if}
</section>

{#if selection && (selection.status === 'needs-download' || selection.status === 'downloading' || phase === 'downloading')}
	<section class="lesson step" aria-labelledby="download-title">
		<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2</span><h2 id="download-title"><span class="sr-only">Paso 2: </span>Descarga Gemini Nano</h2></div>
		<p>Chrome descarga el modelo una sola vez y lo comparte entre páginas. Hazlo en casa, con la computadora conectada a la corriente y una conexión estable.</p>
		<button class="primary" type="button" onclick={download} disabled={phase === 'downloading'}>{phase === 'downloading' ? 'Descargando…' : 'Descargar Gemini Nano'}</button>
		{#if phase === 'downloading'}
			<progress max="1" value={progress} aria-label="Avance de la descarga"></progress>
			<p class="progress-text" aria-live="polite">{Math.round(progress * 100)} % descargado</p>
		{/if}
	</section>
{/if}

{#if selection?.status === 'ready'}
	<section class="lesson step" aria-labelledby="try-title">
		<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2</span><h2 id="try-title"><span class="sr-only">Paso 2: </span>Haz una pregunta de prueba</h2></div>
		<p>Voy a pedirle a Gemini Nano una respuesta en formato JSON, igual que hará el harness de tu agente.</p>
		<button class="primary" type="button" onclick={tryNano} disabled={phase === 'testing'}>{phase === 'testing' ? 'Pensando…' : 'Probar Gemini Nano'}</button>
		{#if test}
			<div class="test-result" aria-live="polite">
				<p><strong>Respuesta:</strong> {test.answer}</p>
				<dl>
					<div><dt>Tiempo</dt><dd>{test.seconds.toFixed(1)} s</dd></div>
					<div><dt>Tokens de entrada</dt><dd>{test.usage.inputTokens}</dd></div>
					<div><dt>Tokens de salida</dt><dd>{test.usage.outputTokens}</dd></div>
					<div><dt>Costo con Gemini Flash</dt><dd>{formatUsd(costUsd(test.usage, REFERENCE_PRICING))}</dd></div>
				</dl>
				<p class="small">Con Gemini Nano pagaste $0: el modelo corrió en tu computadora. El último dato es lo que habría costado en la nube.</p>
			</div>
		{/if}
	</section>
{/if}

{#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
</div>

<section class="lesson lesson--closing requirements-sheet" aria-labelledby="requirements-title">
	<h2 id="requirements-title">Requisitos de Gemini Nano</h2>
	<ul class="requirements">
		<li><strong>Navegador:</strong> Google Chrome {NANO_REQUIREMENTS.minChromeVersion} o superior en Windows 10/11, macOS 13+, Linux o Chromebook Plus. No funciona en celulares.</li>
		<li><strong>Disco:</strong> al menos {NANO_REQUIREMENTS.freeDiskGb} GB libres.</li>
		<li><strong>Memoria:</strong> una tarjeta gráfica con más de {NANO_REQUIREMENTS.minVramGb} GB de memoria, o {NANO_REQUIREMENTS.minRamGb} GB de RAM y {NANO_REQUIREMENTS.minCpuCores} núcleos.</li>
	</ul>
	<details>
		<summary>¿Algo no funcionó?</summary>
		<ul>
			<li>Actualiza Chrome desde <code>chrome://settings/help</code> y reinícialo.</li>
			<li>Abre <code>chrome://on-device-internals</code> para ver el estado del modelo en tu computadora.</li>
			<li>Si falta espacio, libera disco y vuelve a revisar: Chrome borra el modelo cuando quedan menos de 10 GB libres.</li>
			<li>Si nada funciona, no te preocupes: el día del taller usarás Gemini Flash con presupuesto.</li>
		</ul>
	</details>
</section>
</div>

<style>
	/* Steps on the left, requirements beside them on a wide screen. */
	.device-check { display: grid; gap: 0 clamp(1.5rem, 3vw, 3rem); align-items: start; }
	.device-check__steps { min-width: 0; }
	@media (min-width: 1100px) {
		.device-check { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); }
		.requirements-sheet { position: sticky; top: 5.5rem; }
	}
	.step .lesson__head { margin-bottom: 1rem; }
	.requirements-sheet h2 { margin: 0 0 1rem; color: var(--color-ink); }
	h3 { margin: 0 0 0.4rem; color: var(--color-ink); font-size: 1.3rem; font-weight: 600; }
	p { max-width: 70ch; margin: 0 0 1rem; color: #2b3a55; font-size: 1.05rem; line-height: 1.65; }
	.primary { min-height: 3rem; border: 1px solid var(--color-primary); border-radius: 0.5rem; background: var(--color-primary); padding: 0.65rem 1.35rem; color: white; font: inherit; font-weight: 700; cursor: pointer; }
	.primary:hover { border-color: #1a42b0; background: #1a42b0; }
	.primary:disabled { cursor: progress; opacity: 0.6; }
	.previous { margin-top: 0.9rem; color: var(--color-muted); font-size: 0.95rem; }
	.result { margin-top: 1.25rem; padding: 1rem 1.2rem; border-left: 4px solid var(--color-primary); background: #f1f4fd; }
	.result.nano { border-color: var(--color-accent); background: var(--color-accent-soft); }
	.result p:last-child { margin: 0; color: var(--color-ink); }
	.result-label { margin: 0 0 0.3rem; color: var(--color-muted); font-size: 0.95rem; font-weight: 700; }
	progress { display: block; width: 100%; height: 0.9rem; margin-top: 1rem; accent-color: var(--color-accent); }
	.progress-text { margin-top: 0.4rem; font-weight: 700; }
	.test-result { margin-top: 1.1rem; padding: 1rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: var(--color-canvas); }
	.test-result p { color: var(--color-ink); }
	.test-result dl { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6rem; margin: 0 0 0.8rem; }
	.test-result dl div { padding: 0.6rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: var(--color-surface); }
	.test-result dt { color: var(--color-muted); font-size: 0.85rem; font-weight: 700; }
	.test-result dd { margin: 0.2rem 0 0; color: var(--color-ink); font-size: 1.1rem; font-weight: 700; font-variant-numeric: tabular-nums; }
	.small { margin: 0; color: var(--color-muted); font-size: 0.92rem; }
	.error { margin: 0 0 2rem; padding: 1rem 1.2rem; border-left: 4px solid #b91c1c; background: #fef2f2; color: #991b1b; }
	.requirements { display: grid; gap: 0.6rem; margin: 0 0 1.25rem; padding-left: 1.2rem; color: #2b3a55; line-height: 1.6; }
	.requirements strong { color: var(--color-ink); }
	details { padding: 0.8rem 1rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: var(--color-canvas); }
	summary { color: var(--color-primary); font-weight: 700; cursor: pointer; }
	details ul { display: grid; gap: 0.4rem; margin: 0.7rem 0 0; padding-left: 1.2rem; color: #2b3a55; line-height: 1.55; }
	code { overflow-wrap: anywhere; }
	@media (max-width: 1280px) { .test-result dl { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
