<script lang="ts">
	type Category = 'chatbot' | 'workflow' | 'agent';

	const uid = $props.id();

	const CATEGORIES: Array<{ id: Category; label: string; summary: string }> = [
		{ id: 'chatbot', label: 'Chatbot', summary: 'Responde con texto. No actúa sobre el mundo: no consulta sistemas ni ejecuta acciones.' },
		{ id: 'workflow', label: 'Workflow', summary: 'Sigue pasos fijos que programó una persona. El modelo es solo una pieza dentro de esa receta.' },
		{ id: 'agent', label: 'Agente', summary: 'El modelo decide qué herramienta usar, observa el resultado y decide cuándo terminar, en un ciclo.' }
	];

	const CASES: Array<{ id: string; text: string; answer: Category; why: string }> = [
		{ id: 'history-chat', text: 'Un chat que responde dudas sobre la historia de Guatemala.', answer: 'chatbot', why: 'Solo conversa: responde con lo que sabe y no usa herramientas ni cambia nada.' },
		{ id: 'invoices', text: 'Cada vez que llega una factura, un modelo extrae los datos y se guardan en una hoja de cálculo.', answer: 'workflow', why: 'Los pasos siempre son los mismos y los decidió una persona; el modelo solo extrae datos en uno de ellos.' },
		{ id: 'coding', text: 'Un asistente de programación que lee tu proyecto, decide qué archivos cambiar, ejecuta las pruebas y corrige hasta que pasan.', answer: 'agent', why: 'El modelo elige qué herramienta usar en cada paso y decide cuándo terminar según lo que observa.' },
		{ id: 'spam', text: 'Un formulario que clasifica cada correo como spam o no spam.', answer: 'workflow', why: 'Es un paso fijo programado: entra un correo, el modelo lo etiqueta y el sistema sigue su receta.' },
		{ id: 'travel', text: 'Un asistente de viajes que busca vuelos, compara precios y reserva si se lo permites.', answer: 'agent', why: 'Decide qué buscar, compara resultados y actúa en el mundo (reserva), pidiendo tu permiso antes.' }
	];

	let picks = $state<Record<string, Category>>({});

	const answered = $derived(CASES.filter((item) => picks[item.id]).length);
	const score = $derived(CASES.filter((item) => picks[item.id] === item.answer).length);

	function labelFor(category: Category) {
		return CATEGORIES.find((item) => item.id === category)?.label ?? category;
	}

	function choose(caseId: string, category: Category) {
		picks = { ...picks, [caseId]: category };
	}
</script>

<section class="classifier" aria-labelledby={`${uid}-title`}>
	<p class="stage-label">01 · ¿Qué es un agente?</p>
	<h3 id={`${uid}-title`}>Chatbot, workflow o agente</h3>
	<p>Voy a separar tres formas de usar un modelo de lenguaje. La diferencia no está en qué tan inteligente es el modelo, sino en <strong>quién decide el siguiente paso</strong>.</p>

	<ul class="categories">
		{#each CATEGORIES as category (category.id)}
			<li class={category.id}>
				<strong>{category.label}</strong>
				<span>{category.summary}</span>
			</li>
		{/each}
	</ul>

	<p>Ahora tú: clasifica cada caso real. Recibirás la explicación en cuanto elijas.</p>

	<ol class="cases">
		{#each CASES as item, index (item.id)}
			{@const pick = picks[item.id]}
			<li class="case" class:correct={pick === item.answer} class:wrong={pick && pick !== item.answer}>
				<p class="case-text"><span class="case-number">Caso {index + 1}.</span> {item.text}</p>
				<div class="options" role="group" aria-label={`Clasificación del caso ${index + 1}`}>
					{#each CATEGORIES as category (category.id)}
						<button type="button" aria-pressed={pick === category.id} class:selected={pick === category.id} onclick={() => choose(item.id, category.id)}>{category.label}</button>
					{/each}
				</div>
				<p class="feedback" aria-live="polite">
					{#if pick === item.answer}
						<strong>Correcto: {labelFor(item.answer)}.</strong> {item.why}
					{:else if pick}
						<strong>Es {labelFor(item.answer).toLowerCase()}, no {labelFor(pick).toLowerCase()}.</strong> {item.why}
					{/if}
				</p>
			</li>
		{/each}
	</ol>

	<div class="summary">
		<p class="score" aria-live="polite">Puntaje: <strong>{score}/{CASES.length}</strong>{#if answered < CASES.length} · te faltan {CASES.length - answered} casos{:else} · ¡completaste todos los casos!{/if}</p>
		<button type="button" onclick={() => (picks = {})} disabled={answered === 0}>Reiniciar</button>
	</div>
</section>

<style>
	.classifier { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: .75rem; margin: 1rem 0; padding: 0; list-style: none; }
	.categories li { display: grid; gap: .3rem; padding: .8rem 1rem; border: 1px solid #d9e1eb; border-top-width: 4px; border-radius: 1rem; background: white; color: #52627a; line-height: 1.5; }
	.categories strong { color: #17253a; font-size: 1.1rem; }
	.categories .chatbot { border-top-color: #52627a; }
	.categories .workflow { border-top-color: #1d4ed8; }
	.categories .agent { border-top-color: #0f766e; }
	.cases { display: grid; gap: .75rem; margin: 1rem 0; padding: 0; list-style: none; }
	.case { padding: .9rem 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: white; }
	.case.correct { border-color: #0f766e; background: #f0fdfa; }
	.case.wrong { border-color: #f97316; background: #fff7ed; }
	.case-text { margin: 0 0 .6rem; color: #17253a; font-size: 1.05rem; font-weight: 700; }
	.case-number { color: #1d4ed8; font-weight: 800; }
	.options { display: flex; flex-wrap: wrap; gap: .5rem; }
	.feedback { margin: .5rem 0 0; color: #17253a; }
	.feedback:empty { display: none; }
	.summary { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; padding: .75rem 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.score { margin: 0; color: #17253a; font-size: 1.1rem; }
	button { min-height: 2.75rem; padding: .45rem 1rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	button.selected { border-color: #1d4ed8; background: #dbeafe; }
	button:disabled { opacity: .5; cursor: not-allowed; }
	button:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
</style>
