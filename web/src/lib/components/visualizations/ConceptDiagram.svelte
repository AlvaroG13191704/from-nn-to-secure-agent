<script lang="ts">
	type Concept = 'ia' | 'ml' | 'neural' | 'deep' | 'nlp' | 'llm' | 'agent';
	let { topic, active, reducedMotion }: { topic: Concept; active: boolean; reducedMotion: boolean } = $props();
</script>

<svg
	class={`concept-diagram ${topic}-diagram`}
	class:play={active && !reducedMotion}
	viewBox="0 0 640 240"
	preserveAspectRatio="xMidYMid meet"
	aria-hidden="true"
>
	<defs>
		<marker id={`arrow-${topic}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
			<path d="M0 0 L10 5 L0 10 Z" />
		</marker>
	</defs>
	{#if topic === 'ia'}
		<g class="node">
			<rect x="24" y="80" width="130" height="58" rx="14" />
		</g>
		<path class="edge" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M154 109 H238" />
		<g class="node">
			<circle cx="280" cy="109" r="32" />
		</g>
		<path class="edge" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M312 109 H396" />
		<g class="node">
			<rect x="396" y="80" width="138" height="58" rx="14" />
		</g>
		<g class="label"><text x="89" y="115" text-anchor="middle">Reglas</text><text x="280" y="115" text-anchor="middle">¿?</text><text x="465" y="115" text-anchor="middle">Decisión</text></g>
		<g class="label umbrella">
			<path d="M184 66 Q320 24 456 66" />
			<text x="320" y="20" text-anchor="middle">IA: el campo más amplio</text>
		</g>
	{:else if topic === 'ml'}
		<g class="node manual-rule">
			<rect x="24" y="18" width="184" height="64" rx="12" />
		</g>
		<g class="label manual-label">
			<text x="116" y="44" text-anchor="middle">Regla escrita</text>
			<text x="116" y="66" text-anchor="middle">a mano</text>
		</g>
		<path class="edge learning-transition" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M220 50 H304" />
		<g class="label data-caption">
			<text x="451" y="44" text-anchor="middle">Patrón aprendido</text>
			<text x="451" y="66" text-anchor="middle">de los datos</text>
		</g>
		<g class="node data-point">
			<circle cx="342" cy="119" r="9" /><circle cx="387" cy="99" r="9" /><circle cx="430" cy="134" r="9" />
			<circle cx="358" cy="197" r="9" /><circle cx="409" cy="213" r="9" /><circle cx="454" cy="184" r="9" />
		</g>
		<path class="edge boundary" pathLength="1" d="M314 157 H480" />
		<g class="label class-label"><text x="554" y="125" text-anchor="middle">Clase A</text><text x="554" y="198" text-anchor="middle">Clase B</text></g>
	{:else if topic === 'neural'}
		<g class="edge-group">
			<path class="edge" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M86 58 L236 108 M86 160 L236 108 M270 108 H384 M418 108 H548" />
		</g>
		<g class="node">
			<circle cx="72" cy="58" r="24" /><circle cx="72" cy="160" r="24" />
			<circle cx="254" cy="108" r="34" /><circle cx="404" cy="108" r="31" /><circle cx="568" cy="108" r="24" />
		</g>
		<g class="label">
			<text x="72" y="63" text-anchor="middle">x₁</text><text x="72" y="165" text-anchor="middle">x₂</text>
			<text x="165" y="77" text-anchor="middle">w₁</text><text x="165" y="153" text-anchor="middle">w₂</text>
			<text x="254" y="113" text-anchor="middle">Σ</text><text x="404" y="113" text-anchor="middle">σ</text>
			<text x="568" y="113" text-anchor="middle">y</text>
		</g>
		<g class="label update">
			<path d="M255 170 Q330 195 402 170" />
			<text x="333" y="220" text-anchor="middle">error → ajuste de w₁</text>
		</g>
	{:else if topic === 'deep'}
		<g class="edge-group">
			<path class="edge" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M114 64 L232 47 M114 64 L232 110 M114 156 L232 110 M114 156 L232 173 M264 47 L382 64 M264 110 L382 64 M264 110 L382 156 M264 173 L382 156 M414 64 L534 75 M414 156 L534 145" />
		</g>
		<g class="node layer-one"><circle cx="88" cy="64" r="24" /><circle cx="88" cy="156" r="24" /></g>
		<g class="node layer-two"><circle cx="248" cy="47" r="21" /><circle cx="248" cy="110" r="21" /><circle cx="248" cy="173" r="21" /></g>
		<g class="node layer-three"><circle cx="398" cy="64" r="21" /><circle cx="398" cy="156" r="21" /></g>
		<g class="node layer-four"><circle cx="558" cy="75" r="24" /><circle cx="558" cy="145" r="24" /></g>
		<g class="label"><text x="88" y="207" text-anchor="middle">Entrada</text><text x="248" y="207" text-anchor="middle">Rasgos</text><text x="398" y="207" text-anchor="middle">Patrones</text><text x="558" y="207" text-anchor="middle">Concepto</text></g>
	{:else if topic === 'nlp'}
		<g class="label sentence"><text x="320" y="33" text-anchor="middle">«Los modelos leen texto»</text></g>
		<g class="node token">
			<rect x="24" y="66" width="130" height="48" rx="12" /><rect x="174" y="66" width="130" height="48" rx="12" />
			<rect x="324" y="66" width="130" height="48" rx="12" /><rect x="474" y="66" width="142" height="48" rx="12" />
		</g>
		<g class="label token-label"><text x="89" y="96" text-anchor="middle">Los</text><text x="239" y="96" text-anchor="middle">modelos</text><text x="389" y="96" text-anchor="middle">leen</text><text x="545" y="96" text-anchor="middle">texto</text></g>
		<g class="token-edge"><path class="edge" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M89 115 V143 M239 115 V143 M389 115 V143 M545 115 V143" /></g>
		<g class="node number"><rect x="24" y="146" width="130" height="42" rx="10" /><rect x="174" y="146" width="130" height="42" rx="10" /><rect x="324" y="146" width="130" height="42" rx="10" /><rect x="474" y="146" width="142" height="42" rx="10" /></g>
		<g class="label number-label"><text x="89" y="173" text-anchor="middle">37</text><text x="239" y="173" text-anchor="middle">104</text><text x="389" y="173" text-anchor="middle">15</text><text x="545" y="173" text-anchor="middle">82</text><text x="320" y="215" text-anchor="middle">IDs ilustrativos</text></g>
	{:else if topic === 'llm'}
		<g class="node context"><rect x="20" y="78" width="174" height="70" rx="14" /></g>
		<g class="label"><text x="107" y="105" text-anchor="middle">Contexto</text><text class="context-example" x="107" y="129" text-anchor="middle">«La IA aprende de…»</text></g>
		<path class="edge probability-edge" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M194 113 H236" />
		<g class="node probabilities">
			<rect x="246" y="47" width="204" height="34" rx="9" /><rect x="246" y="94" width="204" height="34" rx="9" /><rect x="246" y="141" width="204" height="34" rx="9" />
			<rect class="probability-bar bar-one" x="246" y="47" width="146" height="34" rx="9" /><rect class="probability-bar bar-two" x="246" y="94" width="37" height="34" rx="9" /><rect class="probability-bar bar-three" x="246" y="141" width="20" height="34" rx="9" />
		</g>
		<g class="label candidate"><text x="262" y="70">datos · 72%</text><text x="262" y="117">reglas · 18%</text><text x="262" y="164">frutas · 10%</text></g>
		<path class="edge selection-edge" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M450 64 H475 V113 H498" />
		<g class="node selected"><rect x="498" y="78" width="122" height="70" rx="14" /></g>
		<g class="label selected-label"><text x="559" y="120" text-anchor="middle">datos</text><text x="320" y="203" text-anchor="middle">Probabilidades ilustrativas</text></g>
	{:else}
		<g class="edge-group">
			<path class="edge" pathLength="1" marker-end={`url(#arrow-${topic})`} d="M142 108 H202 M322 108 H382 M502 108 H522 M572 144 V190 H82 V144" />
		</g>
		<g class="node agent-step"><rect x="22" y="72" width="120" height="72" rx="14" /></g>
		<g class="node agent-step agent-tool"><rect x="202" y="72" width="120" height="72" rx="14" /></g>
		<g class="node agent-step"><rect x="382" y="72" width="120" height="72" rx="14" /></g>
		<g class="node agent-step"><rect x="522" y="72" width="100" height="72" rx="14" /></g>
		<g class="label">
			<text x="82" y="102" text-anchor="middle">Objetivo</text><text x="82" y="124" text-anchor="middle">«Investigar»</text>
			<text x="262" y="113" text-anchor="middle">Herramienta</text><text x="442" y="102" text-anchor="middle">Observación</text>
			<text x="442" y="124" text-anchor="middle">«Resultado»</text><text x="572" y="113" text-anchor="middle">Decidir</text>
		</g>
	{/if}
</svg>

<style>
	.concept-diagram {
		display: block;
		width: 100%;
		min-width: 28rem;
		max-height: 16rem;
		margin: 1.25rem auto 0;
		color: var(--color-ink);
		font: 600 17px/1.2 var(--font-sans);
		overflow: visible;
	}

	.concept-diagram rect,
	.concept-diagram circle {
		fill: var(--color-primary-soft);
		stroke: var(--color-primary);
		stroke-width: 2;
	}

	.concept-diagram text { fill: var(--color-ink); }
	.concept-diagram .edge,
	.concept-diagram .label path,
	.concept-diagram .token-edge path {
		fill: none;
		stroke: var(--color-accent);
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 3;
	}
	.concept-diagram marker path { fill: var(--color-accent); stroke: none; }

	.concept-diagram .edge { stroke-dasharray: 1; stroke-dashoffset: 0; }
	.concept-diagram .manual-rule rect { fill: var(--color-canvas); stroke: var(--color-line); }
	.concept-diagram .data-point circle:nth-child(-n + 3) { fill: var(--color-primary-soft); }
	.concept-diagram .data-point circle:nth-child(n + 4) { fill: var(--color-accent-soft); stroke: var(--color-accent); }
	.concept-diagram .boundary { stroke: var(--color-primary); stroke-width: 4; }
	.concept-diagram .umbrella path { stroke: var(--color-primary); }
	.concept-diagram.neural-diagram circle:nth-child(n + 3) { fill: var(--color-accent-soft); stroke: var(--color-accent); }
	.concept-diagram.deep-diagram .layer-two circle { fill: var(--color-accent-soft); stroke: var(--color-accent); }
	.concept-diagram.deep-diagram .layer-three circle { fill: var(--color-canvas); stroke: var(--color-primary); }
	.concept-diagram.deep-diagram .layer-four circle { fill: var(--color-primary); }
	.concept-diagram.deep-diagram .layer-four circle + circle { fill: var(--color-accent); stroke: var(--color-accent); }
	.concept-diagram .token rect { fill: var(--color-primary-soft); }
	.concept-diagram .number rect { fill: var(--color-accent-soft); stroke: var(--color-accent); }
	.concept-diagram .probabilities > rect { fill: var(--color-canvas); stroke: var(--color-line); }
	.concept-diagram .probabilities .probability-bar { fill: var(--color-primary-soft); stroke: none; }
	.concept-diagram .context-example { font-size: 14px; }
	.concept-diagram .probabilities .bar-two,
	.concept-diagram .probabilities .bar-three { fill: var(--color-primary-soft); }
	.concept-diagram .selected rect { fill: var(--color-primary); }
	.concept-diagram .selected-label text:first-child { fill: white; font-weight: 700; }
	.concept-diagram .selected-label text:last-child { fill: var(--color-muted); font-weight: 500; }
	.concept-diagram.agent-diagram .agent-tool rect { fill: var(--color-accent-soft); stroke: var(--color-accent); }

	.concept-diagram.play .node { transform-box: fill-box; transform-origin: center; animation: reveal-node 450ms ease-out both; }
	.concept-diagram.play .edge,
	.concept-diagram.play .token-edge path { animation: draw-edge 650ms ease-in-out 550ms both; }
	.concept-diagram.play .label { animation: reveal-label 350ms ease-out 1.25s both; }
	.concept-diagram.play.ia-diagram .umbrella { animation-delay: 1.8s; }
	.concept-diagram.play.ml-diagram .manual-label { animation-delay: 450ms; }
	.concept-diagram.play.ml-diagram .learning-transition { animation-delay: 850ms; }
	.concept-diagram.play.ml-diagram .data-point { animation-delay: 1.25s; }
	.concept-diagram.play.ml-diagram .boundary { animation-delay: 1.75s; }
	.concept-diagram.play.ml-diagram .data-caption { animation-delay: 1.55s; }
	.concept-diagram.play.ml-diagram .class-label { animation-delay: 2.45s; }
	.concept-diagram.play.neural-diagram .update { animation-delay: 2s; }
	.concept-diagram.play.deep-diagram .layer-two { animation-delay: 450ms; }
	.concept-diagram.play.deep-diagram .layer-three { animation-delay: 950ms; }
	.concept-diagram.play.deep-diagram .layer-four { animation-delay: 1.45s; }
	.concept-diagram.play.deep-diagram .edge { animation-delay: 1.95s; }
	.concept-diagram.play.deep-diagram .label { animation-delay: 2.15s; }
	.concept-diagram.play.nlp-diagram .number { animation-delay: 1.45s; }
	.concept-diagram.play.nlp-diagram .token-edge path { animation-delay: 1.95s; }
	.concept-diagram.play.nlp-diagram .number-label { animation-delay: 2.15s; }
	.concept-diagram.play.llm-diagram .probabilities { animation-delay: 600ms; }
	.concept-diagram.play.llm-diagram .probability-edge { animation-delay: 1.1s; }
	.concept-diagram.play.llm-diagram .selection-edge { animation-delay: 2.45s; }
	.concept-diagram.play.llm-diagram .candidate { animation-delay: 1.25s; }
	.concept-diagram.play.llm-diagram .selected { animation-delay: 1.95s; }
	.concept-diagram.play.llm-diagram .selected-label { animation-delay: 2.55s; }
	.concept-diagram.play.agent-diagram .label { animation-delay: 1.15s; }
	.concept-diagram.play.agent-diagram .agent-step:nth-of-type(2) { animation-delay: 350ms; }
	.concept-diagram.play.agent-diagram .agent-step:nth-of-type(3) { animation-delay: 700ms; }
	.concept-diagram.play.agent-diagram .agent-step:nth-of-type(4) { animation-delay: 1.05s; }
	.concept-diagram.play.agent-diagram .edge { animation-delay: 1.55s; }
	.concept-diagram.play.agent-diagram .label { animation-delay: 1.85s; }

	@keyframes reveal-node {
		from { opacity: 0.2; transform: scale(0.86); }
		to { opacity: 1; transform: scale(1); }
	}
	@keyframes draw-edge { from { stroke-dashoffset: 1; opacity: 0; } to { stroke-dashoffset: 0; opacity: 1; } }
	@keyframes reveal-label { from { opacity: 0; } to { opacity: 1; } }

	@media (max-width: 640px) {
		.concept-diagram { max-height: 10rem; font-size: 15px; }
	}
	@media (prefers-reduced-motion: reduce) {
		.concept-diagram.play .node,
		.concept-diagram.play .edge,
		.concept-diagram.play .label,
		.concept-diagram.play .token-edge path { animation: none; }
		.concept-diagram.play .edge { stroke-dashoffset: 0; }
	}
</style>
