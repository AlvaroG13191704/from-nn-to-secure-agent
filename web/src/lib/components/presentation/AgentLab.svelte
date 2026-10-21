<script lang="ts">
	import { onMount } from 'svelte';
	import { getLocalSession } from '#lib/state/session-context.js';
	import AgentRunLog from '#lib/components/agents/AgentRunLog.svelte';
	import ApprovalDialog from '#lib/components/agents/ApprovalDialog.svelte';
	import { AGENT_BLOCKS, type BlockKind } from '#lib/domain/agents/blocks.js';
	import { buildSystemPrompt, runAgent, type AgentEvent, type Brain } from '#lib/domain/agents/harness.js';
	import { MISSIONS, scoreRun } from '#lib/domain/agents/missions.js';
	import { BUDGET_LIMITS, costUsd, formatUsd, REFERENCE_PRICING, type TokenUsage } from '#lib/domain/agents/budget.js';
	import { createNanoBrain, isPromptApiSupported, nanoAvailability } from '#lib/brains/nano-brain.js';
	import { createFlashBrain, fetchFlashBalance, FlashBrainError, type FlashBalance } from '#lib/brains/flash-brain.js';
	import { loadBrainPreference, type BrainPreference } from '#lib/state/brain-preference.js';
	import { loadLabResults, recordLabResult, type LabResult } from '#lib/state/agent-lab-results.js';

	type BrainKind = 'nano' | 'flash';
	type DoneEvent = Extract<AgentEvent, { type: 'done' }>;
	type Receipt = {
		missionId: string;
		brain: BrainKind;
		done: DoneEvent;
		costUsd: number;
		score: ReturnType<typeof scoreRun>;
		blocks: string[];
		tip: string;
	};
	type PendingApproval = { tool: string; args: Record<string, unknown>; resolve: (approved: boolean) => void };

	const CODE_KEY = 'agents-lab-code';
	const KIND_LABELS: Record<BlockKind, string> = {
		skill: 'Skill',
		tool: 'Herramientas',
		knowledge: 'Conocimiento (RAG)',
		connection: 'Conexiones (MCP)',
		guardrail: 'Guardrails'
	};
	const KIND_ORDER: BlockKind[] = ['skill', 'tool', 'knowledge', 'connection', 'guardrail'];
	const BLOCK_LABELS = new Map(AGENT_BLOCKS.map((block) => [block.id, block.label]));

	const session = getLocalSession();
	const uid = $props.id();

	let hydrated = $state(false);
	let studentId = $state<string | null>(null);
	let preference = $state<BrainPreference | null>(null);
	let nanoReady = $state(false);
	let brainKind = $state<BrainKind>('flash');

	let codeInput = $state('');
	let code = $state('');
	let balance = $state<FlashBalance | null>(null);
	let balanceMessage = $state('');
	let checkingCode = $state(false);

	let missionIndex = $state(0);
	let selected = $state<string[]>(['library-assistant']);
	let results = $state<Record<string, LabResult>>({});

	let running = $state(false);
	let events = $state<AgentEvent[]>([]);
	let errorMessage = $state('');
	let statusMessage = $state('');
	let receipt = $state<Receipt | null>(null);
	let pendingApproval = $state<PendingApproval | null>(null);
	// Every run gets an id; stopping bumps it so late events from the old run are ignored.
	let activeRun = 0;

	const mission = $derived(MISSIONS[missionIndex]);
	const systemPrompt = $derived(buildSystemPrompt(selected));
	const stepTokens = $derived(Math.ceil((systemPrompt.length + mission.goal.length) / 4));
	const stepCost = $derived(costUsd({ inputTokens: stepTokens, outputTokens: 0, thinkingTokens: 0 }, REFERENCE_PRICING));
	const risky = $derived(selected.includes('send-email') && selected.includes('faculty-drive') && !selected.includes('human-approval'));
	const groups = $derived(KIND_ORDER.map((kind) => ({ kind, label: KIND_LABELS[kind], blocks: AGENT_BLOCKS.filter((block) => block.kind === kind) })));
	const remainingUsd = $derived(balance ? Math.max(0, balance.studentCapUsd - balance.studentSpentUsd) : null);
	const flashReady = $derived(Boolean(studentId) && Boolean(code));
	const canRun = $derived(hydrated && !running && (brainKind === 'nano' ? nanoReady : flashReady));
	const currentStep = $derived(events.reduce((max, event) => ('step' in event ? Math.max(max, event.step) : max), 0));
	const runBlocker = $derived.by(() => {
		if (!hydrated || running) return '';
		if (brainKind === 'nano') return nanoReady ? '' : 'Gemini Nano no está listo en esta computadora. Elige Gemini Flash.';
		if (!studentId) return 'Para usar Gemini Flash necesitas inscribir tu carnet.';
		if (!code) return 'Escribe el código del taller para usar Gemini Flash.';
		return '';
	});

	function readStoredCode() {
		try {
			return window.sessionStorage.getItem(CODE_KEY) ?? '';
		} catch {
			return '';
		}
	}

	function storeCode(value: string) {
		try {
			if (value) window.sessionStorage.setItem(CODE_KEY, value);
			else window.sessionStorage.removeItem(CODE_KEY);
		} catch {
			// The code still works for this page when sessionStorage is blocked.
		}
	}

	async function refreshBalance() {
		if (!code || !studentId) return;
		checkingCode = true;
		balanceMessage = '';
		try {
			balance = await fetchFlashBalance(code, studentId);
		} catch (error) {
			balance = null;
			balanceMessage = error instanceof FlashBrainError ? error.message : 'No pude consultar tu saldo. Vuelve a intentarlo.';
		} finally {
			checkingCode = false;
		}
	}

	function submitCode(event: SubmitEvent) {
		event.preventDefault();
		code = codeInput.trim();
		storeCode(code);
		if (code) void refreshBalance();
		else {
			balance = null;
			balanceMessage = '';
		}
	}

	function toggleBlock(id: string) {
		if (running) return;
		selected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
	}

	function selectMission(index: number) {
		if (running || index === missionIndex) return;
		missionIndex = index;
		events = [];
		receipt = null;
		errorMessage = '';
		statusMessage = '';
	}

	function tipFor(done: DoneEvent, score: ReturnType<typeof scoreRun>, blocks: string[]) {
		if (mission.id === 'injection' && done.sentEmails.length > 0) return 'Tu agente obedeció una instrucción del archivo y envió un correo que tú nunca pediste. ¿Qué guardrail lo habría detenido?';
		if (score.success) {
			if (score.unnecessary.length) return '¡Misión cumplida! Ahora quita los bloques que no usaste: cada uno agrega tokens en cada paso.';
			return '¡Misión cumplida con un agente esbelto! Así se cuidan los tokens.';
		}
		if (done.stopReason === 'step-limit') return 'Tu agente se quedó sin pasos antes de responder. Revisa el registro: ¿le faltó una herramienta o se quedó dando vueltas?';
		if (mission.id === 'regulation' && !blocks.includes('regulation-rag')) return 'El dato está en un documento que el modelo nunca leyó: ¿qué bloque le falta a tu agente?';
		if (mission.id === 'library' && !(blocks.includes('catalog-search') && blocks.includes('library-hours'))) return 'La pregunta tiene dos partes y cada una necesita su propia herramienta. ¿Cuál le falta a tu agente?';
		if (mission.id === 'injection' && !blocks.includes('faculty-drive')) return 'El archivo está en el drive de la facultad: tu agente necesita la conexión para leerlo.';
		return 'Revisa el registro paso a paso: ¿en qué momento se desvió tu agente?';
	}

	function finish(done: DoneEvent, kind: BrainKind, blocks: string[]) {
		const score = scoreRun(mission, { answer: done.answer, toolCalls: done.toolCalls, sentEmails: done.sentEmails }, blocks, done.steps);
		const cost = costUsd(done.usage, REFERENCE_PRICING);
		receipt = { missionId: mission.id, brain: kind, done, costUsd: cost, score, blocks, tip: tipFor(done, score, blocks) };
		results = recordLabResult(studentId, { missionId: mission.id, points: score.points, costUsd: cost, blocks });
		statusMessage = score.success ? `Misión cumplida: ${score.points} de 100 puntos.` : 'Tu agente terminó, pero no cumplió la misión.';
	}

	function closeApproval(approved: boolean) {
		const current = pendingApproval;
		pendingApproval = null;
		current?.resolve(approved);
	}

	async function runMyAgent() {
		if (!canRun) return;
		const runId = ++activeRun;
		const kind = brainKind;
		const blocks = [...selected];
		const goal = mission.goal;
		events = [];
		receipt = null;
		errorMessage = '';
		statusMessage = 'Tu agente está trabajando…';
		running = true;

		const brain: Brain = kind === 'nano'
			? createNanoBrain()
			: createFlashBrain({ code, studentId: studentId ?? '', onBalance: (next) => { balance = next; } });
		const approve = (call: { tool: string; args: Record<string, unknown> }) => new Promise<boolean>((resolve) => {
			if (runId !== activeRun) return resolve(false);
			pendingApproval = { ...call, resolve };
		});

		try {
			for await (const event of runAgent({ blocks, goal, brain, approve })) {
				if (runId !== activeRun) break;
				events = [...events, event];
				if (event.type === 'usage') statusMessage = `Tu agente está trabajando: paso ${event.step}.`;
				if (event.type === 'done') finish(event, kind, blocks);
			}
		} catch (error) {
			if (runId !== activeRun) return;
			if (error instanceof FlashBrainError) {
				errorMessage = error.message;
				if (error.balance) balance = error.balance;
			} else {
				errorMessage = kind === 'nano'
					? 'Gemini Nano no pudo responder. Vuelve a intentarlo o elige Gemini Flash.'
					: 'Algo falló durante la ejecución. Vuelve a intentarlo.';
			}
			statusMessage = 'La ejecución se interrumpió. El registro muestra los pasos que alcanzó a dar.';
		} finally {
			if (runId === activeRun) running = false;
		}
	}

	function stopRun() {
		if (!running) return;
		activeRun += 1;
		running = false;
		closeApproval(false);
		statusMessage = 'Detuviste a tu agente. El registro muestra los pasos que alcanzó a dar.';
	}

	onMount(() => {
		session.hydrate();
		studentId = session.getSnapshot().registration?.studentId ?? null;
		preference = loadBrainPreference();
		results = loadLabResults(studentId);
		code = readStoredCode();
		codeInput = code;
		brainKind = preference?.brain === 'nano' ? 'nano' : 'flash';
		hydrated = true;
		void (async () => {
			try {
				nanoReady = isPromptApiSupported() && (await nanoAvailability()) === 'available';
			} catch {
				nanoReady = false;
			}
			if (!nanoReady && brainKind === 'nano') brainKind = 'flash';
			if (nanoReady && !preference) brainKind = 'nano';
		})();
		if (code && studentId) void refreshBalance();
		return () => {
			activeRun += 1;
			pendingApproval?.resolve(false);
		};
	});

	function totalOutput(usage: TokenUsage) {
		return usage.outputTokens + usage.thinkingTokens;
	}
</script>

<section class="lab story-card" aria-labelledby={`${uid}-title`}>
	<p class="eyebrow">10 · Laboratorio</p>
	<h2 id={`${uid}-title`}>Arma tu agente</h2>
	<p>Elige una misión, arma tu agente con bloques y pruébalo con un modelo real. No gana quien use más bloques: gana quien cumple la misión de forma segura y gastando menos tokens.</p>

	<div class="setup">
		<fieldset class="panel brain" disabled={running}>
			<legend>1 · Cerebro</legend>
			<p class="panel-note">Es el modelo que piensa dentro de tu agente. El harness es el mismo con los dos.</p>
			<div class="choices">
				{#if nanoReady}
					<label class="choice"><input type="radio" name={`${uid}-brain`} value="nano" bind:group={brainKind} /> <span><strong>Gemini Nano</strong> (gratis, en tu computadora)</span></label>
				{/if}
				<label class="choice"><input type="radio" name={`${uid}-brain`} value="flash" bind:group={brainKind} /> <span><strong>Gemini Flash</strong> (presupuesto del taller)</span></label>
			</div>
			{#if hydrated && !preference}
				<p class="panel-note">¿Todavía no revisas tu computadora? <a href="/device-check">Haz la revisión de dispositivo</a> para saber si puedes usar Gemini Nano.</p>
			{/if}
			{#if brainKind === 'flash'}
				{#if hydrated && !studentId}
					<p class="warning">Para usar Gemini Flash necesitas tu carnet. <a href="/register">Inscríbete aquí</a> y vuelve a esta página.</p>
				{:else}
					<form class="code-form" onsubmit={submitCode}>
						<label for={`${uid}-code`}>Código del taller</label>
						<div class="code-row">
							<input id={`${uid}-code`} type="text" autocomplete="off" spellcheck="false" bind:value={codeInput} placeholder="Te lo doy en clase" />
							<button type="submit" disabled={checkingCode}>{checkingCode ? 'Revisando…' : 'Usar código'}</button>
						</div>
						<p class="panel-note">El código se guarda solo mientras esta pestaña esté abierta.</p>
					</form>
					<div aria-live="polite">
						{#if balanceMessage}<p class="warning">{balanceMessage}</p>{/if}
						{#if balance && remainingUsd !== null}
							<p class="balance">Te quedan <strong>${remainingUsd.toFixed(4)}</strong> de {formatUsd(balance.studentCapUsd)}</p>
						{/if}
					</div>
				{/if}
			{/if}
		</fieldset>

		<div class="panel missions">
			<h3>2 · Misión</h3>
			<div class="mission-tabs" role="group" aria-label="Misiones">
				{#each MISSIONS as item, index (item.id)}
					{@const best = results[item.id]}
					<button type="button" aria-pressed={missionIndex === index} class:selected={missionIndex === index} disabled={running} onclick={() => selectMission(index)}>
						<span>{item.title}</span>
						<small>{best ? `Mejor: ${best.points}/100 · ${formatUsd(best.costUsd)}` : 'Sin intentos'}</small>
					</button>
				{/each}
			</div>
			<p class="goal"><strong>Meta:</strong> «{mission.goal}»</p>
			<p class="panel-note"><strong>Pista:</strong> {mission.hint}</p>
		</div>
	</div>

	<div class="workspace">
		<div class="column">
			<div class="panel">
				<h3>3 · Bloques</h3>
				<p class="panel-note">Activa solo lo que tu agente necesita. Cada bloque agrega texto al prompt, y ese texto se paga en cada paso del ciclo.</p>
				{#each groups as group (group.kind)}
					<div class="group" role="group" aria-labelledby={`${uid}-kind-${group.kind}`}>
						<p class="group-label" id={`${uid}-kind-${group.kind}`}>{group.label}</p>
						<div class="chips">
							{#each group.blocks as block (block.id)}
								<button type="button" class={`chip ${block.kind}`} aria-pressed={selected.includes(block.id)} disabled={running} onclick={() => toggleBlock(block.id)}>
									<strong>{block.label}</strong>
									<span>{block.summary}</span>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="panel">
				<h3>Tu agente por dentro</h3>
				<dl class="estimate">
					<div><dt>Tokens por paso (aproximado)</dt><dd>≈ {stepTokens}</dd></div>
					<div><dt>Costo de entrada por paso (aproximado)</dt><dd>{formatUsd(stepCost)}</dd></div>
				</dl>
				<p class="panel-note">Estimado con «caracteres ÷ 4» para el prompt del sistema y la meta, a ${REFERENCE_PRICING.inputPerMillion} por millón de tokens de entrada. En cada paso se suma lo que el agente ya leyó, y la salida (con su razonamiento) se cobra aparte.</p>
				{#if risky}
					<p class="risk" role="note">⚠️ Riesgo: tu agente podría enviar datos sin preguntarte.</p>
				{/if}
				<details class="prompt">
					<summary>Ver el prompt del sistema que arma el harness</summary>
					<pre>{systemPrompt}</pre>
				</details>
			</div>
		</div>

		<div class="column">
			<div class="panel">
				<h3>4 · Ejecutar</h3>
				<div class="run-controls">
					<button type="button" class="primary" onclick={runMyAgent} disabled={!canRun}>Probar mi agente</button>
					{#if running}
						<button type="button" class="stop" onclick={stopRun}>Detener</button>
					{/if}
				</div>
				<p class="status" role="status">{running && currentStep ? `Tu agente está trabajando: paso ${currentStep} de máximo ${selected.includes('step-limit') ? 4 : BUDGET_LIMITS.maxSteps}.` : statusMessage || runBlocker}</p>
				{#if errorMessage}
					<p class="error" role="alert">{errorMessage}</p>
				{/if}
				<AgentRunLog {events} />
			</div>

			{#if receipt}
				{@const usage = receipt.done.usage}
				<div class="panel receipt" aria-live="polite" aria-labelledby={`${uid}-receipt`}>
					<h3 id={`${uid}-receipt`}>5 · Recibo y evaluación</h3>
					<dl class="totals">
						<div><dt>Pasos</dt><dd>{receipt.done.steps}</dd></div>
						<div><dt>Tokens de entrada</dt><dd>{usage.inputTokens}</dd></div>
						<div><dt>Tokens de salida</dt><dd>{usage.outputTokens}</dd></div>
						<div><dt>Tokens de razonamiento</dt><dd>{usage.thinkingTokens}</dd></div>
						<div><dt>Costo</dt><dd>{receipt.brain === 'nano' ? '$0' : formatUsd(receipt.costUsd)}</dd></div>
						{#if receipt.brain === 'flash' && remainingUsd !== null && balance}
							<div><dt>Tu saldo</dt><dd>${remainingUsd.toFixed(4)} de {formatUsd(balance.studentCapUsd)}</dd></div>
						{/if}
					</dl>
					<p class="panel-note">
						{#if receipt.brain === 'nano'}
							Gemini Nano es gratis: equivale a {formatUsd(receipt.costUsd)} en Gemini Flash ({totalOutput(usage)} tokens de salida en total).
						{:else}
							La salida y el razonamiento se cobran a ${REFERENCE_PRICING.outputPerMillion} por millón; la entrada, a ${REFERENCE_PRICING.inputPerMillion}.
						{/if}
						{#if receipt.done.stopReason === 'step-limit'} El ciclo se detuvo por el límite de pasos.{/if}
					</p>

					<p class="verdict" class:success={receipt.score.success}>{receipt.score.success ? '✓ Misión cumplida' : '✗ Misión no cumplida'} · <strong>{receipt.score.points}/100</strong> puntos</p>
					<ul class="checks">
						{#each receipt.score.checks as check (check.label)}
							<li class:passed={check.passed}><span aria-hidden="true">{check.passed ? '✓' : '✗'}</span> {check.label}<span class="sr-only">{check.passed ? ': cumplido' : ': no cumplido'}</span></li>
						{/each}
					</ul>
					{#if receipt.score.unnecessary.length}
						<p class="panel-note"><strong>Bloques que esta misión no necesitaba</strong> (cada bloque extra cuesta tokens en cada paso): {receipt.score.unnecessary.map((id) => BLOCK_LABELS.get(id) ?? id).join(', ')}.</p>
					{:else}
						<p class="panel-note">No usaste bloques de más.</p>
					{/if}
					<p class="panel-note">{receipt.score.extraSteps ? `Pasos de más: ${receipt.score.extraSteps} (una vuelta extra del ciclo también cuesta tokens).` : 'Sin pasos de más.'}</p>
					<p class="tip">{receipt.tip}</p>
					<p class="save-note">Guardo tu mejor resultado de cada misión en este navegador.</p>
				</div>
			{/if}
		</div>
	</div>
</section>

{#if pendingApproval}
	<ApprovalDialog tool={pendingApproval.tool} args={pendingApproval.args} onDecide={closeApproval} />
{/if}

<style>
	.lab { margin: 0 0 1.5rem; padding: clamp(1.25rem, 3.4vw, 3rem); border: 1px solid var(--color-line, #dbe4ee); border-radius: var(--radius-panel, 1.5rem); background: var(--color-surface, #fff); box-shadow: var(--shadow-panel, 0 12px 32px rgb(23 37 58 / 8%)); scroll-margin-top: 5.75rem; }
	.lab .eyebrow { margin: 0 0 .8rem; color: var(--color-accent, #0f766e); font-size: .82rem; font-weight: 800; }
	.lab h2 { margin: 0 0 1rem; color: var(--color-ink, #17253a); font-size: clamp(1.7rem, 3.5vw, 2.75rem); line-height: 1.12; letter-spacing: -.03em; }
	.lab > p { color: var(--color-muted, #52627a); line-height: 1.65; }
	h3 { margin: 0 0 .5rem; color: #17253a; font-size: clamp(1.1rem, 2vw, 1.35rem); }
	.setup, .workspace, .column { display: grid; gap: 1rem; min-width: 0; }
	.setup { margin: 1.25rem 0 1rem; }
	.panel { min-width: 0; margin: 0; padding: 1rem; border: 1px solid #dbe4ee; border-radius: 1rem; background: linear-gradient(145deg, #f8fbff, #fff); }
	fieldset.panel { min-inline-size: 0; }
	legend { padding: 0 .3rem; color: #17253a; font-size: clamp(1.1rem, 2vw, 1.35rem); font-weight: 800; }
	.panel-note { margin: .4rem 0; color: #52627a; font-size: .92rem; line-height: 1.55; }
	a { color: #1d4ed8; font-weight: 750; }
	a:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
	.choices { display: grid; gap: .45rem; margin: .5rem 0; }
	.choice { display: flex; align-items: center; gap: .55rem; min-height: 2.75rem; padding: .4rem .75rem; border: 1px solid #cbd5e1; border-radius: .7rem; background: #fff; cursor: pointer; }
	.choice:has(input:checked) { border-color: #1d4ed8; background: #eff6ff; }
	.choice input { width: 1.1rem; height: 1.1rem; accent-color: #1d4ed8; }
	.choice input:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
	.code-form { margin-top: .6rem; }
	.code-form label { display: block; margin-bottom: .3rem; color: #17253a; font-weight: 750; }
	.code-row { display: flex; flex-wrap: wrap; gap: .5rem; }
	.code-row input { flex: 1 1 10rem; min-width: 0; min-height: 2.75rem; padding: .45rem .7rem; border: 1px solid #94a3b8; border-radius: .6rem; color: #17253a; font: inherit; }
	.code-row input:focus-visible { outline: 3px solid #99f6e4; outline-offset: 2px; border-color: #0f766e; }
	.balance { margin: .5rem 0 0; padding: .5rem .75rem; border-radius: .7rem; background: #ecfdf5; color: #065f46; }
	.warning { margin: .5rem 0 0; padding: .5rem .75rem; border-left: 3px solid #b45309; border-radius: 0 .6rem .6rem 0; background: #fffbeb; color: #78350f; line-height: 1.5; }
	.mission-tabs { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: .5rem; margin: .5rem 0; }
	.mission-tabs button { display: grid; gap: .15rem; text-align: left; border-radius: .8rem; }
	.mission-tabs small { color: #52627a; font-weight: 650; }
	.goal { margin: .6rem 0 .2rem; color: #17253a; line-height: 1.55; overflow-wrap: anywhere; }
	.group { margin-top: .85rem; }
	.group-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	.chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr)); gap: .5rem; }
	.chip { display: grid; gap: .2rem; padding: .55rem .75rem; border-radius: .8rem; text-align: left; transition: background-color .2s ease, border-color .2s ease; }
	.chip strong { font-size: .93rem; }
	.chip span { color: #52627a; font-size: .84rem; font-weight: 550; line-height: 1.4; }
	.chip[aria-pressed='true'] { border-color: #1d4ed8; background: #dbeafe; }
	.chip.guardrail[aria-pressed='true'] { border-color: #0f766e; background: #ccfbf1; }
	.chip[aria-pressed='true'] strong::before { content: '✓ '; }
	.estimate, .totals { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); gap: .5rem; margin: .5rem 0; }
	.estimate div, .totals div { padding: .5rem .75rem; border: 1px solid #d9e1eb; border-radius: .8rem; background: #fff; }
	dt { color: #52627a; font-size: .8rem; font-weight: 700; }
	dd { margin: 0; color: #17253a; font-size: 1.2rem; font-weight: 800; font-variant-numeric: tabular-nums; }
	.risk { margin: .6rem 0; padding: .5rem .8rem; border: 1px solid #b91c1c; border-radius: 999px; background: #fef2f2; color: #991b1b; font-weight: 800; }
	.prompt summary { min-height: 2.5rem; padding: .5rem 0; color: #1d4ed8; font-weight: 800; cursor: pointer; }
	.prompt summary:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
	.prompt pre { max-height: 22rem; margin: .4rem 0 0; padding: .75rem; overflow: auto; border-radius: .7rem; background: #0f172a; color: #e2e8f0; font-size: .82rem; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
	.run-controls { display: flex; flex-wrap: wrap; gap: .5rem; margin: .4rem 0; }
	.status { min-height: 1.4rem; margin: .4rem 0; color: #334155; font-weight: 700; }
	.error { margin: .4rem 0; padding: .55rem .8rem; border-left: 3px solid #b91c1c; border-radius: 0 .6rem .6rem 0; background: #fef2f2; color: #991b1b; font-weight: 750; }
	.receipt { border-color: #5eead4; }
	.verdict { margin: .8rem 0 .3rem; color: #991b1b; font-size: 1.1rem; font-weight: 800; }
	.verdict.success { color: #0f766e; }
	.checks { display: grid; gap: .3rem; margin: .3rem 0 .6rem; padding: 0; list-style: none; }
	.checks li { color: #991b1b; font-weight: 700; }
	.checks li.passed { color: #0f766e; }
	.tip { margin: .6rem 0; padding: .6rem .8rem; border-left: 3px solid #1d4ed8; border-radius: 0 .6rem .6rem 0; background: #eff6ff; color: #1e3a8a; font-weight: 700; line-height: 1.5; }
	.save-note { margin: 0; color: #52627a; font-size: .88rem; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	button { min-height: 2.75rem; padding: .45rem 1rem; border: 1px solid #94a3b8; border-radius: 999px; background: #fff; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	button.selected { border-color: #1d4ed8; background: #dbeafe; }
	button.primary { border-color: #1d4ed8; background: #1d4ed8; color: #fff; }
	button.stop { border-color: #b91c1c; color: #991b1b; }
	button:disabled { cursor: not-allowed; opacity: .55; }
	button:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	@media (min-width: 1180px) {
		.lab { position: relative; left: 50%; width: min(92rem, calc(100vw - 2rem)); padding: clamp(1.25rem, 2vw, 2rem); transform: translateX(-50%); }
		.setup { grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); align-items: start; }
		.workspace { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); align-items: start; }
	}
	@media (max-width: 600px) {
		.lab { border-radius: 1.15rem; }
		.panel { padding: .75rem; }
	}
	@media (prefers-reduced-motion: reduce) {
		.chip { transition: none; }
	}
</style>
