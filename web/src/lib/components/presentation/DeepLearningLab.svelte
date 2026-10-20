<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import { getLocalSession } from '#lib/state/session-context.js';
	import TrainingNetworkDiagram from '#lib/components/visualizations/TrainingNetworkDiagram.svelte';
	import MlpWorkedOperations from './MlpWorkedOperations.svelte';
	import { clearDeepLearningProgress, loadDeepLearningProgress, saveDeepLearningProgress, type DeepLearningAnswers } from '#lib/state/deep-learning-progress.js';
	import { getAnswerFeedbackPhase, isNumericAnswerCorrect } from '#lib/domain/deep-learning-lab.js';
	import { MLP_LAB_CASE, MLP_LAB_REQUIRED_FIELDS, MLP_LAB_FIRST, MLP_LAB_SECOND, MLP_LAB_UPDATED, deriveMlpLabProgress } from '#lib/domain/mlp-lab.js';

	const session = getLocalSession();
	const fields = MLP_LAB_REQUIRED_FIELDS;
	type LabStage = { title: string; heading: string; explanation?: string; guide?: { goal: string; why: string; calculation: string[]; math: string[] } };
	const stages: LabStage[] = [
		{ title: '1 · Capa oculta', heading: 'Calcula h₁; observa cómo se completa h₂', explanation: 'Resuelve z₁ y aplica ReLU. Al comprobar ambas respuestas, verás el mismo cálculo para h₂ con sus propios pesos.' },
		{ title: '2 · Salida y pérdida', heading: 'Llega a la predicción', explanation: 'La salida es lineal: ŷ = v₁a₁ + v₂a₂ + bₒ. Compara ŷ con y usando L = ½(ŷ − y)².' },
		{ title: '3 · Retroceso de salida', heading: '¿Qué debemos corregir en la salida?', guide: {
			goal: 'Calcular la señal de salida y el factor para v₁; después ver la misma regla aplicada a v₂ y al sesgo.',
			why: `La red predijo ${MLP_LAB_FIRST.prediction}, pero queríamos ${MLP_LAB_CASE.target}. Necesitamos una señal que indique cómo cambiar la salida para acercarla al objetivo.`,
			calculation: [
				`Compara ${MLP_LAB_FIRST.prediction} − ${MLP_LAB_CASE.target} = __. Ese resultado será la señal de salida.`,
				`Calcula solo el factor de v₁: multiplica la señal por a₁ = ${MLP_LAB_FIRST.hidden[0].activation}.`,
				'Cuando lo compruebes, verás cómo la misma regla completa v₂ y el sesgo.'
			],
			math: ['señal de salida = ŷ − y', 'factor(v₁) = señal de salida × a₁', 'factor(v₂) = señal de salida × a₂', 'factor(bₒ) = señal de salida × 1']
		} },
		{ title: '4 · Retroceso de la capa oculta', heading: 'Sigue la señal hacia las neuronas ocultas', guide: {
			goal: 'Seguir la señal por h₁ y calcular el factor de w₁₁; después comparar con la rama h₂ resuelta.',
			why: 'Un peso de entrada influye en la salida a través de varias conexiones. Seguimos ese camino al revés y multiplicamos la influencia de cada tramo. Esta es la idea de la regla de la cadena; en cálculo se formaliza con derivadas, pero aquí usaremos solo esta receta.',
			calculation: [
				`Para h₁ multiplica la señal de salida por el peso ORIGINAL v₁ = ${MLP_LAB_CASE.network.output.weights[0]}.`,
				`ReLU actúa como una puerta: aquí deja pasar la señal (factor 1) porque z₁ = ${MLP_LAB_FIRST.hidden[0].z} y z₂ = ${MLP_LAB_FIRST.hidden[1].z} son positivos. Así obtienes las señales de h₁ y h₂.`,
				`Calcula el factor de w₁₁ multiplicando la señal de h₁ por x₁ = ${MLP_LAB_CASE.inputs[0]}. La otra rama se resolverá con la misma receta.`
			],
			math: ['señal(hᵢ) = señal de salida × vᵢ × puerta ReLU', 'factor(wᵢⱼ) = señal(hᵢ) × xⱼ', 'factor(bᵢ) = señal(hᵢ) × 1']
		} },
		{ title: '5 · Descenso del gradiente', heading: 'Da un paso para mejorar la predicción', guide: {
			goal: 'Actualizar los nueve pesos y sesgos de la red.',
			why: 'Los factores que calculaste no son pesos nuevos: indican la corrección de cada parámetro. En cálculo formal se llaman gradientes. Ahora damos un paso pequeño en sentido contrario a cada factor.',
			calculation: [
				`Toma el valor ORIGINAL de un parámetro: empieza con w₁₁ = ${MLP_LAB_CASE.network.hidden[0].weights[0]}.`,
				`Multiplica su factor de ajuste por η = ${MLP_LAB_CASE.learningRate} y resta el resultado al valor original. Repite con v₁ = ${MLP_LAB_CASE.network.output.weights[0]}.`,
				'Tras comprobar ambos, verás las sustituciones numéricas de los otros siete valores actualizados.'
			],
			math: ['parámetro nuevo = parámetro original − η × factor de ajuste']
		} },
		{ title: '6 · Segunda pasada', heading: '¿Sirvió la actualización para esta muestra?', guide: {
			goal: 'Calcular otra predicción y comprobar si bajó la pérdida.',
			why: `Una actualización solo se evalúa haciendo otra pasada hacia adelante. La pérdida inicial fue ${MLP_LAB_FIRST.loss}; compara ese valor con el nuevo. Una sola muestra no demuestra que la red generalice.`,
			calculation: [
				'Usa los parámetros nuevos para calcular z₁. La segunda rama aparece resuelta más abajo; no reutilices pesos originales.',
				'Aplica ReLU a z₁ y combina las dos activaciones nuevas para obtener una nueva ŷ.',
				`Calcula la nueva pérdida con el mismo objetivo y = ${MLP_LAB_CASE.target} y compárala con la pérdida inicial.`
			],
			math: ['zᵢ nuevo = wᵢ₁ nuevo·x₁ + wᵢ₂ nuevo·x₂ + bᵢ nuevo', 'ŷ nueva = v₁ nuevo·ReLU(z₁ nuevo) + v₂ nuevo·ReLU(z₂ nuevo) + bₒ nuevo', 'L nueva = ½(ŷ nueva − y)²']
		} }
	];
	let answers = $state<DeepLearningAnswers>({});
	let checkedAnswers = $state<DeepLearningAnswers>({});
	let attempts = $state<Record<string, number>>({});
	let solutionRevealed = $state<Record<string, boolean>>({});
	let revealedStage = $state(0);
	let hydrated = $state(false);
	let manualWalk = $state(false);
	let manualStep = $state(0);
	let resetNotice = $state('');
	const progress = $derived(deriveMlpLabProgress(checkedAnswers));
	const visibleStage = $derived(manualWalk ? Math.min(manualStep, progress.completedStages) : progress.completedStages);
	const workedStage = $derived(manualWalk ? visibleStage : Math.min(revealedStage + 1, progress.completedStages));
	const correctCount = $derived(fields.filter((field) => isNumericAnswerCorrect(checkedAnswers[field.key] ?? '', field.expected)).length);
	const completed = $derived(progress.completedStages === stages.length);
	const stageFields = $derived(fields.filter((field) => field.stage === revealedStage));
	const stageComplete = $derived(stageFields.length > 0 && stageFields.every((field) => isNumericAnswerCorrect(checkedAnswers[field.key] ?? '', field.expected)));
	function format(value: number) { return Number(value.toFixed(5)).toString(); }
	function isCorrect(key: string) { const field = fields.find((item) => item.key === key); return !!field && isNumericAnswerCorrect(checkedAnswers[key] ?? '', field.expected); }
	function feedback(key: string) {
		const field = fields.find((item) => item.key === key);
		if (!field) return '';
		const phase = getAnswerFeedbackPhase(answers[key] ?? '', field.expected, checkedAnswers[key] ?? '', attempts[key] ?? 0, solutionRevealed[key] ?? false);
		if (phase === 'correct') return 'Correcto. Puedes continuar cuando estés listo.';
		if (phase === 'solution') return `La solución es ${format(field.expected)}. Revisa la operación y vuelve a intentarlo.`;
		if (phase === 'hint' || phase === 'offer-solution') return `Todavía no. Pista: ${field.hint}`;
		return '';
	}
	function checkAnswer(key: string) {
		const field = fields.find((item) => item.key === key);
		const answer = answers[key] ?? '';
		if (!field || !answer.trim()) return;
		checkedAnswers[key] = answer;
		if (!isNumericAnswerCorrect(answer, field.expected)) attempts[key] = (attempts[key] ?? 0) + 1;
	}
	function updateAnswer(key: string, value: string) {
		manualWalk = false;
		resetNotice = '';
		answers[key] = value;
		delete checkedAnswers[key];
		if (hydrated) saveDeepLearningProgress(session.getSnapshot().registration?.studentId ?? null, { answers: { ...answers }, completed: deriveMlpLabProgress(answers).completedStages === stages.length });
	}
	function goToStage(index: number) {
		manualWalk = false;
		revealedStage = Math.max(0, Math.min(stages.length - 1, index));
	}
	let confirmingReset = $state(false);
	function resetLaboratory() {
			const cleared = clearDeepLearningProgress(session.getSnapshot().registration?.studentId ?? null);
		answers = {}; checkedAnswers = {}; attempts = {}; solutionRevealed = {}; revealedStage = 0; manualWalk = false; manualStep = 0;
		resetNotice = cleared ? 'El laboratorio volvió al inicio.' : 'El laboratorio volvió al inicio, pero el navegador no permitió borrar el avance guardado.';
	}
	onMount(() => {
		session.hydrate();
		const saved = loadDeepLearningProgress(session.getSnapshot().registration?.studentId ?? null);
		answers = saved.answers;
		checkedAnswers = Object.fromEntries(fields.filter((field) => isNumericAnswerCorrect(saved.answers[field.key] ?? '', field.expected)).map((field) => [field.key, saved.answers[field.key]]));
		revealedStage = Math.min(stages.length - 1, fields.find((field) => !isNumericAnswerCorrect(saved.answers[field.key] ?? '', field.expected))?.stage ?? stages.length - 1);
		hydrated = true;
	});
</script>

{#snippet answerInput(field: (typeof fields)[number])}
	<details class="hint"><summary>Ver pista</summary><p>{field.hint}</p></details>
	<label class="answer">{field.label}<input type="text" inputmode="decimal" autocomplete="off" value={answers[field.key] ?? ''} oninput={(event) => updateAnswer(field.key, event.currentTarget.value)} onblur={() => checkAnswer(field.key)} aria-describedby={`${field.key}-feedback`} /></label>
	<p class:success={isCorrect(field.key)} class="feedback" id={`${field.key}-feedback`} aria-live="polite">{feedback(field.key)}</p>
	{#if getAnswerFeedbackPhase(answers[field.key] ?? '', field.expected, checkedAnswers[field.key] ?? '', attempts[field.key] ?? 0, solutionRevealed[field.key] ?? false) === 'offer-solution'}
		<button class="reveal-solution" type="button" onclick={() => solutionRevealed[field.key] = true}>Ver solución después de intentarlo</button>
	{/if}
{/snippet}

<section class="lab story-card" aria-labelledby="lab-title">
	<p class="eyebrow">Laboratorio guiado · a tu ritmo</p>
	<h2 id="lab-title">Entrena a mano una red 2 → 2 → 1</h2>
	<p>Trabajaremos con una muestra para entender una actualización, no para demostrar que el modelo generaliza. Tú resolverás una rama representativa; la otra se completará con la misma regla y la red seguirá mostrando ambas.</p>
	<p class="version-note">Si comenzaste el laboratorio anterior, esta versión inicia un avance nuevo. Sus respuestas guardadas no se borran.</p>
	<p class="glossary-link">¿Necesitas un símbolo? <a href="#simbolos">Consulta la guía de símbolos</a>. Puedes usar punto o coma decimal; para la pérdida final escribe hasta cinco decimales.</p>
	<div class="progress-head"><span>Tu avance</span><strong>{correctCount} de {fields.length} respuestas · {Math.round(correctCount / fields.length * 100)}%</strong></div>
	<progress max={fields.length} value={correctCount} aria-label={`Progreso del laboratorio: ${correctCount} de ${fields.length} respuestas correctas`}></progress>
	<div class="reset-row"><button class="reset-button" type="button" onclick={() => (confirmingReset = true)} disabled={!hydrated}>Reiniciar laboratorio</button>{#if resetNotice}<p role="status">{resetNotice}</p>{/if}</div>
	<ConfirmDialog bind:open={confirmingReset} title="¿Reiniciar el laboratorio?" message="Se borrarán las respuestas de este laboratorio. Tu inscripción y los demás laboratorios no cambian." confirmLabel="Sí, reiniciar" cancelLabel="No, conservar mis respuestas" onConfirm={resetLaboratory} />

	<div class="lab-workspace">
	<div class="training-visual" aria-labelledby="training-visual-title">
		<p class="stage-label">Un solo ejemplo para todos los pasos</p>
		<h3 id="training-visual-title">Los números del diagrama son los de tu ejercicio</h3>
		<p>Entrada x = [{MLP_LAB_CASE.inputs.join(', ')}], respuesta deseada y = {MLP_LAB_CASE.target}, tasa η = {MLP_LAB_CASE.learningRate}. La capa oculta usa ReLU; la salida es lineal.</p>
		<TrainingNetworkDiagram {progress} step={visibleStage} manual={manualWalk} />
		<MlpWorkedOperations stage={workedStage} />
		{#if progress.completedStages > 0}<div class="visual-controls" role="group" aria-label="Controles para presentar los pasos validados">
			{#if manualWalk}
				<button type="button" onclick={() => manualStep = Math.min(progress.completedStages, manualStep + 1)} disabled={visibleStage >= progress.completedStages}>Siguiente paso validado</button>
				<button class="secondary" type="button" onclick={() => manualStep = 0}>Repetir desde el inicio</button>
				<button class="secondary" type="button" onclick={() => manualWalk = false}>Seguir respuestas</button>
			{:else}<button type="button" onclick={() => { manualWalk = true; manualStep = 0; }}>Recorrer pasos validados</button>{/if}
		</div>{/if}
	</div>

	<div class="exercise-panel" aria-label="Cálculos del laboratorio">
		<nav class="stage-navigation" aria-label="Pasos del laboratorio">
			{#each stages as stage, index}
				<button type="button" class:current={revealedStage === index} aria-current={revealedStage === index ? 'step' : undefined} disabled={index > progress.completedStages} onclick={() => goToStage(index)} aria-label={`Ir al paso ${index + 1}: ${stage.heading}`}>{index + 1}</button>
			{/each}
		</nav>
		<div class="carousel-status" aria-live="polite">Paso {revealedStage + 1} de {stages.length} · {stages[revealedStage].title}</div>
		{#key revealedStage}
			{@const stage = stages[revealedStage]}
			<div class="lab-stage" aria-labelledby={`stage-${revealedStage}`}>
				<p class="stage-label">{stage.title}</p><h3 id={`stage-${revealedStage}`}>{stage.heading}</h3>
				{#if stage.guide}
					<div class="stage-guide">
						<p><strong>Objetivo.</strong> {stage.guide.goal}</p>
						<p><strong>¿Por qué?</strong> {stage.guide.why}</p>
						<div><strong>¿Cómo lo calculamos?</strong><ol class="stage-calculation">{#each stage.guide.calculation as instruction}<li>{instruction}</li>{/each}</ol></div>
						<div class="stage-math"><strong>La receta en símbolos</strong>{#each stage.guide.math as formula}<p>{formula}</p>{/each}</div>
					</div>
				{:else}<p>{stage.explanation}</p>{/if}
				{#if revealedStage === 0}<div class="matrix" aria-label="Parámetros iniciales"><span>x = [{MLP_LAB_CASE.inputs.join(', ')}]</span><span>h₁: w = [{MLP_LAB_CASE.network.hidden[0].weights.join(', ')}], b = {MLP_LAB_CASE.network.hidden[0].bias}</span><span>h₂: w = [{MLP_LAB_CASE.network.hidden[1].weights.join(', ')}], b = {MLP_LAB_CASE.network.hidden[1].bias}</span></div>{/if}
				{#if revealedStage === 1}<div class="matrix"><span>salida: v = [{MLP_LAB_CASE.network.output.weights.join(', ')}], bₒ = {MLP_LAB_CASE.network.output.bias}</span><span>y = {MLP_LAB_CASE.target}</span></div>{/if}
				{#if revealedStage === 4}<p><strong>Primero intenta a mano.</strong> Tras comprobar los dos pesos, aparecerán las operaciones de los otros siete parámetros nuevos.</p>{/if}
				{#if revealedStage === 5}<div class="guided-example"><strong>Rama h₂ resuelta para esta pasada.</strong> z₂ = ({format(MLP_LAB_UPDATED.hidden[1].weights[0])} × {MLP_LAB_CASE.inputs[0]}) + ({format(MLP_LAB_UPDATED.hidden[1].weights[1])} × {MLP_LAB_CASE.inputs[1]}) + {format(MLP_LAB_UPDATED.hidden[1].bias)} = {format(MLP_LAB_SECOND.hidden[1].z)}; a₂ = ReLU(z₂) = {format(MLP_LAB_SECOND.hidden[1].activation)}.</div>{/if}
				{#each fields.filter((field) => field.stage === revealedStage) as field (field.key)}{@render answerInput(field)}{/each}
			</div>
		{/key}
	{#if completed}<div class="completion" role="status"><strong>¡Laboratorio completado!</strong><p>Para esta muestra, una actualización redujo la pérdida de {format(MLP_LAB_FIRST.loss)} a {format(MLP_LAB_SECOND.loss)}. Esto todavía no demuestra generalización. El avance se guarda en este navegador.</p></div>
	{/if}
	<div class="carousel-controls" role="group" aria-label="Navegación del laboratorio">
		<button class="previous" type="button" onclick={() => goToStage(revealedStage - 1)} disabled={revealedStage === 0}>← Paso anterior</button>
		<button class="continue" type="button" onclick={() => { if (stageComplete) goToStage(revealedStage + 1); }} disabled={revealedStage === stages.length - 1 || !stageComplete}>Siguiente paso →</button>
	</div>
	{#if !completed}<p class="save-note">Tu avance se guarda en este navegador. Esta versión usa un registro distinto; no borra respuestas del laboratorio anterior.</p>{/if}
	<p class="save-note">La secuencia de cálculo está inspirada en <a href="https://www.youtube.com/watch?v=IN2XmBhILt4" target="_blank" rel="noopener noreferrer">StatQuest: Backpropagation Main Ideas</a>. Los números de este ejercicio son propios.</p>
	</div>
	</div>
</section>
<style>
	.lab {
		margin: 0 0 1.5rem;
		padding: clamp(1.25rem, 3.4vw, 3rem);
		border: 1px solid var(--color-line, #dbe4ee);
		border-radius: var(--radius-panel, 1.5rem);
		background: var(--color-surface, #fff);
		box-shadow: var(--shadow-panel, 0 12px 32px rgb(23 37 58 / 8%));
		scroll-margin-top: 5.75rem;
	}
	.lab .eyebrow { margin: 0 0 .8rem; color: var(--color-accent, #0f766e); font-size: .82rem; font-weight: 800; }
	.lab h2 { margin: 0 0 1rem; color: var(--color-ink, #17253a); font-size: clamp(1.7rem, 3.5vw, 2.75rem); line-height: 1.12; letter-spacing: -.03em; }
	.lab > p:not(.eyebrow) { color: var(--color-muted, #52627a); line-height: 1.65; }
	.glossary-link a { color: #1d4ed8; font-weight: 750; text-underline-offset: .15em; }
	.reset-row { display:flex; flex-wrap:wrap; align-items:center; gap:.6rem .9rem; margin:.85rem 0; }
	.reset-row p { margin:0; color:#52627a; font-size:.9rem; }
	.reset-button { min-height:2.55rem; padding:.5rem .8rem; border:1px solid #b91c1c; border-radius:.65rem; background:#fff; color:#991b1b; font:inherit; font-weight:750; cursor:pointer; }
	.reset-button:hover { background:#fef2f2; }
	.reset-button:focus-visible { outline:3px solid #fecaca; outline-offset:2px; }
	.reset-button:disabled { cursor:not-allowed; opacity:.55; }
	.progress-head { display:flex; justify-content:space-between; gap:1rem; margin:1.4rem 0 .4rem; color:#334155; }
	progress { display:block; width:100%; height:.8rem; margin-bottom:1.4rem; accent-color:#0f766e; }
	.lab-workspace { min-width:0; }
	.training-visual { margin:1.5rem 0 1.75rem; padding:1rem; border:1px solid #dbe4ee; border-radius:1rem; background:linear-gradient(145deg,#f8fbff,#fff); }
	.exercise-panel { min-width:0; }
	.training-visual h3 { margin-bottom:.6rem; color:var(--color-ink,#17253a); font-size:clamp(1.25rem,2.5vw,1.8rem); }
	.visual-controls { display:flex; flex-wrap:wrap; gap:.55rem; margin-top:.8rem; }
	.visual-controls button { min-height:2.65rem; padding:.55rem .85rem; border:1px solid #1d4ed8; border-radius:999px; background:#1d4ed8; color:#fff; font:inherit; font-weight:800; cursor:pointer; }
	.visual-controls button.secondary { border-color:#cbd5e1; background:#fff; color:#24364b; }
	.visual-controls button:disabled { cursor:not-allowed; opacity:.55; }
	.stage-navigation { display:flex; gap:.5rem; margin:0 0 .75rem; }
	.stage-navigation button { display:grid; place-items:center; width:2.65rem; height:2.65rem; flex:none; border:1px solid #94a3b8; border-radius:50%; background:#fff; color:#334155; font:inherit; font-weight:800; cursor:pointer; }
	.stage-navigation button.current { border-color:#1d4ed8; background:#1d4ed8; color:#fff; }
	.stage-navigation button:disabled { cursor:not-allowed; opacity:.4; }
	.stage-navigation button:focus-visible, .carousel-controls button:focus-visible { outline:3px solid #99f6e4; outline-offset:2px; }
	.carousel-status { color:#52627a; font-size:.85rem; font-weight:750; }
	.lab-stage { margin-top:.6rem; border-top:1px solid #dbe4ee; padding:1.1rem 0 .5rem; animation:stage-enter .22s ease-out both; }
	@keyframes stage-enter { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }
	.stage-label { margin-bottom:.35rem; color:#0f766e; font-size:.78rem; font-weight:800; }
	.lab-stage h3 { margin-bottom:.65rem; }
	.lab-stage > p:not(.stage-label) { max-width:75ch; }
	.stage-guide { display:grid; gap:.65rem; margin:.85rem 0 1.1rem; }
	.stage-guide > p { margin:0; line-height:1.55; }
	.stage-guide strong { color:#115e59; }
	.stage-calculation { display:grid; gap:.4rem; margin:.5rem 0 0; padding-left:1.35rem; line-height:1.5; }
	.stage-calculation li { padding-left:.1rem; }
	.stage-math { min-width:0; padding:.75rem .85rem; border-left:3px solid #0f766e; border-radius:0 .65rem .65rem 0; background:#f0fdfa; }
	.stage-math p { margin:.4rem 0 0; color:#17324a; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.9rem; font-weight:650; line-height:1.5; overflow-wrap:anywhere; }
	.matrix { display:flex; flex-wrap:wrap; gap:.6rem; margin:.8rem 0 1rem; }
	.matrix span { padding:.55rem .75rem; border-radius:.65rem; background:#f1f5f9; color:#24364b; font-family:ui-monospace, monospace; }
	.guided-example { margin:.8rem 0; padding:.75rem .85rem; border-left:3px solid #0f766e; border-radius:0 .6rem .6rem 0; background:#f0fdfa; color:#134e4a; line-height:1.5; }
	.answer { display:grid; grid-template-columns:minmax(12rem,1fr) minmax(7rem,10rem); align-items:center; gap:1rem; max-width:44rem; margin:.75rem 0 .15rem; font-weight:700; }
	.answer input { width:100%; min-height:2.65rem; padding:.5rem .7rem; border:1px solid #94a3b8; border-radius:.55rem; color:#17253a; font:inherit; }
	.answer input:focus-visible { outline:3px solid #99f6e4; outline-offset:2px; border-color:#0f766e; }
	.hint { margin:.35rem 0; color:#52627a; font-size:.9rem; }
	.hint summary { cursor:pointer; font-weight:700; }
	.hint p { margin:.35rem 0; }
	.feedback { min-height:1.3rem; margin:0 0 .25rem; color:#a13b10; font-size:.9rem; }
	.feedback.success { color:#0f766e; }
	.reveal-solution { margin:.1rem 0 .7rem; padding:.35rem .6rem; border:1px solid #b45309; border-radius:.5rem; background:#fff7ed; color:#92400e; font:inherit; font-size:.85rem; font-weight:750; cursor:pointer; }
	.reveal-solution:focus-visible { outline:3px solid #fcd34d; outline-offset:2px; }
	.carousel-controls { display:flex; flex-wrap:wrap; gap:.6rem; margin-top:1rem; }
	.carousel-controls button { min-height:2.7rem; padding:.65rem .9rem; border:1px solid #1d4ed8; border-radius:.65rem; font:inherit; font-weight:800; cursor:pointer; }
	.previous { background:#fff; color:#1d4ed8; }
	.continue { background:#1d4ed8; color:white; }
	.continue:disabled { cursor:not-allowed; opacity:.5; }
	.previous:disabled { cursor:not-allowed; opacity:.5; }
	.completion { margin-top:1.25rem; padding:1rem 1.1rem; border:1px solid #5eead4; border-radius:.8rem; background:#f0fdfa; color:#134e4a; }
	.completion p { margin:.35rem 0 0; }
	.save-note { color:#52627a; font-size:.92rem; }
	.lab .version-note { margin:.6rem 0; padding:.6rem .8rem; border-left:3px solid #0f766e; background:#f0fdfa; color:#115e59; font-size:.9rem; }
	@media (min-width:1180px) {
		.lab { position:relative; left:50%; width:min(92rem,calc(100vw - 2rem)); padding:clamp(1.25rem,2vw,2rem); transform:translateX(-50%); }
		.lab-workspace { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(22rem,1fr); align-items:start; gap:clamp(1rem,1.5vw,1.5rem); }
		.training-visual { position:sticky; top:5.5rem; max-height:calc(100dvh - 6.25rem); overflow-y:auto; overscroll-behavior:contain; margin:0; }
		.exercise-panel .lab-stage:first-child { border-top:0; padding-top:0; }
		.exercise-panel .answer { grid-template-columns:minmax(0,1fr) minmax(6.5rem,8rem); gap:.5rem; }
	}
	@media (max-width:600px) { .lab { border-radius: 1.15rem; } .training-visual { padding:.7rem; } .stage-navigation { justify-content:space-between; gap:.25rem; } .stage-navigation button { width:2.35rem; height:2.35rem; } .progress-head { align-items:flex-start; flex-direction:column; gap:.2rem; } .answer { grid-template-columns:1fr; gap:.35rem; } }
	@media (prefers-reduced-motion:reduce) { .lab-stage { animation:none; } }
</style>
