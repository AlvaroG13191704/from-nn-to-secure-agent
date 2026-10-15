<script lang="ts">
	import { MLP_LAB_CASE, isMlpLabValueVisible, type deriveMlpLabProgress } from '#lib/domain/mlp-lab.js';

	let { progress, step, manual = false }: { progress: ReturnType<typeof deriveMlpLabProgress>; step: number; manual?: boolean } = $props();
	let zoomed = $state(false);
	const seen = (key: string, stage: number) => isMlpLabValueVisible(progress, key, stage, manual, step);
	const fmt = (value: number) => Number(value.toFixed(5)).toString();
	const showOutput = $derived(seen('prediction', 2));
	const showLoss = $derived(seen('loss', 2));
	const showOutputDelta = $derived(seen('deltaOutput', 3));
	const showHiddenDeltas = $derived(seen('deltaH1', 4) && seen('deltaH2', 4));
	const showUpdate = $derived(seen('updatedH1W1', 5) && seen('updatedOutW1', 5));
	const showSecond = $derived(seen('secondPrediction', 6) && seen('secondLoss', 6));
	const gradientItems = $derived([
		{ key: 'gradOutW1', label: 'factor v₁', value: progress.backward.output.weights[0], stage: 3 },
		{ key: 'gradOutW2', label: 'factor v₂', value: progress.backward.output.weights[1], stage: 3 },
		{ key: 'gradOutBias', label: 'factor bₒ', value: progress.backward.output.bias, stage: 3 },
		{ key: 'gradH1W1', label: 'factor w₁₁', value: progress.backward.hidden[0].weights[0], stage: 4 },
		{ key: 'gradH1W2', label: 'factor w₁₂', value: progress.backward.hidden[0].weights[1], stage: 4 },
		{ key: 'gradH1Bias', label: 'factor b₁', value: progress.backward.hidden[0].bias, stage: 4 },
		{ key: 'gradH2W1', label: 'factor w₂₁', value: progress.backward.hidden[1].weights[0], stage: 4 },
		{ key: 'gradH2W2', label: 'factor w₂₂', value: progress.backward.hidden[1].weights[1], stage: 4 },
		{ key: 'gradH2Bias', label: 'factor b₂', value: progress.backward.hidden[1].bias, stage: 4 }
	]);
</script>

<button class="diagram-size" type="button" onclick={() => zoomed = !zoomed} aria-pressed={zoomed}>{zoomed ? 'Ajustar diagrama al ancho' : 'Ampliar diagrama para leer detalles'}</button>
<!-- svelte-ignore a11y_no_noninteractive_tabindex (The region is keyboard-scrollable on narrow screens.) -->
<div class="diagram-scroll" role="region" tabindex="0" aria-label="Diagrama MLP 2 a 2 a 1, desplazable horizontalmente">
	<svg class:zoomed viewBox="0 0 1100 640" role="img" aria-labelledby="training-title training-description">
		<title id="training-title">Pasada hacia adelante y hacia atrás de una red 2, 2, 1</title>
		<desc id="training-description">Dos entradas, dos neuronas ocultas ReLU y una salida lineal. Los pesos iniciales están sobre las conexiones; las señales, los factores de ajuste y los parámetros actualizados se revelan al validar los cálculos.</desc>
		<defs>
			<marker id="mlp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#2563eb" /></marker>
			<marker id="mlp-back-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10Z" fill="#0f766e" /></marker>
		</defs>
		<text class="lane" x="42" y="42">PASADA HACIA ADELANTE · PARÁMETROS INICIALES</text>
		<g class="edges">
			<path d="M152 158 L371 158" /><path d="M146 185 L377 343" />
			<path d="M146 343 L377 185" /><path d="M152 370 L371 370" />
			<path d="M489 158 L694 242" /><path d="M489 370 L694 286" />
		</g>
		<g class="edge-labels">
			<text x="264" y="138">w₁₁ = {fmt(MLP_LAB_CASE.network.hidden[0].weights[0])}</text>
			<text x="228" y="256">w₂₁ = {fmt(MLP_LAB_CASE.network.hidden[1].weights[0])}</text>
			<text x="335" y="256">w₁₂ = {fmt(MLP_LAB_CASE.network.hidden[0].weights[1])}</text>
			<text x="264" y="399">w₂₂ = {fmt(MLP_LAB_CASE.network.hidden[1].weights[1])}</text>
			<text x="575" y="180">v₁ = {fmt(MLP_LAB_CASE.network.output.weights[0])}</text>
			<text x="575" y="364">v₂ = {fmt(MLP_LAB_CASE.network.output.weights[1])}</text>
		</g>
		<g class="node input"><circle cx="100" cy="158" r="51"/><circle cx="100" cy="370" r="51"/></g>
		<text class="node-label" x="100" y="154">x₁</text><text class="node-value" x="100" y="181">{MLP_LAB_CASE.inputs[0]}</text>
		<text class="node-label" x="100" y="366">x₂</text><text class="node-value" x="100" y="393">{MLP_LAB_CASE.inputs[1]}</text>
		<g class="node hidden-node" class:revealed={seen('aH1', 1)}><circle cx="430" cy="158" r="59"/></g>
		<g class="node hidden-node" class:revealed={seen('aH2', 1)}><circle cx="430" cy="370" r="59"/></g>
		<text class="node-label" x="430" y="136">h₁ · b₁ = {fmt(MLP_LAB_CASE.network.hidden[0].bias)}</text>
		<text class="node-value" x="430" y="160">z₁ = {seen('zH1', 1) ? fmt(progress.first.hidden[0].z) : '?'}</text>
		<text class="node-value" x="430" y="185">a₁ = {seen('aH1', 1) ? fmt(progress.first.hidden[0].activation) : '?'}</text>
		<text class="node-label" x="430" y="348">h₂ · b₂ = {fmt(MLP_LAB_CASE.network.hidden[1].bias)}</text>
		<text class="node-value" x="430" y="372">z₂ = {seen('zH2', 1) ? fmt(progress.first.hidden[1].z) : '?'}</text>
		<text class="node-value" x="430" y="397">a₂ = {seen('aH2', 1) ? fmt(progress.first.hidden[1].activation) : '?'}</text>
		<g class="node output" class:revealed={showOutput}><circle cx="755" cy="264" r="61"/></g>
		<text class="node-label" x="755" y="242">salida · bₒ = {fmt(MLP_LAB_CASE.network.output.bias)}</text>
		<text class="node-value" x="755" y="275">ŷ = {showOutput ? fmt(progress.first.prediction) : '?'}</text>
		<path class="last-edge" d="M816 264 L908 264" marker-end="url(#mlp-arrow)" />
		<rect class="target" x="918" y="205" width="153" height="118" rx="22" />
		<text class="node-label" x="994" y="236">objetivo y = {MLP_LAB_CASE.target}</text>
		<text class="node-value" x="994" y="270">L = {showLoss ? fmt(progress.first.loss) : '?'}</text>
		<text class="small-label" x="994" y="297">½(ŷ − y)²</text>
		<path class="backward" class:active={showOutputDelta} d="M946 440 L780 440" marker-end="url(#mlp-back-arrow)" />
		<path class="backward" class:active={showHiddenDeltas} d="M702 440 L490 440" marker-end="url(#mlp-back-arrow)" />
		<text class="lane back-lane" x="42" y="452">SEÑAL DE AJUSTE</text>
		<text class="back-value" x="770" y="478">salida = {showOutputDelta ? fmt(progress.backward.output.delta) : '?'}</text>
		<text class="back-value" x="449" y="478">h₁ = {showHiddenDeltas ? fmt(progress.backward.hidden[0].delta) : '?'} · h₂ = {showHiddenDeltas ? fmt(progress.backward.hidden[1].delta) : '?'}</text>
		{#if showUpdate}<rect class="result" x="44" y="514" width="1024" height="52" rx="16"/><text class="result-label" x="557" y="547">η = {MLP_LAB_CASE.learningRate} · parámetros nuevos debajo del diagrama</text>{/if}
		{#if showSecond}<rect class="second-result" x="44" y="578" width="1024" height="45" rx="14"/><text class="result-label" x="557" y="607">2.ª pasada: ŷ = {fmt(progress.second.prediction)} · L = {fmt(progress.second.loss)} · y = {MLP_LAB_CASE.target}</text>{/if}
	</svg>
</div>
<div class="gradient-grid" aria-label="Los nueve factores de ajuste de la red, calculados por el estudiante o completados con la misma regla">
	{#each gradientItems as item (item.key)}
		<span class:revealed={seen(item.key, item.stage)}>{item.label} = {seen(item.key, item.stage) ? fmt(item.value) : '?'}</span>
	{/each}
</div>
<p class="diagram-caption">Los pesos sobre las conexiones son los iniciales. Los nuevos aparecen por separado al terminar la actualización; nunca los mezcles durante el retroceso.</p>

<style>
	.diagram-scroll { overflow-x:auto; overscroll-behavior-inline:contain; border:1px solid #dbe4ee; border-radius:1rem; background:#f8fbff; }
	.diagram-scroll:focus-visible { outline:3px solid #99f6e4; outline-offset:3px; }
	svg { display:block; width:100%; height:auto; }
	svg.zoomed { min-width:1100px; }
	text { text-anchor:middle; font-family:ui-sans-serif,system-ui,sans-serif; }
	.lane { text-anchor:start; fill:#475569; font-size:19px; font-weight:850; letter-spacing:1.2px; }
	.edges path,.last-edge { fill:none; stroke:#2563eb; stroke-width:3; marker-end:url(#mlp-arrow); stroke-dasharray:1; animation:draw .6s ease-out both; }
	.edge-labels { fill:#1d4ed8; font-size:24px; font-weight:850; }
	.node circle { fill:#fff; stroke:#94a3b8; stroke-width:3; transition:fill .25s ease,stroke .25s ease; }
	.node.input circle { fill:#eff6ff; stroke:#2563eb; }
	.node.hidden-node.revealed circle { fill:#ccfbf1; stroke:#0f766e; }
	.node.output.revealed circle { fill:#dbeafe; stroke:#2563eb; }
	.node-label { fill:#334155; font-size:18px; font-weight:750; }
	.node-value { fill:#17253a; font-size:25px; font-weight:850; }
	.small-label { fill:#52627a; font-size:17px; }
	.target { fill:#fffbeb; stroke:#d97706; stroke-width:3; }
	.backward { fill:none; stroke:#0f766e; stroke-width:4; opacity:.15; }
	.backward.active { opacity:1; stroke-dasharray:1; animation:draw .6s ease-out both; }
	.back-lane,.back-value { fill:#0f766e; }
	.back-value { font-size:23px; font-weight:850; }
	.result { fill:#ffedd5; stroke:#c2410c; stroke-width:2; }
	.second-result { fill:#dbeafe; stroke:#2563eb; stroke-width:2; }
	.result-label { fill:#17253a; font-size:20px; font-weight:850; }
	.gradient-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(9rem,1fr)); gap:.45rem; margin-top:.7rem; }
	.gradient-grid span { padding:.55rem .65rem; border:1px solid #cbd5e1; border-radius:.55rem; background:#f8fafc; color:#475569; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.91rem; font-weight:750; transition:background .25s ease,border-color .25s ease; }
	.gradient-grid span.revealed { border-color:#5eead4; background:#ccfbf1; color:#115e59; }
	.diagram-size { min-height:2.4rem; margin:.15rem 0 .65rem; padding:.35rem .65rem; border:1px solid #2563eb; border-radius:.55rem; background:#fff; color:#1d4ed8; font:inherit; font-size:.88rem; font-weight:750; cursor:pointer; }
	.diagram-size:focus-visible { outline:3px solid #93c5fd; outline-offset:2px; }
	.diagram-caption { margin:.65rem 0 0; color:#52627a; font-size:.9rem; }
	@keyframes draw { from { stroke-dashoffset:1; opacity:.15; } to { stroke-dashoffset:0; opacity:1; } }
	@media (max-width:800px) { svg { min-width:950px; } }
	@media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none !important; transition:none !important; } .edges path,.last-edge,.backward.active { stroke-dashoffset:0; } }
</style>
