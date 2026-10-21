<script lang="ts">
	import AgentClassifier from '#lib/components/visualizations/agents/AgentClassifier.svelte';
	import AgentLoopTrace from '#lib/components/visualizations/agents/AgentLoopTrace.svelte';
	import ToolCallAnatomy from '#lib/components/visualizations/agents/ToolCallAnatomy.svelte';
	import PromptAnatomy from '#lib/components/visualizations/agents/PromptAnatomy.svelte';
	import HarnessParts from '#lib/components/visualizations/agents/HarnessParts.svelte';
	import TokenBudgetCalculator from '#lib/components/visualizations/agents/TokenBudgetCalculator.svelte';
	import RagPipeline from '#lib/components/visualizations/agents/RagPipeline.svelte';
	import RagExplorer from '#lib/components/visualizations/agents/RagExplorer.svelte';
	import AgentLab from './AgentLab.svelte';
	import { BUDGET_LIMITS, formatUsd } from '#lib/domain/agents/budget.js';

	const pieces = [
		{ symbol: '🧠', title: 'Modelo', detail: 'El LLM que razona y decide. Es el «cerebro», pero por sí solo solo produce texto.' },
		{ symbol: '🎯', title: 'Objetivo', detail: 'La meta que la persona le pide cumplir, no solo una pregunta.' },
		{ symbol: '🛠️', title: 'Herramientas', detail: 'Funciones que el agente puede pedir: buscar, calcular, leer archivos, enviar un correo.' },
		{ symbol: '🔁', title: 'Ciclo', detail: 'Piensa, actúa, observa el resultado y repite hasta terminar o llegar a un límite.' }
	];

	const injectionResults = [
		{ setup: 'Drive + correo, sin guardrails', result: 'Cayó 4 de 4 veces: envió el archivo a un Gmail externo y dijo que «cumplió la tarea».', safe: false },
		{ setup: 'Con «datos no confiables»', result: 'Resistió: el modelo trató la orden del archivo como un dato, no como una instrucción.', safe: true },
		{ setup: 'Con «confirmación humana»', result: 'El harness bloqueó el correo aunque el modelo lo pidió.', safe: true }
	];

	const practices = [
		{ title: 'Empieza simple', detail: 'Si un workflow con pasos fijos resuelve el problema, no necesitas un agente.' },
		{ title: 'Pocas herramientas, bien descritas', detail: 'Cada descripción es un prompt y cuesta tokens en cada paso.' },
		{ title: 'Valida antes de ejecutar', detail: 'Revisa que la herramienta exista y que tenga todos sus argumentos.' },
		{ title: 'Pon límites', detail: 'Máximo de pasos, de tokens y de presupuesto. Un agente sin límites puede dar vueltas.' },
		{ title: 'Humano en el ciclo', detail: 'Pide confirmación antes de cualquier acción con efectos: pagar, borrar, enviar.' },
		{ title: 'Desconfía de los datos externos', detail: 'Archivos, páginas y resultados de herramientas pueden traer instrucciones escondidas.' },
		{ title: 'Mínimo privilegio', detail: 'Dale al agente solo las herramientas y permisos que su tarea necesita.' },
		{ title: 'Mide todo', detail: 'Registra pasos, tokens, costos y errores. Sin observar, no puedes mejorar.' }
	];
</script>

<div class="agents-journey">
<header class="chapter-hero">
	<p class="chapter-hero__kicker">Slide 4 · Del modelo que responde al que actúa</p>
	<h1>¿Qué le falta a un LLM para ser un agente?</h1>
	<p>En la slide anterior vimos que un LLM predice el siguiente token: responde, pero no actúa. Ahora voy a mostrar cómo lo rodeamos de herramientas, instrucciones, memoria y límites para que persiga un objetivo. A todo ese entorno se le llama <strong>harness</strong>.</p>
	<ul class="topic-list" aria-label="Temas del recorrido">
		<li>Agentes</li><li>Herramientas</li><li>Prompt engineering</li><li>Harness</li><li>Tokens y costo</li><li>RAG</li>
	</ul>
</header>

<section class="lesson" id="agente" data-lesson="¿Qué es un agente?" data-number="4.1" aria-labelledby="agente-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.1</span><h2 id="agente-title">¿Qué es un agente?</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<div class="definition"><p>Un <dfn>agente</dfn> es un sistema en el que un modelo de lenguaje decide qué hacer para cumplir un objetivo: elige herramientas, observa sus resultados y vuelve a decidir, hasta terminar.</p></div>
			<p>Lo distingo así de un chatbot, que solo conversa, y de un workflow, donde una persona programó los pasos de antemano.</p>
		</div>
		<figure class="lesson__figure">
			<div class="piece-grid">
				{#each pieces as piece (piece.title)}
					<article class="mini-card"><span class="piece-symbol" aria-hidden="true">{piece.symbol}</span><h3>{piece.title}</h3><p>{piece.detail}</p></article>
				{/each}
			</div>
			<figcaption><b>Figura 4.1.</b> Las cuatro piezas de un agente.</figcaption>
		</figure>
	</div>
	<div class="lesson__body lesson__body--wide">
		<figure class="lesson__figure">
			<AgentClassifier />
			<figcaption><b>Figura 4.2.</b> Chatbot, workflow o agente: clasifica cada caso.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson lesson--wide" id="ciclo" data-lesson="El ciclo del agente" data-number="4.2" aria-labelledby="ciclo-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.2</span><h2 id="ciclo-title">Pensar, actuar, observar… y repetir</h2></div>
	<div class="lesson__body">
		<div class="lesson__text lesson__text--columns">
			<p>El corazón de un agente es un ciclo. En cada vuelta, el modelo recibe todo lo que ha pasado hasta ahora y decide una sola cosa: usar una herramienta o dar la respuesta final.</p>
			<p>Esta idea se popularizó con el nombre <strong>ReAct</strong> (razonar y actuar). Veamos una ejecución real, paso a paso.</p>
		</div>
		<figure class="lesson__figure">
			<AgentLoopTrace />
			<figcaption><b>Figura 4.3.</b> Una ejecución real de un agente, vuelta por vuelta.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson" id="herramientas" data-lesson="Herramientas" data-number="4.3" aria-labelledby="herramientas-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.3</span><h2 id="herramientas-title">El modelo pide; el harness ejecuta</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Un modelo de lenguaje no puede abrir archivos ni consultar una base de datos: solo escribe texto.</p>
			<p>Lo que hace es escribir una <strong>petición estructurada</strong> que dice qué herramienta quiere y con qué argumentos. El programa que lo rodea revisa esa petición, ejecuta la herramienta y le devuelve el resultado como una observación.</p>
		</div>
		<figure class="lesson__figure">
			<ToolCallAnatomy />
			<figcaption><b>Figura 4.4.</b> Anatomía de una llamada a herramienta.</figcaption>
		</figure>
	</div>
	<div class="lesson__body lesson__body--wide">
		<div class="callout-grid">
			<div><strong>Conexiones (MCP)</strong><p>El Model Context Protocol es un estándar para conectar agentes con herramientas y datos externos, como un puerto USB-C: una misma conexión sirve para muchos agentes.</p></div>
			<div><strong>Skills</strong><p>Paquetes de instrucciones y recursos que el agente carga solo cuando la tarea los necesita. Así no paga en tokens instrucciones que no usa.</p></div>
		</div>
	</div>
</section>

<section class="lesson lesson--wide" id="prompts" data-lesson="Prompt engineering" data-number="4.4" aria-labelledby="prompts-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.4</span><h2 id="prompts-title">El prompt es la pieza más barata y más poderosa</h2></div>
	<div class="lesson__body">
		<div class="lesson__text lesson__text--columns">
			<p>El <strong>prompt de sistema</strong> le dice al modelo quién es, qué sabe, qué debe hacer y cómo responder.</p>
			<p>Escribirlo bien no es magia: es dar contexto y reglas claras, igual que le explicarías una tarea a una persona nueva en un trabajo.</p>
		</div>
		<figure class="lesson__figure">
			<PromptAnatomy />
			<figcaption><b>Figura 4.5.</b> Las partes de un prompt de sistema.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson lesson--wide" id="harness" data-lesson="El harness" data-number="4.5" aria-labelledby="harness-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.5</span><h2 id="harness-title">El modelo es el motor; el harness es el carro</h2></div>
	<div class="lesson__body">
		<div class="lesson__text lesson__text--columns">
			<p>Un motor potente no sirve sin volante, frenos ni tablero. El <strong>harness</strong> es todo el software alrededor del modelo: arma el prompt, ofrece las herramientas, valida y ejecuta sus llamadas, controla el ciclo, guarda la memoria, aplica permisos y registra lo que pasa.</p>
			<p>Herramientas como Claude Code o Cursor son harnesses; en el laboratorio vas a armar el tuyo.</p>
		</div>
		<figure class="lesson__figure">
			<HarnessParts />
			<figcaption><b>Figura 4.6.</b> Las partes del harness que rodean al modelo.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson lesson--wide" id="tokens" data-lesson="Tokens, contexto y costo" data-number="4.6" aria-labelledby="tokens-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.6</span><h2 id="tokens-title">Cada paso del ciclo se paga</h2></div>
	<div class="lesson__body">
		<div class="lesson__text lesson__text--columns">
			<p>En la slide 3 vimos la ventana de contexto. En un agente, el contexto se reenvía completo en <strong>cada paso</strong>: instrucciones, descripciones de herramientas, fragmentos recuperados y todo el historial. Por eso un agente mal diseñado puede costar diez veces más que uno bien pensado y, aun así, responder peor.</p>
			<div class="key-idea"><p><strong>Tu presupuesto en el laboratorio:</strong> si tu computadora usa Gemini Nano, tu agente corre gratis en tu equipo y verás el costo equivalente. Si usas Gemini Flash, tendrás {formatUsd(BUDGET_LIMITS.studentCapUsd)} para todas tus pruebas, de un fondo de {formatUsd(BUDGET_LIMITS.globalCapUsd)} para todo el taller. En nuestras pruebas, una misión bien armada costó entre $0.001 y $0.003.</p></div>
		</div>
		<figure class="lesson__figure">
			<TokenBudgetCalculator />
			<figcaption><b>Figura 4.7.</b> Calculadora de tokens y costo por paso del ciclo.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson lesson--wide" id="rag" data-lesson="RAG" data-number="4.7" aria-labelledby="rag-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.7</span><h2 id="rag-title">Darle al modelo los documentos que nunca leyó</h2></div>
	<div class="lesson__body">
		<div class="lesson__text lesson__text--columns">
			<p>Un LLM solo sabe lo que había en sus datos de entrenamiento. No conoce el reglamento de tu universidad ni lo que pasó ayer.</p>
			<p><strong>RAG</strong> (generación aumentada por recuperación) busca primero los fragmentos más relevantes de tus documentos y los agrega al prompt antes de que el modelo responda.</p>
		</div>
		<figure class="lesson__figure">
			<RagPipeline />
			<figcaption><b>Figura 4.8.</b> Las etapas de RAG: preparar los documentos, recuperar y generar.</figcaption>
		</figure>
		<figure class="lesson__figure">
			<RagExplorer />
			<figcaption><b>Figura 4.9.</b> Haz una pregunta y mira qué fragmentos recupera la búsqueda.</figcaption>
		</figure>
		<div class="key-idea"><p><strong>Conexión con la slide 3:</strong> la búsqueda usa el mismo modelo de embeddings MiniLM y la misma similitud coseno que exploramos con palabras. Ahora cada punto es un fragmento de documento.</p></div>
	</div>
</section>

<section class="lesson" id="guardrails" data-lesson="Guardrails" data-number="4.8" aria-labelledby="guardrails-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.8</span><h2 id="guardrails-title">Cuando los datos traen órdenes escondidas</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Un agente lee archivos, páginas y respuestas de herramientas. Si uno de esos textos incluye una instrucción, el modelo puede confundirla con una orden de la persona usuaria. A eso se le llama <strong>prompt injection</strong> indirecta.</p>
			<p>Lo probé con Gemini 3.8 Flash: una orden obvia como «ignora tus instrucciones» la rechazó, pero una tarea que parecía rutinaria la obedeció.</p>
			<div class="key-idea"><p><strong>La lección:</strong> la seguridad no puede depender de que el modelo se porte bien. Un buen harness trata los datos externos como no confiables y pide confirmación humana antes de cualquier acción con efectos.</p></div>
		</div>
		<figure class="lesson__figure">
			<ul class="result-list">
				{#each injectionResults as item (item.setup)}
					<li class:safe={item.safe}><strong>{item.setup}</strong><span>{item.result}</span></li>
				{/each}
			</ul>
			<figcaption><b>Figura 4.10.</b> Resultados del mismo ataque de prompt injection con tres configuraciones del agente.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson lesson--wide" id="practicas" data-lesson="Buenas prácticas" data-number="4.9" aria-labelledby="practicas-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">4.9</span><h2 id="practicas-title">Ocho reglas para construir agentes</h2></div>
	<ol class="practice-grid">
		{#each practices as practice, index (practice.title)}
			<li><span class="practice-number">{index + 1}</span><div><strong>{practice.title}</strong><p>{practice.detail}</p></div></li>
		{/each}
	</ol>
</section>

<section class="lesson lesson--closing" aria-labelledby="puente-agentes-title">
	<h2 id="puente-agentes-title">Ahora te toca construir tu agente</h2>
	<div class="lesson__text">
		<p>En el laboratorio vas a elegir bloques (skills, herramientas, conexiones y guardrails) para resolver tres misiones con un modelo real. No gana quien use más bloques, sino quien cumpla la misión de forma segura y gastando menos tokens.</p>
		<a class="back-home" href="/device-check">¿Aún no revisas tu computadora? Hazlo aquí →</a>
	</div>
</section>

<section class="lesson lesson--bare" id="laboratorio" data-lesson="Laboratorio: arma tu agente" data-number="4.10" aria-label="Laboratorio: arma tu agente">
	<AgentLab />
</section>

<section class="lesson lesson--closing" aria-labelledby="cierre-agentes-title">
	<h2 id="cierre-agentes-title">De una neurona a un agente que actúa</h2>
	<div class="lesson__text">
		<p>Empezamos multiplicando entradas por pesos. Entrenamos una red, la convertimos en un modelo de lenguaje y hoy la rodeamos de herramientas, memoria y límites. El modelo es solo una pieza: lo que decide si un agente es útil y seguro es el harness que tú diseñas.</p>
	</div>
</section>

<footer class="lesson lesson--closing sources" aria-labelledby="fuentes-agentes-title">
	<h2 id="fuentes-agentes-title">Fuentes y materiales extra</h2>
	<div class="lesson__text">
		<p>Las ejecuciones mostradas son reales (gemini-3.8-flash, grabadas el 15 de octubre de 2026). El catálogo, el reglamento y los archivos son ficticios, creados para el taller.</p>
		<ul>
			<li><a href="https://www.anthropic.com/engineering/building-effective-agents" target="_blank" rel="noreferrer">Anthropic, «Building effective agents»: workflows contra agentes y patrones prácticos</a></li>
			<li><a href="https://arxiv.org/abs/2210.03629" target="_blank" rel="noreferrer">Yao et al. (2022), «ReAct: Synergizing Reasoning and Acting in Language Models»</a></li>
			<li><a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noreferrer">Lewis et al. (2020), «Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks»</a></li>
			<li><a href="https://modelcontextprotocol.io/" target="_blank" rel="noreferrer">Model Context Protocol: el estándar para conectar agentes con herramientas</a></li>
			<li><a href="https://genai.owasp.org/llmrisk/llm01-prompt-injection/" target="_blank" rel="noreferrer">OWASP, «LLM01: Prompt Injection»</a></li>
		</ul>
		<a class="back-home" href="/contacto">Continuar con la slide 5: contacto</a>
	</div>
</footer>
</div>

<style>
	.topic-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1.5rem 0 0; padding: 0; list-style: none; }
	.topic-list li { padding: 0.35rem 0.8rem; border: 1px solid var(--color-line); border-radius: 0.4rem; background: var(--color-surface); color: var(--color-ink); font-size: 0.95rem; font-weight: 700; }

	.lesson__text--columns { display: grid; gap: 1rem 2.5rem; }
	.lesson__text--columns > * + * { margin-top: 0; }
	@media (min-width: 1100px) {
		.lesson__text--columns { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
		.lesson__body--wide { grid-template-columns: minmax(0, 1fr) !important; }
	}
	.lesson__body + .lesson__body { margin-top: clamp(2rem, 3vw, 3rem); padding-top: clamp(2rem, 3vw, 3rem); border-top: 1px solid var(--color-line); }

	.piece-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
	.mini-card { padding: 1.1rem 1.2rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: #fbfcfe; }
	.mini-card h3 { margin: 0 0 0.35rem; color: var(--color-ink); font-size: 1.15rem; font-weight: 600; }
	.mini-card p { margin: 0; color: var(--color-muted); font-size: 0.98rem; line-height: 1.55; }
	.piece-symbol { display: block; margin-bottom: 0.4rem; font-size: 1.5rem; }

	.callout-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
	.callout-grid > div { padding: 1.1rem 1.2rem; border: 1px solid var(--color-line); border-top: 3px solid var(--color-ochre); border-radius: 0 0 0.5rem 0.5rem; background: white; }
	.callout-grid strong { color: var(--color-ink); font-family: var(--font-serif); font-size: 1.1rem; }
	.callout-grid p { margin: 0.45rem 0 0; color: var(--color-muted); font-size: 0.98rem; line-height: 1.55; }

	.result-list { display: grid; gap: 0.6rem; margin: 0; padding: 0; list-style: none; }
	.result-list li { display: grid; gap: 0.3rem; padding: 0.9rem 1.1rem; border: 1px solid var(--color-line); border-left: 4px solid #b42318; border-radius: 0 0.5rem 0.5rem 0; background: #fdf3f2; }
	.result-list li.safe { border-left-color: var(--color-accent); background: #eff8f5; }
	.result-list strong { color: var(--color-ink); font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600; }
	.result-list span { color: #2b3a55; line-height: 1.55; }

	.practice-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
	.practice-grid li { display: flex; gap: 0.9rem; align-items: flex-start; min-width: 0; padding: 1.1rem 1.2rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: #fbfcfe; }
	.practice-grid strong { color: var(--color-ink); font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600; }
	.practice-grid p { margin: 0.3rem 0 0; color: var(--color-muted); font-size: 0.98rem; line-height: 1.55; }
	.practice-number { display: grid; width: 2rem; height: 2rem; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--color-ink); color: white; font-family: var(--font-serif); font-size: 0.95rem; font-weight: 600; }

	.sources ul { display: grid; gap: 0.65rem; padding-left: 1.25rem; }
	.sources a:not(.back-home) { color: var(--color-primary); font-weight: 700; text-underline-offset: 0.18em; }
	.back-home { display: inline-block; padding: 0.75rem 1.1rem; border-radius: 0.4rem; background: var(--color-primary); color: white; font-weight: 800; text-decoration: none; }
	.back-home:hover { background: #193fa8; }

	@media (max-width: 1280px) { .practice-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 560px) {
		.piece-grid, .callout-grid, .practice-grid { grid-template-columns: 1fr; }
	}
</style>
