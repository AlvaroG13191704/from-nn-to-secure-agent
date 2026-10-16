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
<header class="hero story-card">
	<p class="eyebrow">Del modelo que responde al que actúa</p>
	<h1>¿Qué le falta a un LLM para ser un agente?</h1>
	<p class="hero-copy">En la slide anterior vimos que un LLM predice el siguiente token: responde, pero no actúa. Ahora voy a mostrar cómo lo rodeamos de herramientas, instrucciones, memoria y límites para que persiga un objetivo. A todo ese entorno se le llama <strong>harness</strong>.</p>
	<div class="hero-tags" aria-label="Temas del recorrido">
		<span>Agentes</span><span>Herramientas</span><span>Prompt engineering</span><span>Harness</span><span>Tokens y costo</span><span>RAG</span>
	</div>
</header>

<section class="story-card" id="agente" aria-labelledby="agente-title">
	<p class="eyebrow">01 · La idea</p>
	<h2 id="agente-title">¿Qué es un agente?</h2>
	<p>Un <strong>agente</strong> es un sistema en el que un modelo de lenguaje decide qué hacer para cumplir un objetivo: elige herramientas, observa sus resultados y vuelve a decidir, hasta terminar. Lo distingo así de un chatbot, que solo conversa, y de un workflow, donde una persona programó los pasos de antemano.</p>
	<div class="piece-grid">
		{#each pieces as piece, index (piece.title)}
			<article class="mini-card" style={`--card-index:${index}`}><span class="piece-symbol" aria-hidden="true">{piece.symbol}</span><h3>{piece.title}</h3><p>{piece.detail}</p></article>
		{/each}
	</div>
	<AgentClassifier />
</section>

<section class="story-card" id="ciclo" aria-labelledby="ciclo-title">
	<p class="eyebrow">02 · El ciclo</p>
	<h2 id="ciclo-title">Pensar, actuar, observar… y repetir</h2>
	<p>El corazón de un agente es un ciclo. En cada vuelta, el modelo recibe todo lo que ha pasado hasta ahora y decide una sola cosa: usar una herramienta o dar la respuesta final. Esta idea se popularizó con el nombre <strong>ReAct</strong> (razonar y actuar). Veamos una ejecución real, paso a paso.</p>
	<AgentLoopTrace />
</section>

<section class="story-card" id="herramientas" aria-labelledby="herramientas-title">
	<p class="eyebrow">03 · Herramientas</p>
	<h2 id="herramientas-title">El modelo pide; el harness ejecuta</h2>
	<p>Un modelo de lenguaje no puede abrir archivos ni consultar una base de datos: solo escribe texto. Lo que hace es escribir una <strong>petición estructurada</strong> que dice qué herramienta quiere y con qué argumentos. El programa que lo rodea revisa esa petición, ejecuta la herramienta y le devuelve el resultado como una observación.</p>
	<ToolCallAnatomy />
	<div class="callout-grid">
		<div><strong>Conexiones (MCP)</strong><p>El Model Context Protocol es un estándar para conectar agentes con herramientas y datos externos, como un puerto USB-C: una misma conexión sirve para muchos agentes.</p></div>
		<div><strong>Skills</strong><p>Paquetes de instrucciones y recursos que el agente carga solo cuando la tarea los necesita. Así no paga en tokens instrucciones que no usa.</p></div>
	</div>
</section>

<section class="story-card" id="prompts" aria-labelledby="prompts-title">
	<p class="eyebrow">04 · Prompt engineering</p>
	<h2 id="prompts-title">El prompt es la pieza más barata y más poderosa</h2>
	<p>El <strong>prompt de sistema</strong> le dice al modelo quién es, qué sabe, qué debe hacer y cómo responder. Escribirlo bien no es magia: es dar contexto y reglas claras, igual que le explicarías una tarea a una persona nueva en un trabajo.</p>
	<PromptAnatomy />
</section>

<section class="story-card" id="harness" aria-labelledby="harness-title">
	<p class="eyebrow">05 · El harness</p>
	<h2 id="harness-title">El modelo es el motor; el harness es el carro</h2>
	<p>Un motor potente no sirve sin volante, frenos ni tablero. El <strong>harness</strong> es todo el software alrededor del modelo: arma el prompt, ofrece las herramientas, valida y ejecuta sus llamadas, controla el ciclo, guarda la memoria, aplica permisos y registra lo que pasa. Herramientas como Claude Code o Cursor son harnesses; en el laboratorio vas a armar el tuyo.</p>
	<HarnessParts />
</section>

<section class="story-card" id="tokens" aria-labelledby="tokens-title">
	<p class="eyebrow">06 · Tokens, contexto y costo</p>
	<h2 id="tokens-title">Cada paso del ciclo se paga</h2>
	<p>En la slide 3 vimos la ventana de contexto. En un agente, el contexto se reenvía completo en <strong>cada paso</strong>: instrucciones, descripciones de herramientas, fragmentos recuperados y todo el historial. Por eso un agente mal diseñado puede costar diez veces más que uno bien pensado y, aun así, responder peor.</p>
	<TokenBudgetCalculator />
	<p class="note"><strong>Tu presupuesto en el laboratorio:</strong> si tu computadora usa Gemini Nano, tu agente corre gratis en tu equipo y verás el costo equivalente. Si usas Gemini Flash, tendrás {formatUsd(BUDGET_LIMITS.studentCapUsd)} para todas tus pruebas, de un fondo de {formatUsd(BUDGET_LIMITS.globalCapUsd)} para todo el taller. En nuestras pruebas, una misión bien armada costó entre $0.001 y $0.003.</p>
</section>

<section class="story-card" id="rag" aria-labelledby="rag-title">
	<p class="eyebrow">07 · RAG</p>
	<h2 id="rag-title">Darle al modelo los documentos que nunca leyó</h2>
	<p>Un LLM solo sabe lo que había en sus datos de entrenamiento. No conoce el reglamento de tu universidad ni lo que pasó ayer. <strong>RAG</strong> (generación aumentada por recuperación) busca primero los fragmentos más relevantes de tus documentos y los agrega al prompt antes de que el modelo responda.</p>
	<RagPipeline />
	<RagExplorer />
	<p class="note"><strong>Conexión con la slide 3:</strong> la búsqueda usa el mismo modelo de embeddings MiniLM y la misma similitud coseno que exploramos con palabras. Ahora cada punto es un fragmento de documento.</p>
</section>

<section class="story-card" id="guardrails" aria-labelledby="guardrails-title">
	<p class="eyebrow">08 · Guardrails</p>
	<h2 id="guardrails-title">Cuando los datos traen órdenes escondidas</h2>
	<p>Un agente lee archivos, páginas y respuestas de herramientas. Si uno de esos textos incluye una instrucción, el modelo puede confundirla con una orden de la persona usuaria. A eso se le llama <strong>prompt injection</strong> indirecta. Lo probé con Gemini 3.8 Flash: una orden obvia como «ignora tus instrucciones» la rechazó, pero una tarea que parecía rutinaria la obedeció.</p>
	<ul class="result-list">
		{#each injectionResults as item (item.setup)}
			<li class:safe={item.safe}><strong>{item.setup}</strong><span>{item.result}</span></li>
		{/each}
	</ul>
	<p class="note"><strong>La lección:</strong> la seguridad no puede depender de que el modelo se porte bien. Un buen harness trata los datos externos como no confiables y pide confirmación humana antes de cualquier acción con efectos.</p>
</section>

<section class="story-card" id="practicas" aria-labelledby="practicas-title">
	<p class="eyebrow">09 · Buenas prácticas</p>
	<h2 id="practicas-title">Ocho reglas para construir agentes</h2>
	<ol class="practice-grid">
		{#each practices as practice, index (practice.title)}
			<li style={`--card-index:${index}`}><span class="practice-number">{index + 1}</span><div><strong>{practice.title}</strong><p>{practice.detail}</p></div></li>
		{/each}
	</ol>
</section>

<section class="story-card bridge" aria-labelledby="puente-agentes-title">
	<p class="eyebrow">Lo que sigue</p>
	<h2 id="puente-agentes-title">Ahora te toca construir tu agente</h2>
	<p>En el laboratorio vas a elegir bloques (skills, herramientas, conexiones y guardrails) para resolver tres misiones con un modelo real. No gana quien use más bloques, sino quien cumpla la misión de forma segura y gastando menos tokens.</p>
	<a class="back-home" href="/device-check">¿Aún no revisas tu computadora? Hazlo aquí →</a>
</section>

<AgentLab />

<section class="story-card bridge" aria-labelledby="cierre-agentes-title">
	<p class="eyebrow">Para cerrar</p>
	<h2 id="cierre-agentes-title">De una neurona a un agente que actúa</h2>
	<p>Empezamos multiplicando entradas por pesos. Entrenamos una red, la convertimos en un modelo de lenguaje y hoy la rodeamos de herramientas, memoria y límites. El modelo es solo una pieza: lo que decide si un agente es útil y seguro es el harness que tú diseñas.</p>
</section>

<footer class="story-card sources" aria-labelledby="fuentes-agentes-title">
	<p class="eyebrow">Para continuar</p>
	<h2 id="fuentes-agentes-title">Fuentes y materiales extra</h2>
	<p>Las ejecuciones mostradas son reales (gemini-3.8-flash, grabadas el 15 de octubre de 2026). El catálogo, el reglamento y los archivos son ficticios, creados para el taller.</p>
	<ul>
		<li><a href="https://www.anthropic.com/engineering/building-effective-agents" target="_blank" rel="noreferrer">Anthropic, «Building effective agents»: workflows contra agentes y patrones prácticos</a></li>
		<li><a href="https://arxiv.org/abs/2210.03629" target="_blank" rel="noreferrer">Yao et al. (2022), «ReAct: Synergizing Reasoning and Acting in Language Models»</a></li>
		<li><a href="https://arxiv.org/abs/2005.11401" target="_blank" rel="noreferrer">Lewis et al. (2020), «Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks»</a></li>
		<li><a href="https://modelcontextprotocol.io/" target="_blank" rel="noreferrer">Model Context Protocol: el estándar para conectar agentes con herramientas</a></li>
		<li><a href="https://genai.owasp.org/llmrisk/llm01-prompt-injection/" target="_blank" rel="noreferrer">OWASP, «LLM01: Prompt Injection»</a></li>
	</ul>
	<a class="back-home" href="/">Volver a la introducción ↑</a>
</footer>
</div>

<style>
	.story-card { margin: 0 0 1.5rem; padding: clamp(1.25rem, 3.4vw, 3rem); border: 1px solid var(--color-line); border-radius: var(--radius-panel); background: var(--color-surface); box-shadow: var(--shadow-panel); scroll-margin-top: 5.75rem; }
	.hero { padding-block: clamp(2rem, 6vw, 5rem); background: linear-gradient(140deg, #fff 20%, #fff7ed 100%); }
	.eyebrow { margin: 0 0 0.8rem; color: var(--color-accent); font-size: 0.82rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
	h1, h2, h3, p { margin-top: 0; }
	h1 { max-width: 18ch; margin-bottom: 1rem; color: var(--color-ink); font-size: clamp(2.4rem, 6vw, 5.2rem); line-height: 1.04; letter-spacing: -0.045em; }
	h2 { margin-bottom: 1rem; color: var(--color-ink); font-size: clamp(1.7rem, 3.5vw, 2.75rem); line-height: 1.12; letter-spacing: -0.03em; }
	h3 { margin-bottom: 0.5rem; color: var(--color-ink); font-size: 1.15rem; }
	p { max-width: 76ch; color: var(--color-muted); line-height: 1.7; }
	.hero-copy { max-width: 68ch; font-size: clamp(1.1rem, 2vw, 1.35rem); }
	.hero-tags { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 1.75rem; }
	.hero-tags span { border-radius: 999px; background: var(--color-primary-soft); padding: 0.5rem 0.9rem; color: var(--color-primary); font-size: 0.9rem; font-weight: 700; }
	.note { margin: 1.5rem 0 0; border-left: 4px solid var(--color-primary); border-radius: 0 0.8rem 0.8rem 0; background: #eff6ff; padding: 1rem 1.2rem; }
	.piece-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; margin: 1.25rem 0 1.5rem; }
	.mini-card { border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 1rem; animation: rise-in 600ms both; animation-delay: calc(var(--card-index) * 140ms); }
	.mini-card p { margin: 0; font-size: 0.95rem; }
	.piece-symbol { display: block; margin-bottom: 0.4rem; font-size: 1.6rem; }
	.callout-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1.5rem; }
	.callout-grid > div { border: 1px solid var(--color-line); border-radius: 1rem; padding: 1.2rem; background: #fff; }
	.callout-grid strong { color: var(--color-ink); }
	.callout-grid p { margin: 0.4rem 0 0; font-size: 0.98rem; }
	.result-list { display: grid; gap: 0.6rem; margin: 1.25rem 0 0; padding: 0; list-style: none; }
	.result-list li { display: grid; gap: 0.25rem; padding: 0.85rem 1rem; border-left: 4px solid #b91c1c; border-radius: 0 0.8rem 0.8rem 0; background: #fef2f2; }
	.result-list li.safe { border-color: var(--color-accent); background: var(--color-accent-soft); }
	.result-list strong { color: var(--color-ink); }
	.result-list span { color: var(--color-muted); }
	.practice-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.8rem; margin: 1.25rem 0 0; padding: 0; list-style: none; }
	.practice-grid li { display: flex; gap: 0.9rem; align-items: flex-start; padding: 1rem; border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; animation: rise-in 600ms both; animation-delay: calc(var(--card-index) * 90ms); }
	.practice-grid strong { color: var(--color-ink); }
	.practice-grid p { margin: 0.25rem 0 0; font-size: 0.95rem; }
	.practice-number { display: grid; width: 2rem; height: 2rem; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--color-primary); color: white; font-size: 0.85rem; font-weight: 800; }
	.bridge { background: linear-gradient(140deg, #fff 30%, #eff6ff 100%); }
	.sources { margin-bottom: 0; }
	.sources ul { display: grid; gap: 0.65rem; margin: 1rem 0 1.75rem; padding-left: 1.25rem; color: var(--color-muted); }
	.sources a { color: var(--color-primary); font-weight: 700; text-underline-offset: 0.18em; }
	.back-home { display: inline-block; border-radius: 999px; background: var(--color-primary); padding: 0.7rem 1rem; color: white; font-size: 0.9rem; font-weight: 800; text-decoration: none; }
	.back-home:hover { background: #1e40af; }
	@keyframes rise-in { from { opacity: 0.4; transform: translateY(0.5rem); } to { opacity: 1; transform: translateY(0); } }
	@media (max-width: 900px) { .piece-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 640px) {
		.story-card { border-radius: 1.15rem; }
		.piece-grid, .callout-grid, .practice-grid { grid-template-columns: 1fr; }
	}
	@media (prefers-reduced-motion: reduce) { .mini-card, .practice-grid li { animation: none; } }
</style>
