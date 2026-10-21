<script lang="ts">
	import { onMount } from 'svelte';

	type Stage = { id: string; title: string; carries: string; explanation: string; group: 'input' | 'block' | 'output'; mlp?: boolean };

	const stages: Stage[] = [
		{ id: 'text', group: 'input', title: 'Texto', carries: '«La capital de Guatemala es»', explanation: 'Empiezo con el texto que escribe la persona. Para la red todavía son solo letras; necesito convertirlas en números.' },
		{ id: 'tokenizer', group: 'input', title: 'Tokenizador (IDs)', carries: 'IDs: [412, 9081, 28, 5120, 76]', explanation: 'El tokenizador corta el texto en tokens y le asigna a cada uno un número de identificación (ID) dentro de su vocabulario.' },
		{ id: 'embedding', group: 'input', title: 'Embeddings + posición', carries: 'un vector por token', explanation: 'Cada ID se cambia por su vector de embedding. Le sumo información de posición, porque «perro muerde a hombre» no significa lo mismo que «hombre muerde a perro».' },
		{ id: 'attention', group: 'block', title: 'Atención multicabeza causal', carries: 'vectores que ya miraron el contexto', explanation: 'Cada token mira a los tokens anteriores y mezcla su información según los pesos de atención. Varias cabezas buscan relaciones distintas al mismo tiempo.' },
		{ id: 'ffn', group: 'block', title: 'FeedForward (MLP)', carries: 'cada vector, transformado por separado', mlp: true, explanation: 'Aquí cada vector pasa por una red de capas densas con activación: pesos, sesgos y una no linealidad, igual que la red que entrenamos en la mañana. El resultado entra al siguiente bloque, que es idéntico, y así N veces.' },
		{ id: 'logits', group: 'output', title: 'Capa de salida (logits)', carries: 'un puntaje por cada token del vocabulario', explanation: 'Con el vector del último token calculo un puntaje (logit) para cada token posible del vocabulario.' },
		{ id: 'softmax', group: 'output', title: 'Softmax', carries: 'probabilidades que suman 1', explanation: 'La función softmax convierte esos puntajes en probabilidades: valores entre 0 y 1 que suman 1.' },
		{ id: 'next', group: 'output', title: 'Siguiente token', carries: '«Ciudad»', explanation: 'Elijo un token según esas probabilidades, lo agrego al texto y repito todo el proceso para el siguiente.' }
	];

	const groups: Array<{ id: Stage['group']; label: string }> = [
		{ id: 'input', label: 'Entrada' },
		{ id: 'block', label: 'Bloque Transformer' },
		{ id: 'output', label: 'Salida' }
	];

	let selectedIndex = $state(0);
	let flowIndex = $state(-1);
	let playing = $state(false);
	let reducedMotion = $state(false);

	const selected = $derived(stages[selectedIndex]);
	const flowStatus = $derived(
		flowIndex < 0
			? 'El vector del token todavía no ha entrado al modelo.'
			: `Paso ${flowIndex + 1} de ${stages.length}: ${stages[flowIndex].title}. Ahora lleva ${stages[flowIndex].carries}.`
	);

	onMount(() => {
		const query = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = query.matches;
		const update = (event: MediaQueryListEvent) => {
			reducedMotion = event.matches;
			if (event.matches) playing = false;
		};
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	});

	$effect(() => {
		if (!playing) return;
		const timer = window.setInterval(() => {
			if (flowIndex >= stages.length - 1) {
				playing = false;
				return;
			}
			step();
		}, 1400);
		return () => window.clearInterval(timer);
	});

	function step() {
		if (flowIndex >= stages.length - 1) return;
		flowIndex += 1;
		selectedIndex = flowIndex;
	}

	function togglePlay() {
		if (reducedMotion) return;
		if (!playing && flowIndex >= stages.length - 1) flowIndex = -1;
		playing = !playing;
	}

	function reset() {
		playing = false;
		flowIndex = -1;
		selectedIndex = 0;
	}
</script>

<section class="transformer-diagram" aria-labelledby="transformer-title">
	<p class="stage-label">Dentro de un LLM</p>
	<h3 id="transformer-title">El recorrido de un token por el Transformer</h3>
	<p>Un modelo como GPT, LLaMA o Qwen es una pila de bloques iguales. Selecciona cada pieza para ver qué hace, o anima el recorrido del vector de un token.</p>

	<div class="flow-controls" role="group" aria-label="Animación del flujo">
		<button type="button" class="primary" onclick={togglePlay} disabled={reducedMotion} aria-pressed={playing}>{playing ? 'Pausar' : 'Animar flujo'}</button>
		<button type="button" onclick={step} disabled={flowIndex >= stages.length - 1}>Un paso</button>
		<button type="button" onclick={reset}>Reiniciar</button>
	</div>
	{#if reducedMotion}<p class="motion-note">Tienes activado «reducir movimiento»: uso solo los pasos manuales.</p>{/if}
	<p class="flow-status" aria-live="polite">{flowStatus}</p>

	<div class="workspace">
	<div class="diagram">
		{#each groups as group, groupIndex (group.id)}
			<div class="column" class:block-group={group.id === 'block'}>
				<p class="group-label">{group.label}{#if group.id === 'block'} <span class="repeat">× N</span>{/if}</p>
				<ol class="stage-list">
					{#each stages as stage, index (stage.id)}
						{#if stage.group === group.id}
							<li>
								<button
									type="button"
									class="node"
									class:selected={selectedIndex === index}
									class:flowing={flowIndex === index}
									class:passed={flowIndex > index}
									class:mlp={stage.mlp}
									aria-pressed={selectedIndex === index}
									onclick={() => (selectedIndex = index)}
								>
									<span class="node-number">{index + 1}</span>
									<span class="node-title">{stage.title}</span>
									{#if stage.mlp}<span class="mlp-flag">¡Es el MLP que entrenamos en la mañana!</span>{/if}
									{#if flowIndex === index}<span class="token-marker" aria-hidden="true">vector del token</span>{/if}
								</button>
							</li>
						{/if}
					{/each}
				</ol>
			</div>
			{#if groupIndex < groups.length - 1}<span class="connector" aria-hidden="true">→</span>{/if}
		{/each}
	</div>

	<div class="explanation-column">
		<div class="explanation" aria-live="polite">
			<p class="explanation-step">Pieza {selectedIndex + 1} de {stages.length}</p>
			<h4>{selected.title}</h4>
			<p>{selected.explanation}</p>
			<p class="carries">Lo que sale de aquí: <strong>{selected.carries}</strong></p>
		</div>
		<p class="note">El bloque se repite <strong>N</strong> veces, una encima de otra: un modelo pequeño puede tener 12 bloques; los grandes, decenas.</p>
	</div>
	</div>

	<details>
		<summary>Para profundizar: encoder vs. decoder</summary>
		<p>El Transformer original (2017) se diseñó para traducir y tenía dos partes: un <strong>encoder</strong>, que lee toda la frase de entrada mirando en ambas direcciones, y un <strong>decoder</strong>, que escribe la traducción token por token. Los LLM de estilo GPT, LLaMA o Qwen usan solo el decoder: atención causal y predicción del siguiente token.</p>
	</details>
</section>

<style>
	.transformer-diagram { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.flow-controls { display: flex; flex-wrap: wrap; gap: .5rem; margin: 1rem 0 .4rem; }
	.flow-controls button { min-height: 2.75rem; padding: .45rem 1rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	.flow-controls button.primary { border-color: #1d4ed8; background: #1d4ed8; color: white; }
	.flow-controls button:disabled { opacity: .5; cursor: not-allowed; }
	button:focus-visible, summary:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.motion-note { margin: 0; font-size: .9rem; }
	.flow-status { margin: .3rem 0 1rem; color: #17253a; font-weight: 750; }
	.diagram { display: grid; gap: .6rem; }
	.column { min-width: 0; padding: .75rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.block-group { border: 2px solid #1d4ed8; background: #eff6ff; }
	.group-label { margin: 0 0 .5rem; color: #17253a; font-weight: 800; }
	.repeat { display: inline-block; margin-left: .35rem; padding: .05rem .55rem; border-radius: 999px; background: #1d4ed8; color: white; font-size: .9rem; }
	.stage-list { display: grid; gap: .5rem; margin: 0; padding: 0; list-style: none; }
	.stage-list li + li::before { content: '↓'; display: block; margin: -.2rem 0 .3rem; color: #52627a; font-weight: 800; text-align: center; }
	.node { position: relative; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: .2rem .6rem; width: 100%; min-height: 3rem; padding: .6rem .8rem; border: 1px solid #d9e1eb; border-radius: .8rem; background: white; color: #17253a; font: inherit; font-size: 1.02rem; font-weight: 800; text-align: left; cursor: pointer; transition: background-color .3s ease, border-color .3s ease, box-shadow .3s ease; }
	.node-number { display: grid; place-items: center; width: 1.8rem; height: 1.8rem; border-radius: 50%; background: #dbeafe; color: #1d4ed8; font-size: .85rem; }
	.node.selected { border-color: #1d4ed8; box-shadow: 0 0 0 2px #1d4ed8; }
	.node.passed { background: #f0f9ff; }
	.node.flowing { border-color: #f97316; background: #fff7ed; box-shadow: 0 0 0 3px #f97316; }
	.node.mlp { border: 2px solid #0f766e; background: #ccfbf1; }
	.node.mlp .node-number { background: #0f766e; color: white; }
	.mlp-flag { grid-column: 1 / -1; color: #0f766e; font-size: .9rem; }
	.token-marker { grid-column: 1 / -1; justify-self: start; padding: .1rem .6rem; border-radius: 999px; background: #f97316; color: white; font-size: .8rem; animation: pulse 1.2s ease-in-out infinite; }
	.connector { display: block; color: #52627a; font-size: 1.4rem; font-weight: 800; text-align: center; transform: rotate(90deg); }
	.explanation { margin-top: 1rem; padding: 1rem; border: 1px solid #d9e1eb; border-left: 4px solid #1d4ed8; border-radius: 1rem; background: white; }
	.explanation h4 { margin: 0 0 .35rem; color: #17253a; font-size: 1.15rem; }
	.explanation p { margin: .25rem 0; }
	.carries { font-size: .95rem; }
	.carries strong { color: #17253a; }
	details { margin-top: .75rem; padding: .75rem 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	summary { color: #1d4ed8; font-weight: 800; cursor: pointer; }
	@keyframes pulse { 50% { transform: scale(1.08); } }
	.workspace { display: grid; gap: 1rem; }
	.explanation-step { margin: 0 0 .2rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	.connector { margin: -.2rem 0; }
	@media (min-width: 900px) {
		.workspace { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: start; gap: 1.5rem; }
		.explanation-column { position: sticky; top: 6rem; }
		.explanation-column .explanation { margin-top: 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		.node { transition: none; }
		.token-marker { animation: none; }
	}
</style>
