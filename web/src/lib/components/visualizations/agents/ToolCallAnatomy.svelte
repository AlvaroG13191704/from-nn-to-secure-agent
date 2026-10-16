<script lang="ts">
	import recordedRuns from '#lib/domain/agents/data/recorded-runs.json';
	import type { AgentEvent } from '#lib/domain/agents/harness.js';
	import { TOOLS, type ToolName } from '#lib/domain/agents/tools.js';

	type ToolCall = Extract<AgentEvent, { type: 'tool-call' }>;
	type ToolResultEvent = Extract<AgentEvent, { type: 'tool-result' }>;
	type Thought = Extract<AgentEvent, { type: 'thought' }>;

	const uid = $props.id();

	const libraryEvents = recordedRuns.library.events as unknown as AgentEvent[];
	const firstCall = libraryEvents.find((event): event is ToolCall => event.type === 'tool-call');
	const firstThought = libraryEvents.find((event): event is Thought => event.type === 'thought' && event.step === firstCall?.step);
	const firstResult = libraryEvents.find((event): event is ToolResultEvent => event.type === 'tool-result' && event.step === firstCall?.step);
	const exampleJson = JSON.stringify({
		pensamiento: firstThought?.text,
		accion: 'usar_herramienta',
		herramienta: firstCall?.tool,
		argumentos: firstCall?.args
	}, null, 2);

	const CHOICES: ToolName[] = ['buscar_catalogo', 'horario_biblioteca', 'calculadora', 'enviar_correo', 'buscar_reglamento'];

	const REQUESTS: Array<{ id: string; text: string; answer: ToolName; values: Record<string, string> }> = [
		{ id: 'hours', text: '¿A qué hora abre la biblioteca el lunes?', answer: 'horario_biblioteca', values: { dia: 'lunes' } },
		{ id: 'percent', text: '¿Cuánto es 15 % de 240?', answer: 'calculadora', values: { expresion: '240 * 15 / 100' } },
		{ id: 'algebra', text: '¿Hay libros de álgebra?', answer: 'buscar_catalogo', values: { consulta: 'álgebra' } }
	];

	let picks = $state<Record<string, ToolName>>({});

	function requestJson(tool: ToolName, values: Record<string, string>) {
		const argumentos = Object.fromEntries(Object.keys(TOOLS[tool].parameters).map((key) => [key, values[key] ?? '']));
		return JSON.stringify({ accion: 'usar_herramienta', herramienta: tool, argumentos }, null, 2);
	}
</script>

<section class="anatomy" aria-labelledby={`${uid}-title`}>
	<p class="stage-label">03 · Herramientas</p>
	<h3 id={`${uid}-title`}>El modelo no ejecuta nada: escribe una petición</h3>
	<p>Voy a aclarar algo importante: el modelo solo produce texto. Cuando «usa» una herramienta, en realidad escribe una petición estructurada en formato JSON. Quien la ejecuta es el <strong>harness</strong>, el programa que rodea al modelo: revisa la petición, llama a la herramienta y le devuelve el resultado como una observación.</p>

	<ol class="flow" aria-label="Recorrido de una llamada a herramienta">
		<li class="model">
			<p class="column-title">1 · Modelo</p>
			<p class="column-text">Escribe la petición en JSON.</p>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the JSON on narrow screens.) -->
			<pre role="region" tabindex="0" aria-label="Petición JSON escrita por el modelo"><code>{exampleJson}</code></pre>
		</li>
		<li class="harness">
			<p class="column-title">2 · Harness</p>
			<p class="column-text">Valida que la herramienta exista, que esté permitida y que tenga sus argumentos. Si todo está bien, la ejecuta.</p>
			<ul class="checks">
				<li>✔ ¿La herramienta existe?</li>
				<li>✔ ¿Este agente puede usarla?</li>
				<li>✔ ¿Tiene sus argumentos?</li>
			</ul>
		</li>
		<li class="tool">
			<p class="column-title">3 · Herramienta</p>
			<p class="column-text">Hace el trabajo real y devuelve un resultado.</p>
			<p class="result">{firstResult?.output}</p>
		</li>
	</ol>
	<p class="back">↩ El resultado regresa al modelo como <strong>observación</strong>, y el modelo decide el siguiente paso.</p>
	<p class="note">Este ejemplo es la primera llamada real de {recordedRuns.model} en la misión de la biblioteca. El argumento <code>dia</code> va vacío porque el formato pide llenar todos los campos y la herramienta de catálogo no lo usa.</p>

	<div class="practice">
		<h4>Ahora tú: elige la herramienta</h4>
		<p>Lee cada pedido y elige la herramienta que el modelo debería pedir. Las descripciones de las herramientas son lo único que el modelo lee para decidir.</p>
		<ol class="requests">
			{#each REQUESTS as request, index (request.id)}
				{@const pick = picks[request.id]}
				<li class:correct={pick === request.answer} class:wrong={pick && pick !== request.answer}>
					<p class="request-text">«{request.text}»</p>
					<div class="options" role="group" aria-label={`Herramienta para el pedido ${index + 1}`}>
						{#each CHOICES as tool (tool)}
							<button type="button" aria-pressed={pick === tool} class:selected={pick === tool} title={TOOLS[tool].description} onclick={() => (picks = { ...picks, [request.id]: tool })}><code>{tool}</code></button>
						{/each}
					</div>
					<div aria-live="polite">
						{#if pick === request.answer}
							<p class="feedback"><strong>Correcto.</strong> Su descripción dice: «{TOOLS[pick].description}» Esta es la petición que escribiría el modelo:</p>
							<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the JSON on narrow screens.) -->
							<pre role="region" tabindex="0" aria-label={`Petición JSON para ${pick}`}><code>{requestJson(pick, request.values)}</code></pre>
						{:else if pick}
							<p class="feedback"><strong>Todavía no.</strong> <code>{pick}</code> sirve para esto: «{TOOLS[pick].description}» Intenta con otra.</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
		<p class="lesson">Las descripciones de las herramientas también son <strong>prompts</strong>: si una descripción es vaga o engañosa, el modelo elegirá mal. Escribirlas bien es parte del trabajo de quien construye el agente.</p>
		<button type="button" onclick={() => (picks = {})} disabled={Object.keys(picks).length === 0}>Reiniciar</button>
	</div>
</section>

<style>
	.anatomy { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	h4 { margin: 0 0 .4rem; color: #17253a; font-size: 1.2rem; }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.flow { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: .75rem; margin: 1rem 0 .5rem; padding: 0; list-style: none; }
	.flow > li { min-width: 0; padding: .8rem 1rem; border: 1px solid #d9e1eb; border-top-width: 4px; border-radius: 1rem; background: white; }
	.flow .model { border-top-color: #1d4ed8; }
	.flow .harness { border-top-color: #f97316; }
	.flow .tool { border-top-color: #0f766e; }
	.column-title { margin: 0; color: #17253a; font-size: 1.1rem; font-weight: 800; }
	.column-text { margin: .2rem 0 .5rem; }
	.checks { margin: 0; padding: 0; list-style: none; color: #17253a; font-weight: 700; line-height: 1.8; }
	.result { margin: 0; padding: .6rem .8rem; border-radius: .6rem; background: #f0fdfa; color: #17253a; overflow-wrap: anywhere; }
	pre { max-width: 100%; margin: .4rem 0 0; padding: .7rem .9rem; overflow-x: auto; border-radius: .6rem; background: #17253a; color: #e2e8f0; font-size: .88rem; line-height: 1.5; }
	pre code { padding: 0; background: none; color: inherit; }
	.back { color: #0f766e; font-weight: 800; }
	.note { font-size: .9rem; }
	code { padding: 0 .25rem; border-radius: .3rem; background: #eef2f7; color: #17253a; font-size: .95em; overflow-wrap: anywhere; }
	.practice { margin-top: 1rem; padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.requests { display: grid; gap: .75rem; margin: .75rem 0; padding: 0; list-style: none; }
	.requests > li { min-width: 0; padding: .8rem 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: white; }
	.requests > li.correct { border-color: #0f766e; background: #f0fdfa; }
	.requests > li.wrong { border-color: #f97316; background: #fff7ed; }
	.request-text { margin: 0 0 .5rem; color: #17253a; font-size: 1.1rem; font-weight: 800; }
	.options { display: flex; flex-wrap: wrap; gap: .4rem; }
	.options code { background: none; padding: 0; }
	.feedback { margin: .5rem 0 0; color: #17253a; }
	.lesson { padding: .6rem .9rem; border-left: 4px solid #1d4ed8; border-radius: .5rem; background: #dbeafe; color: #17253a; }
	button { min-height: 2.75rem; padding: .45rem 1rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	button.selected { border-color: #1d4ed8; background: #dbeafe; }
	button:disabled { opacity: .5; cursor: not-allowed; }
	button:focus-visible, pre:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
</style>
