<script lang="ts">
	import { onMount } from 'svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import { getLocalSession } from '#lib/state/session-context.js';
	import ContextVectorPlot from '#lib/components/visualizations/language/ContextVectorPlot.svelte';
	import { createLabProgressStore, type LabAnswers } from '#lib/state/lab-progress.js';
	import { getAnswerFeedbackPhase, isNumericAnswerCorrect } from '#lib/domain/deep-learning-lab.js';
	import {
		ATTENTION_LAB,
		ATTENTION_LAB_REQUIRED_FIELDS,
		ATTENTION_LAB_STAGE_COUNT,
		ATTENTION_MEANINGS,
		EXP_TABLE,
		deriveAttentionLabProgress,
		type AttentionLabField
	} from '#lib/domain/language/attention-lab.js';

	const session = getLocalSession();
	const store = createLabProgressStore('attention-lab-v1');
	const fields = ATTENTION_LAB_REQUIRED_FIELDS;
	const river = ATTENTION_LAB.river;
	const money = ATTENTION_LAB.money;
	const seat = ATTENTION_MEANINGS.seat;
	const finance = ATTENTION_MEANINGS.finance;
	const fmt = (value: number) => Number(value.toFixed(3)).toString();
	const fmtWeight = (value: number) => value.toFixed(3);
	const vec = (vector: readonly number[]) => `[${vector.map(fmt).join(', ')}]`;
	const expOf = (score: number) => EXP_TABLE.find((entry) => entry.exponent === score)?.value ?? Math.exp(score);
	const [, riverToken] = river.tokens;

	type LabStage = { title: string; heading: string; guide: { goal: string; why: string; calculation: string[]; math: string[] } };
	const stages: LabStage[] = [
		{ title: '1 · Puntajes q · k', heading: '¿Qué tanto le ayuda cada palabra a “banco”?', guide: {
			goal: 'Calcular el puntaje entre la consulta de “banco” y la clave de “río”.',
			why: 'La consulta q de “banco” pregunta: “¿qué palabras me ayudan a saber qué significo?”. Cada clave k responde: “esto es lo que ofrezco”. El producto punto mide qué tan bien encajan la pregunta y la respuesta: más alto, más ayuda.',
			calculation: [
				`Toma q(banco) = ${vec(river.query)} y k(río) = ${vec(riverToken.vector)}.`,
				'Multiplica el primer número de q por el primer número de k; luego el segundo por el segundo.',
				'Suma los dos productos. Ese es el puntaje de “río”. Las otras palabras se resuelven con la misma regla.'
			],
			math: ['q · k = (q₁ × k₁) + (q₂ × k₂)', 'puntaje(palabra) = q(banco) · k(palabra)']
		} },
		{ title: '2 · Softmax', heading: 'Convierte los puntajes en porcentajes', guide: {
			goal: 'Calcular la suma de las exponenciales y el peso de atención de “río”.',
			why: 'Los puntajes no son porcentajes. Softmax los convierte en pesos positivos que suman 1. Usamos eˣ, donde e ≈ 2.718 es solo un número fijo: elevarlo a un puntaje siempre da un resultado positivo y hace que los puntajes grandes dominen.',
			calculation: [
				`Los puntajes de la frase del río son: senté = ${fmt(river.scores[0])}, río = ${fmt(river.scores[1])}, banco = ${fmt(river.scores[2])}.`,
				'Busca en la tabla eˣ de cada puntaje y suma los tres valores.',
				'Divide e³ (el valor de “río”) entre esa suma. El resultado es el peso de “río”.'
			],
			math: ['softmax(zⱼ) = e^zⱼ ÷ Σₖ e^zₖ', 'peso(palabra) = e^puntaje ÷ (suma de e^puntaje de todas las palabras)', 'peso(senté) + peso(río) + peso(banco) = 1']
		} },
		{ title: '3 · Vector de contexto', heading: 'Construye el nuevo “banco”', guide: {
			goal: 'Calcular el primer componente del nuevo vector de “banco”.',
			why: 'Ahora “banco” se reescribe como una mezcla de las palabras de su frase. Cada palabra aporta su vector v según su peso. Como “río” tiene el peso más grande, el nuevo “banco” lleva consigo información de “río”.',
			calculation: [
				`Usa los pesos confirmados: senté = ${fmtWeight(river.weights[0])}, río = ${fmtWeight(river.weights[1])}, banco = ${fmtWeight(river.weights[2])}.`,
				`Multiplica cada peso por el primer número de su vector v: v(senté) = ${vec(river.tokens[0].vector)}, v(río) = ${vec(river.tokens[1].vector)}, v(banco) = ${vec(river.tokens[2].vector)}.`,
				'Suma los tres productos. El segundo componente aparecerá con la misma regla.'
			],
			math: ['banco nuevo = Σ peso(palabra) × v(palabra)', 'componente₁ = (peso₁ × v₁,₁) + (peso₂ × v₂,₁) + (peso₃ × v₃,₁)']
		} },
		{ title: '4 · ¿Qué significa “banco” aquí?', heading: 'Compara el nuevo “banco” con dos significados', guide: {
			goal: `Calcular qué tanto se parece el nuevo “banco” a “${seat.label}” ${vec(seat.vector)}.`,
			why: `Usamos otra vez el producto punto, ahora para comparar: entre más alto, más se parece. Después lo compararemos con “${finance.label}” ${vec(finance.vector)}.`,
			calculation: [
				`Toma el nuevo “banco” de la frase del río: ${vec(river.context)}.`,
				`Multiplica el primer componente por ${seat.vector[0]} y el segundo por ${seat.vector[1]}.`,
				`Suma los productos. Al comprobarlo verás también el parecido con “${finance.label}” y el resultado de la otra frase.`
			],
			math: [`parecido(${seat.label}) = banco nuevo · ${vec(seat.vector)}`, `parecido(${finance.label}) = banco nuevo · ${vec(finance.vector)}`]
		} }
	];

	type SentenceCase = typeof river;
	type Operation = { title: string; origin: 'manual' | 'guided'; lines: string[] };
	function scoreLines(data: SentenceCase) {
		return data.tokens.map((token) => `q·k(${token.word}) = (${data.query[0]} × ${token.vector[0]}) + (${data.query[1]} × ${token.vector[1]}) = ${fmt(data.scores[data.tokens.indexOf(token)])}`);
	}
	function softmaxLines(data: SentenceCase) {
		const exps = data.scores.map(expOf);
		const sum = exps.reduce((total, value) => total + value, 0);
		return [
			`suma = ${data.scores.map((score) => `e${superscript(score)}`).join(' + ')} = ${exps.map(fmt).join(' + ')} = ${fmt(sum)}`,
			...data.tokens.map((token, index) => `peso(${token.word}) = ${fmt(exps[index])} ÷ ${fmt(sum)} = ${fmtWeight(data.weights[index])}`)
		];
	}
	function contextLines(data: SentenceCase) {
		return [0, 1].map((component) => `banco nuevo${component === 0 ? '₁' : '₂'} = ${data.tokens.map((token, index) => `(${fmtWeight(data.weights[index])} × ${token.vector[component]})`).join(' + ')} = ${fmt(data.context[component])}`)
			.concat(`banco nuevo = ${vec(data.context)}`);
	}
	function meaningLines(data: SentenceCase) {
		const verdict = data.meaning === 'seat' ? seat.label : finance.label;
		return [
			`parecido(${seat.label}) = (${fmt(data.context[0])} × ${seat.vector[0]}) + (${fmt(data.context[1])} × ${seat.vector[1]}) = ${fmt(data.meaningScores.seat)}`,
			`parecido(${finance.label}) = (${fmt(data.context[0])} × ${finance.vector[0]}) + (${fmt(data.context[1])} × ${finance.vector[1]}) = ${fmt(data.meaningScores.finance)}`,
			`Veredicto: aquí “banco” significa ${verdict}.`
		];
	}
	function superscript(value: number) {
		const digits = '⁰¹²³⁴⁵⁶⁷⁸⁹';
		return String(value).split('').map((digit) => digits[Number(digit)] ?? digit).join('');
	}
	const builders = [scoreLines, softmaxLines, contextLines, meaningLines];
	const operations: Operation[][] = builders.map((build) => [
		{ title: `“${river.text}”`, origin: 'manual', lines: build(river) },
		{ title: `“${money.text}”`, origin: 'guided', lines: build(money) }
	]);

	let answers = $state<LabAnswers>({});
	let checkedAnswers = $state<LabAnswers>({});
	let attempts = $state<Record<string, number>>({});
	let solutionRevealed = $state<Record<string, boolean>>({});
	let revealedStage = $state(0);
	let hydrated = $state(false);
	let resetNotice = $state('');
	const progress = $derived(deriveAttentionLabProgress(checkedAnswers));
	const correctCount = $derived(fields.filter((field) => isNumericAnswerCorrect(checkedAnswers[field.key] ?? '', field.expected, field.tolerance)).length);
	const completed = $derived(progress.completedStages === ATTENTION_LAB_STAGE_COUNT);
	const stageFields = $derived(fields.filter((field) => field.stage === revealedStage));
	const stageComplete = $derived(stageFields.length > 0 && stageFields.every((field) => isNumericAnswerCorrect(checkedAnswers[field.key] ?? '', field.expected, field.tolerance)));
	const workedStage = $derived(Math.min(revealedStage + 1, progress.completedStages));

	function studentId() { return session.getSnapshot().registration?.studentId ?? null; }
	function isCorrect(field: AttentionLabField) { return isNumericAnswerCorrect(checkedAnswers[field.key] ?? '', field.expected, field.tolerance); }
	function phase(field: AttentionLabField) {
		return getAnswerFeedbackPhase(answers[field.key] ?? '', field.expected, checkedAnswers[field.key] ?? '', attempts[field.key] ?? 0, solutionRevealed[field.key] ?? false, field.tolerance);
	}
	function feedback(field: AttentionLabField) {
		const current = phase(field);
		if (current === 'correct') return 'Correcto. Puedes continuar cuando estés listo.';
		if (current === 'solution') return `La solución es ${fmt(field.expected)}. Revisa la operación y vuelve a intentarlo.`;
		if (current === 'hint' || current === 'offer-solution') return `Todavía no. Pista: ${field.hint}`;
		return '';
	}
	function checkAnswer(field: AttentionLabField) {
		const answer = answers[field.key] ?? '';
		if (!answer.trim()) return;
		checkedAnswers[field.key] = answer;
		if (!isNumericAnswerCorrect(answer, field.expected, field.tolerance)) attempts[field.key] = (attempts[field.key] ?? 0) + 1;
	}
	function updateAnswer(key: string, value: string) {
		resetNotice = '';
		answers[key] = value;
		delete checkedAnswers[key];
		if (hydrated) store.save(studentId(), { answers: { ...answers }, completed: deriveAttentionLabProgress(answers).completedStages === ATTENTION_LAB_STAGE_COUNT });
	}
	function goToStage(index: number) {
		revealedStage = Math.max(0, Math.min(stages.length - 1, index));
	}
	let confirmingReset = $state(false);
	function resetLaboratory() {
			const cleared = store.clear(studentId());
		answers = {}; checkedAnswers = {}; attempts = {}; solutionRevealed = {}; revealedStage = 0;
		resetNotice = cleared ? 'El laboratorio volvió al inicio.' : 'El laboratorio volvió al inicio, pero el navegador no permitió borrar el avance guardado.';
	}
	onMount(() => {
		session.hydrate();
		const saved = store.load(studentId());
		answers = saved.answers;
		checkedAnswers = Object.fromEntries(fields.filter((field) => isNumericAnswerCorrect(saved.answers[field.key] ?? '', field.expected, field.tolerance)).map((field) => [field.key, saved.answers[field.key]]));
		revealedStage = Math.min(stages.length - 1, fields.find((field) => !isNumericAnswerCorrect(saved.answers[field.key] ?? '', field.expected, field.tolerance))?.stage ?? stages.length - 1);
		hydrated = true;
	});
</script>

{#snippet answerInput(field: AttentionLabField)}
	<details class="hint"><summary>Ver pista</summary><p>{field.hint}</p></details>
	<label class="answer">{field.label}<input type="text" inputmode="decimal" autocomplete="off" value={answers[field.key] ?? ''} oninput={(event) => updateAnswer(field.key, event.currentTarget.value)} onblur={() => checkAnswer(field)} onkeydown={(event) => { if (event.key === 'Enter') checkAnswer(field); }} aria-describedby={`${field.key}-feedback`} /></label>
	<p class:success={isCorrect(field)} class="feedback" id={`${field.key}-feedback`} aria-live="polite">{feedback(field)}</p>
	{#if phase(field) === 'offer-solution'}
		<button class="reveal-solution" type="button" onclick={() => solutionRevealed[field.key] = true}>Ver solución después de intentarlo</button>
	{/if}
{/snippet}

<section class="lab story-card" aria-labelledby="attention-lab-title">
	<p class="eyebrow">08 · Laboratorio</p>
	<h2 id="attention-lab-title">Calcula la atención a mano</h2>
	<p>Vamos a seguir con números cómo la palabra “banco” decide a qué vecinas prestar atención. Tú calcularás una frase representativa, “{river.text}”; la otra frase, “{money.text}”, se completará con la misma regla para que compares los resultados.</p>
	<p class="glossary-link">Cada palabra es un vector de dos números: el primero indica “naturaleza / aire libre” y el segundo indica “dinero”. Para que la cuenta se pueda hacer a mano, aquí las tres matrices W<sub>Q</sub>, W<sub>K</sub> y W<sub>V</sub> son la identidad: q, k y v de cada palabra son su mismo vector. En la figura 3.11 viste matrices distintas; el procedimiento es el mismo. Puedes usar punto o coma decimal.</p>
	<div class="lab-formula" aria-labelledby="lab-formula-title">
		<p id="lab-formula-title" class="formula-title">La ecuación que vas a calcular</p>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the equation on narrow screens.) -->
		<div class="formula-line" role="region" tabindex="0" aria-label="Fórmula completa de la atención y su versión para un solo token">
			<p>Atención(Q, K, V) = <span class:active={revealedStage === 1}>softmax(</span><span class:active={revealedStage === 0}>Q·Kᵀ</span><span class="muted"> ⁄ √dₖ</span><span class:active={revealedStage === 1}>)</span> <span class:active={revealedStage === 2}>· V</span></p>
			<p class="single">nuevo banco = <span class:active={revealedStage === 2}>Σⱼ</span> <span class:active={revealedStage === 1}>softmax(</span><span class:active={revealedStage === 0}>q<sub>banco</sub> · kⱼ</span><span class:active={revealedStage === 1}>)</span> <span class:active={revealedStage === 2}>× vⱼ</span></p>
			<p class="single">donde <span class:active={revealedStage === 1}>softmax(zⱼ) = e<sup>zⱼ</sup> ÷ Σₖ e<sup>zₖ</sup></span>, con zⱼ = q<sub>banco</sub> · kⱼ</p>
		</div>
		<p class="formula-note">La primera línea calcula todos los tokens a la vez con matrices; la segunda es la misma cuenta para un solo token, «banco», que es la que harás a mano; la tercera muestra qué hace softmax. El fondo marca la parte del paso actual{revealedStage === 3 ? '; el paso 4 ya no es parte de la atención: usa su resultado' : ''}. Aquí dₖ = 2, pero omitimos dividir entre √2 para conservar números sencillos.</p>
	</div>
	<div class="progress-head"><span>Tu avance</span><strong>{correctCount} de {fields.length} respuestas · {Math.round(correctCount / fields.length * 100)}%</strong></div>
	<progress max={fields.length} value={correctCount} aria-label={`Progreso del laboratorio: ${correctCount} de ${fields.length} respuestas correctas`}></progress>
	<div class="reset-row"><button class="reset-button" type="button" onclick={() => (confirmingReset = true)} disabled={!hydrated}>Reiniciar laboratorio</button>{#if resetNotice}<p role="status">{resetNotice}</p>{/if}</div>
	<ConfirmDialog bind:open={confirmingReset} title="¿Reiniciar el laboratorio?" message="Se borrarán solo tus respuestas del laboratorio de atención. Tu inscripción y los demás laboratorios no cambian." confirmLabel="Sí, reiniciar" cancelLabel="No, conservar mis respuestas" onConfirm={resetLaboratory} />

	<div class="lab-workspace">
		<div class="training-visual" aria-labelledby="attention-visual-title">
			<p class="stage-label">Un mismo plano para todos los pasos</p>
			<h3 id="attention-visual-title">Dónde queda “banco” según sus vecinas</h3>
			<p>Verde: frase del río. Azul: frase del dinero. El punto gris es “banco” antes de mirar su contexto, en {vec(river.query)}.</p>
			<ContextVectorPlot {progress} />

			<div class="worked" aria-label="Operaciones confirmadas por tus respuestas">
				<div class="worked-heading"><strong>Operaciones confirmadas</strong><span>{workedStage === 0 ? 'Sin respuestas todavía' : `Paso ${workedStage} de ${stages.length}`}</span></div>
				{#if workedStage === 0}
					<p class="empty">Calcula el primer puntaje. Cuando lo compruebes, verás las operaciones de las dos frases con números.</p>
				{:else}
					<ol aria-live="polite">
						{#each operations[workedStage - 1] as operation}
							<li class:guided={operation.origin === 'guided'}>
								<div class="operation-heading"><strong>{operation.title}</strong><span>{operation.origin === 'manual' ? 'Tu cálculo' : 'Misma regla, otra frase'}</span></div>
								{#each operation.lines as line}<p>{line}</p>{/each}
							</li>
						{/each}
					</ol>
				{/if}
			</div>
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
				<div class="lab-stage" aria-labelledby={`attention-stage-${revealedStage}`}>
					<p class="stage-label">{stage.title}</p><h3 id={`attention-stage-${revealedStage}`}>{stage.heading}</h3>
					<div class="stage-guide">
						<p><strong>Objetivo.</strong> {stage.guide.goal}</p>
						<p><strong>¿Por qué?</strong> {stage.guide.why}</p>
						<div><strong>¿Cómo lo calculamos?</strong><ol class="stage-calculation">{#each stage.guide.calculation as instruction}<li>{instruction}</li>{/each}</ol></div>
						<div class="stage-math"><strong>La receta en símbolos</strong>{#each stage.guide.math as formula}<p>{formula}</p>{/each}</div>
					</div>
					{#if revealedStage === 0}
						<div class="matrix" aria-label="Vectores de la frase del río"><span>q(banco) = {vec(river.query)}</span>{#each river.tokens as token}<span>k({token.word}) = {vec(token.vector)}</span>{/each}</div>
					{/if}
					{#if revealedStage === 1}
						<table class="exp-table">
							<caption>Tabla de eˣ (valores redondeados)</caption>
							<thead><tr><th scope="col">x</th><th scope="col">eˣ</th></tr></thead>
							<tbody>{#each EXP_TABLE as entry}<tr><td>{entry.exponent}</td><td>e{superscript(entry.exponent)} ≈ {entry.value}</td></tr>{/each}</tbody>
						</table>
						<p class="side-note"><strong>Nota:</strong> los modelos reales también dividen cada puntaje entre √d (la raíz del tamaño de los vectores) antes de softmax. Aquí lo omitimos para conservar números sencillos.</p>
					{/if}
					{#each stageFields as field (field.key)}{@render answerInput(field)}{/each}
				</div>
			{/key}
			{#if completed}
				<div class="completion" role="status">
					<strong>¡Laboratorio completado!</strong>
					<p>La misma palabra, “banco”, recibió dos vectores distintos según sus vecinas: {vec(river.context)} junto a “río” y {vec(money.context)} junto a “dinero”. Eso es lo que agrega la atención. Un Transformer repite este cálculo en muchas cabezas y en muchas capas.</p>
					<p>Ahora que el modelo entiende el contexto, me pregunto: ¿cómo elige la siguiente palabra?</p>
				</div>
			{/if}
			<div class="carousel-controls" role="group" aria-label="Navegación del laboratorio">
				<button class="previous" type="button" onclick={() => goToStage(revealedStage - 1)} disabled={revealedStage === 0}>← Paso anterior</button>
				<button class="continue" type="button" onclick={() => { if (stageComplete) goToStage(revealedStage + 1); }} disabled={revealedStage === stages.length - 1 || !stageComplete}>Siguiente paso →</button>
			</div>
			<p class="save-note">Tu avance se guarda en este navegador.</p>
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
	.training-visual h3 { margin-bottom:.6rem; color:var(--color-ink,#17253a); font-size:clamp(1.25rem,2.5vw,1.8rem); }
	.exercise-panel { min-width:0; }
	.worked { margin-top:.85rem; padding:1rem; border:1px solid #bfdbfe; border-radius:.8rem; background:#fff; }
	.worked-heading, .operation-heading { display:flex; align-items:baseline; justify-content:space-between; gap:.7rem; }
	.worked-heading { color:#17253a; }
	.worked-heading span, .operation-heading span { color:#52627a; font-size:.72rem; font-weight:750; white-space:nowrap; }
	.empty { margin:.65rem 0 0; color:#52627a; line-height:1.5; }
	.worked ol { display:grid; gap:.6rem; margin:.75rem 0 0; padding:0; list-style:none; }
	.worked li { min-width:0; padding:.65rem .75rem; border-left:3px solid #0f766e; border-radius:.35rem; background:#f0fdfa; }
	.worked li.guided { border-left-color:#2563eb; background:#eff6ff; }
	.operation-heading strong { color:#17324a; font-size:.9rem; }
	.worked li p { margin:.35rem 0 0; color:#24364b; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:clamp(.82rem,1.2vw,.94rem); line-height:1.45; overflow-wrap:anywhere; }
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
	.stage-guide { display:grid; gap:.65rem; margin:.85rem 0 1.1rem; }
	.stage-guide > p { margin:0; line-height:1.55; }
	.stage-guide strong { color:#115e59; }
	.stage-calculation { display:grid; gap:.4rem; margin:.5rem 0 0; padding-left:1.35rem; line-height:1.5; }
	.lab-formula { margin:1rem 0 .5rem; padding:.9rem 1rem; border:1px solid #c7d2fe; border-radius:.9rem; background:#f8faff; }
	.formula-title { margin:0 0 .45rem; color:#0f766e; font-size:.78rem; font-weight:800; }
	.formula-line { overflow-x:auto; padding:.6rem .8rem; border-radius:.7rem; background:#fff; }
	.formula-line:focus-visible { outline:3px solid #1d4ed8; outline-offset:2px; }
	.formula-line p { margin:.15rem 0; color:#17253a; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:clamp(1rem,2vw,1.3rem); font-weight:800; white-space:nowrap; }
	.formula-line p.single { color:#334155; font-size:clamp(.92rem,1.8vw,1.1rem); }
	.formula-line span { border-radius:.3rem; padding:0 .1rem; transition:background-color .3s ease; }
	.formula-line span.active { background:#fde68a; color:#78350f; }
	.formula-line span.muted { color:#94a3b8; text-decoration:line-through; }
	.lab .formula-note { margin:.5rem 0 0; color:#52627a; font-size:.88rem; line-height:1.5; }
	.stage-math { min-width:0; padding:.75rem .85rem; border-left:3px solid #0f766e; border-radius:0 .65rem .65rem 0; background:#f0fdfa; }
	.stage-math p { margin:.4rem 0 0; color:#17324a; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.9rem; font-weight:650; line-height:1.5; overflow-wrap:anywhere; }
	.matrix { display:flex; flex-wrap:wrap; gap:.6rem; margin:.8rem 0 1rem; }
	.matrix span { padding:.55rem .75rem; border-radius:.65rem; background:#f1f5f9; color:#24364b; font-family:ui-monospace, monospace; }
	.exp-table { margin:.8rem 0; border-collapse:collapse; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
	.exp-table caption { margin-bottom:.35rem; color:#334155; font-family:inherit; font-size:.85rem; font-weight:750; text-align:left; }
	.exp-table th, .exp-table td { padding:.4rem .8rem; border:1px solid #dbe4ee; text-align:left; }
	.exp-table th { background:#f1f5f9; color:#24364b; }
	.side-note { margin:.5rem 0 1rem; padding:.6rem .8rem; border-left:3px solid #94a3b8; background:#f8fafc; color:#475569; font-size:.88rem; line-height:1.5; }
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
	.continue:disabled, .previous:disabled { cursor:not-allowed; opacity:.5; }
	.completion { margin-top:1.25rem; padding:1rem 1.1rem; border:1px solid #5eead4; border-radius:.8rem; background:#f0fdfa; color:#134e4a; }
	.completion p { margin:.35rem 0 0; }
	.save-note { color:#52627a; font-size:.92rem; }
	@media (min-width:1180px) {
		.lab { position:relative; left:50%; width:min(92rem,calc(100vw - 2rem)); padding:clamp(1.25rem,2vw,2rem); transform:translateX(-50%); }
		.lab-workspace { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(22rem,1fr); align-items:start; gap:clamp(1rem,1.5vw,1.5rem); }
		.training-visual { position:sticky; top:5.5rem; max-height:calc(100dvh - 6.25rem); overflow-y:auto; overscroll-behavior:contain; margin:0; }
		.exercise-panel .lab-stage:first-of-type { border-top:0; padding-top:0; }
		.exercise-panel .answer { grid-template-columns:minmax(0,1fr) minmax(6.5rem,8rem); gap:.5rem; }
	}
	@media (max-width:600px) {
		.lab { border-radius: 1.15rem; }
		.training-visual { padding:.7rem; }
		.stage-navigation { justify-content:space-between; gap:.25rem; }
		.stage-navigation button { width:2.35rem; height:2.35rem; }
		.progress-head { align-items:flex-start; flex-direction:column; gap:.2rem; }
		.answer { grid-template-columns:1fr; gap:.35rem; }
		.worked-heading, .operation-heading { align-items:flex-start; flex-wrap:wrap; }
	}
	@media (prefers-reduced-motion:reduce) { .lab-stage { animation:none; } }
</style>
