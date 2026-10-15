<script lang="ts">
	let step = $state(0);
	const explanations = [
		'Las entradas son x₁ = 2 y x₂ = 3. Cada peso está sobre su conexión: todavía no hemos multiplicado.',
		'La primera conexión multiplica su entrada por su peso: 2 × 0.5 = 1.',
		'La segunda conexión hace lo mismo: 3 × 0.5 = 1.5.',
		'La neurona suma ambos productos y el sesgo b = −1.5; obtiene z = 1.',
		'Con la función escalón, z = 1 produce la salida 1.',
		'Si cambiamos solo la activación por sigmoide, la misma suma produce aproximadamente 0.731.'
	];
</script>

<div class="walkthrough" aria-label="Cálculo guiado de una neurona artificial">
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the SVG on narrow screens.) -->
	<div class="diagram-scroll" role="region" tabindex="0" aria-label="Diagrama del perceptrón; en pantallas pequeñas, desplázate horizontalmente">
		<svg viewBox="0 0 1100 340" role="img" aria-labelledby="walk-title walk-desc">
			<title id="walk-title">Entradas, pesos, suma, activación y salida</title>
			<desc id="walk-desc">{explanations[step]}</desc>
			<defs><marker id="perceptron-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#2563eb" /></marker></defs>
			<g class="links" fill="none" stroke="#94a3b8" stroke-width="3.5" marker-end="url(#perceptron-arrow)">
				<path d="M128 102 432 151"/><path d="M128 238 432 190"/>
				<path d="M629 170H714"/><path d="M870 170H956"/>
			</g>
			<g class="headings" fill="#475569" text-anchor="middle" font-size="19" font-weight="800">
				<text x="83" y="28">Entradas</text><text x="535" y="28">Suma ponderada</text><text x="793" y="28">Activación</text><text x="1017" y="101">Salida</text>
			</g>
			<g fill="#eff6ff" stroke="#2563eb" stroke-width="3.5"><circle cx="83" cy="92" r="45"/><circle cx="83" cy="247" r="45"/></g>
			<g fill="#fff" stroke="#2563eb" stroke-width="2"><rect x="218" y="108" width="133" height="40" rx="20"/><rect x="218" y="193" width="133" height="40" rx="20"/></g>
			<g class="product" class:visible={step >= 1}><rect x="211" y="50" width="177" height="42" rx="12" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/></g>
			<g class="product" class:visible={step >= 2}><rect x="211" y="242" width="177" height="42" rx="12" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/></g>
			<circle cx="535" cy="170" r="92" fill="#ccfbf1" stroke="#0f766e" stroke-width="4"/>
			<circle class="activation" class:visible={step >= 4} cx="793" cy="170" r="76" fill="#e0e7ff" stroke="#4338ca" stroke-width="4"/>
			<rect class="output" class:visible={step >= 4} x="956" y="128" width="126" height="84" rx="18" fill="#fff" stroke="#4338ca" stroke-width="3"/>
			<g class="labels" fill="#17253a" text-anchor="middle" font-weight="800">
				<text x="83" y="99">x₁ = 2</text><text x="83" y="254">x₂ = 3</text>
				<text class="weight-label" x="284" y="135">w₁ = 0.5</text><text class="weight-label" x="284" y="220">w₂ = 0.5</text>
				{#if step >= 1}<text class="product-label" x="299" y="78">2 × 0.5 = 1</text>{/if}
				{#if step >= 2}<text class="product-label" x="299" y="270">3 × 0.5 = 1.5</text>{/if}
				<text class="bias-label" x="535" y="121">b = −1.5</text>
				<text class="sigma-label" x="535" y="179">Σ</text>
				{#if step >= 3}<text class="sum-result" x="535" y="219">z = 1</text>{/if}
				<text x="793" y="154">φ(z)</text>
				{#if step === 4}<text class="function-label" x="793" y="185">escalón</text>{:else if step >= 5}<text class="function-label" x="793" y="185">sigmoide</text>{/if}
				<text class="output-label" x="1019" y="180">{step < 4 ? 'ŷ = ?' : step === 4 ? 'ŷ = 1' : 'ŷ ≈ 0.731'}</text>
			</g>
		</svg>
	</div>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The full equation is keyboard-scrollable only on narrow screens.) -->
	<div class="equation-scroll" role="region" tabindex="0" aria-label="Ecuación de la suma ponderada en una sola línea">
		<p class="equation-line">
			{#if step === 0}z = x₁w₁ + x₂w₂ + b
			{:else if step === 1}z = 1 + (3 × 0.5) − 1.5
			{:else if step === 2}z = 1 + 1.5 − 1.5
			{:else}z = (2 × 0.5) + (3 × 0.5) − 1.5 = 1{/if}
		</p>
	</div>
	<p class="explanation" aria-live="polite"><strong>Paso {step + 1} de {explanations.length}.</strong> {explanations[step]}</p>
	<div class="controls" role="group" aria-label="Controles del cálculo guiado">
		<button type="button" onclick={() => step = Math.max(0, step - 1)} disabled={step === 0}>Anterior</button>
		<button type="button" onclick={() => step = Math.min(explanations.length - 1, step + 1)} disabled={step === explanations.length - 1}>Siguiente operación</button>
		<button type="button" onclick={() => step = 0} disabled={step === 0}>Reiniciar ejemplo</button>
	</div>
	<p class="caption">Ejemplo de demostración: los valores del laboratorio son diferentes para que puedas resolverlos.</p>
</div>

<style>
	.walkthrough { margin:1.1rem 0 1.35rem; padding:clamp(.75rem,2vw,1.25rem); border:1px solid #dbe4ee; border-radius:1rem; background:#f8fbff; }
	.diagram-scroll,.equation-scroll { overflow-x:auto; overscroll-behavior-inline:contain; }
	.diagram-scroll:focus-visible,.equation-scroll:focus-visible { outline:3px solid #93c5fd; outline-offset:2px; }
	svg { display:block; width:100%; height:auto; font-family:ui-sans-serif,system-ui,sans-serif; }
	.labels { font-size:22px; }
	.weight-label { fill:#1d4ed8; font-size:18px; }
	.product-label { fill:#1e40af; font-size:18px; }
	.bias-label { fill:#115e59; font-size:23px; }
	.sigma-label { fill:#0f766e; font-size:44px; }
	.sum-result { fill:#115e59; font-size:25px; }
	.function-label { fill:#3730a3; font-size:19px; }
	.output-label { fill:#312e81; font-size:19px; }
	.product { opacity:0; transition:opacity .35s ease,filter .35s ease; }
	.activation,.output { opacity:.22; transition:opacity .35s ease,filter .35s ease; }
	.product.visible,.activation.visible,.output.visible { opacity:1; filter:drop-shadow(0 4px 5px rgb(23 37 58 / 10%)); }
	.equation-scroll { margin:.55rem 0; border-left:4px solid #0f766e; border-radius:.4rem; background:#e7faf5; }
	.equation-line { width:max-content; min-width:100%; margin:0; padding:.65rem .9rem; color:#134e4a; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:clamp(1rem,1.8vw,1.35rem); font-weight:800; white-space:nowrap; }
	.explanation { min-height:3.25rem; margin:.6rem 0; color:#24364b; font-size:clamp(1rem,1.6vw,1.25rem); line-height:1.45; }
	.controls { display:flex; flex-wrap:wrap; gap:.6rem; }
	.controls button { min-height:2.7rem; padding:.5rem .85rem; border:1px solid #1d4ed8; border-radius:.65rem; background:#1d4ed8; color:#fff; font:inherit; font-weight:750; cursor:pointer; }
	.controls button:first-child,.controls button:last-child { background:#fff; color:#1e40af; }
	.controls button:disabled { opacity:.5; cursor:not-allowed; }
	.controls button:focus-visible { outline:3px solid #93c5fd; outline-offset:2px; }
	.caption { margin:.75rem 0 0; color:#52627a; font-size:.88rem; }
	@media (max-width:700px) { svg { min-width:790px; } .explanation { min-height:5rem; } }
	@media (prefers-reduced-motion:reduce) { .product,.activation,.output { transition:none; } }
</style>

