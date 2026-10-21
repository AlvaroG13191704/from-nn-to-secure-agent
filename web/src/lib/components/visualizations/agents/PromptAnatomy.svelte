<script lang="ts">
	import { REFERENCE_PRICING, formatUsd } from '#lib/domain/agents/budget.js';
	import recordedRuns from '#lib/domain/agents/data/recorded-runs.json';

	const id = $props.id();
	// Teaching estimate: Spanish text averages roughly four characters per token.
	const CHARS_PER_TOKEN = 4;

	type PieceId = 'role' | 'context' | 'task' | 'format' | 'constraints' | 'examples';
	const pieces: Array<{ id: PieceId; label: string; why: string; sample: string }> = [
		{ id: 'role', label: 'Rol', why: 'Le digo quién es y a quién atiende.', sample: 'Rol: eres el asistente de la biblioteca de la UMG Chiquimula.' },
		{ id: 'context', label: 'Contexto', why: 'Le doy los datos que necesita; el modelo no conoce nuestro catálogo.', sample: 'Contexto: «Cálculo diferencial e integral» (Stewart): 2 disponibles; «Cálculo de una variable» (Thomas): 0 disponibles.' },
		{ id: 'task', label: 'Tarea', why: 'Digo exactamente qué debe hacer.', sample: 'Tarea: responde la pregunta de la persona usando SOLO el contexto.' },
		{ id: 'format', label: 'Formato de salida', why: 'Defino la forma de la respuesta para poder revisarla.', sample: 'Formato: máximo dos oraciones; menciona título y cantidad disponible.' },
		{ id: 'constraints', label: 'Restricciones', why: 'Marco límites y qué hacer cuando falta información.', sample: 'Restricciones: si el dato no está en el contexto, di que no lo sabes. No inventes horarios ni libros.' },
		{ id: 'examples', label: 'Ejemplos (few-shot)', why: 'Muestro una pregunta y su respuesta ideal; el modelo imita el patrón.', sample: 'Ejemplo: «¿Hay libros de física?» → «No tengo ese dato en el catálogo; consulta en el mostrador.»' }
	];

	let active = $state<Record<PieceId, boolean>>({ role: true, context: false, task: true, format: false, constraints: false, examples: false });

	const assembled = $derived(pieces.filter((piece) => active[piece.id]).map((piece) => piece.sample).join('\n'));
	const promptTokens = $derived(Math.ceil(assembled.length / CHARS_PER_TOKEN));
	const costPerCall = $derived((promptTokens * REFERENCE_PRICING.inputPerMillion) / 1_000_000);
	const costSixSteps = $derived(costPerCall * 6);

	const comparison = recordedRuns.promptComparison;
	const recordedModel = recordedRuns.model;

	const variants = [
		{
			id: 'vague',
			title: 'Prompt vago',
			run: comparison.vague,
			verdict: 'Respondió de forma genérica: no conoce nuestra biblioteca, no dio ningún título ni cantidad. No puedo comprobar nada.',
			good: false
		},
		{
			id: 'structured',
			title: 'Prompt estructurado',
			run: comparison.structured,
			verdict: 'Usó los datos del contexto: título, autor y cantidad. Gastó más tokens de entrada, pero la respuesta es correcta y la puedo verificar.',
			good: true
		}
	];

	const tips = [
		{ title: 'Sé específico', text: '«Responde en dos oraciones» funciona mejor que «sé breve».' },
		{ title: 'Da contexto', text: 'El modelo solo sabe lo que viene en su entrenamiento y en el prompt.' },
		{ title: 'Define el formato', text: 'Una forma fija (lista, JSON, dos oraciones) me deja revisar la respuesta.' },
		{ title: 'Di qué hacer si falta información', text: '«Si no lo sabes, dilo» reduce las respuestas inventadas.' }
	];

	function runCost(usage: { inputTokens: number; outputTokens: number; thinkingTokens: number }) {
		return (usage.inputTokens * REFERENCE_PRICING.inputPerMillion + (usage.outputTokens + usage.thinkingTokens) * REFERENCE_PRICING.outputPerMillion) / 1_000_000;
	}
</script>

<section class="prompt-anatomy" aria-labelledby="{id}-title">
	<p class="stage-label">Prompt engineering</p>
	<h3 id="{id}-title">Anatomía de un buen prompt</h3>
	<p>Un prompt no es una pregunta suelta: es la hoja de instrucciones que el modelo lee antes de responder. Activa las piezas y observa cómo crece el prompt del asistente de la biblioteca y cuánto cuesta.</p>

	<ul class="pieces">
		{#each pieces as piece (piece.id)}
			<li>
				<label class="piece" class:on={active[piece.id]}>
					<input type="checkbox" bind:checked={active[piece.id]} />
					<span>
						<strong>{piece.label}</strong>
						<small>{piece.why}</small>
					</span>
				</label>
			</li>
		{/each}
	</ul>

	<div class="assembled">
		<h4>Prompt de sistema armado</h4>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the prompt on narrow screens.) -->
		<pre role="region" tabindex="0" aria-label="Prompt de sistema armado">{assembled || '(vacío: el modelo solo verá la pregunta)'}</pre>
		<dl class="metrics" aria-live="polite">
			<div><dt>Caracteres</dt><dd>{assembled.length}</dd></div>
			<div><dt>Tokens aprox.</dt><dd>≈ {promptTokens}</dd></div>
			<div><dt>Costo por llamada</dt><dd>{formatUsd(costPerCall)}</dd></div>
			<div><dt>En 6 pasos del ciclo</dt><dd>{formatUsd(costSixSteps)}</dd></div>
		</dl>
		<p class="note">Estimo ≈ 1 token por cada {CHARS_PER_TOKEN} caracteres (es aproximado) y uso ${REFERENCE_PRICING.inputPerMillion} por millón de tokens de entrada. Ojo: un agente reenvía el prompt de sistema en <strong>cada paso</strong> de su ciclo, así que lo pago una y otra vez.</p>
	</div>

	<div class="real-test">
		<p class="stage-label">La prueba real</p>
		<h4>Misma pregunta, dos prompts</h4>
		<p class="question">Pregunta: «{comparison.question}»</p>
		<p class="recorded">Respuestas reales de {recordedModel} grabadas el 15 de octubre de 2026.</p>
		<div class="variants">
			{#each variants as variant (variant.id)}
				<article class="variant" class:good={variant.good} aria-labelledby="{id}-{variant.id}">
					<h5 id="{id}-{variant.id}">{variant.title}</h5>
					<p class="field-label">Prompt de sistema</p>
					<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the prompt on narrow screens.) -->
					<pre role="region" tabindex="0" aria-label="Prompt de sistema: {variant.title}">{variant.run.system}</pre>
					<p class="field-label">Respuesta del modelo</p>
					<blockquote>{variant.run.answer}</blockquote>
					<p class="usage">Entrada: <strong>{variant.run.usage.inputTokens}</strong> tokens · Salida: <strong>{variant.run.usage.outputTokens}</strong> tokens · {formatUsd(runCost(variant.run.usage))}</p>
					<p class="verdict">{variant.verdict}</p>
				</article>
			{/each}
		</div>
	</div>

	<div class="tips">
		<h4>Cuatro consejos que uso siempre</h4>
		<ul>
			{#each tips as tip (tip.title)}
				<li><strong>{tip.title}.</strong> {tip.text}</li>
			{/each}
		</ul>
		<p class="note">Las <strong>descripciones de las herramientas</strong> también son prompts: el modelo las lee para decidir cuándo usar cada una. Si la descripción es confusa, el agente elige mal.</p>
	</div>
</section>

<style>
	.prompt-anatomy { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	h4 { margin: 0 0 .5rem; color: #17253a; font-size: 1.2rem; }
	h5 { margin: 0 0 .4rem; color: #17253a; font-size: 1.1rem; }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.pieces { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: .5rem; margin: 1rem 0; padding: 0; list-style: none; }
	.piece { display: flex; gap: .6rem; align-items: flex-start; height: 100%; padding: .7rem .85rem; border: 1px solid #d9e1eb; border-radius: .8rem; background: white; cursor: pointer; box-sizing: border-box; }
	.piece.on { border-color: #1d4ed8; background: #dbeafe; }
	.piece input { width: 1.2rem; height: 1.2rem; margin-top: .2rem; accent-color: #1d4ed8; flex: none; }
	.piece input:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.piece strong { display: block; color: #17253a; font-size: 1.02rem; }
	.piece small { color: #52627a; font-size: .9rem; line-height: 1.4; }
	.assembled, .real-test, .tips { margin-top: 1rem; padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	pre { margin: .4rem 0; padding: .75rem 1rem; overflow-x: auto; border-radius: .7rem; background: #17253a; color: #f8fbff; font-size: .92rem; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
	pre:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr)); gap: .5rem; margin: .75rem 0; }
	.metrics div { padding: .5rem .75rem; border: 1px solid #d9e1eb; border-radius: .7rem; background: white; }
	.metrics dt { color: #52627a; font-size: .82rem; font-weight: 700; }
	.metrics dd { margin: 0; color: #17253a; font-size: 1.3rem; font-weight: 800; font-variant-numeric: tabular-nums; }
	.note { margin-bottom: 0; font-size: .95rem; }
	.question { color: #17253a; font-size: 1.15rem; font-weight: 800; }
	.recorded { font-size: .88rem; font-style: italic; }
	.variants { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: .75rem; }
	.variant { min-width: 0; padding: .9rem; border: 1px solid #d9e1eb; border-top: 4px solid #f97316; border-radius: .8rem; background: white; }
	.variant.good { border-top-color: #0f766e; }
	.field-label { margin: .5rem 0 0; color: #17253a; font-size: .85rem; font-weight: 800; }
	blockquote { margin: .4rem 0; padding: .5rem .8rem; border-left: 4px solid #1d4ed8; border-radius: .4rem; background: #dbeafe; color: #17253a; line-height: 1.5; }
	.usage { font-size: .92rem; font-variant-numeric: tabular-nums; }
	.verdict { margin-bottom: 0; padding: .5rem .8rem; border-radius: .5rem; background: #fff7ed; color: #17253a; }
	.variant.good .verdict { background: #ccfbf1; }
	.tips ul { display: grid; gap: .4rem; margin: 0 0 .75rem; padding-left: 1.2rem; color: #17253a; line-height: 1.5; }
</style>
