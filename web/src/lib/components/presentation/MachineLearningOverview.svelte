<script lang="ts">
	import { onMount } from 'svelte';
	let { reducedMotion }: { active: boolean; reducedMotion: boolean } = $props();
	let overview = $state<HTMLElement>();
	const regimes = [
		{ id: 'supervised', title: 'Supervisado: aprendemos con respuestas', description: 'Entrenamos con ejemplos etiquetados. Si queremos predecir una categoría, hacemos clasificación (spam o no spam). Si queremos un número, hacemos regresión (el precio de un automóvil).', caption: 'Comparamos nuestra predicción con la etiqueta y ajustamos el modelo.' },
		{ id: 'unsupervised', title: 'No supervisado: buscamos estructura', description: 'Exploramos datos sin respuestas asignadas: agrupamos ejemplos similares, reducimos dimensiones para visualizarlos o buscamos anomalías. Los grupos descubiertos no son etiquetas dadas de antemano.', caption: 'Agrupamos por similitud, sin indicar previamente quién pertenece a cada grupo.' },
		{ id: 'semi', title: 'Semisupervisado: combinamos datos', description: 'Combinamos pocos ejemplos etiquetados con muchos sin etiquetar. Aprovechamos ambas fuentes durante el aprendizaje; no equivale a inventar respuestas correctas para todo.', caption: 'Usamos unas pocas etiquetas junto con la estructura de muchos ejemplos.' },
		{ id: 'self', title: 'Autosupervisado: creamos la tarea', description: 'Obtenemos el objetivo de los propios datos. Por ejemplo, ocultamos una parte del texto para predecirla. En los LLMs autoregresivos predecimos el siguiente token durante el preentrenamiento.', caption: 'El texto original nos proporciona la respuesta que usamos para entrenar.' }
	];
	onMount(() => {
		if (!overview || !('IntersectionObserver' in window)) return;
		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) (entry.target as HTMLElement).dataset.visible = String(entry.isIntersecting);
		}, { threshold: 0.35 });
		overview.querySelectorAll('figure').forEach((figure) => observer.observe(figure));
		return () => observer.disconnect();
	});
</script>

<div class="ml-overview" class:motion={!reducedMotion} bind:this={overview}>
	<div class="section-intro">
		<h4>Primero: ¿de dónde obtenemos la señal para aprender?</h4>
		<p>Distinguimos el <strong>tipo de entrenamiento</strong> del <strong>modelo</strong> que elegimos. Una misma red neuronal puede entrenarse de distintas maneras.</p>
	</div>
	<div class="regime-grid">
		{#each regimes as regime (regime.id)}
			<section class="regime-card" aria-labelledby={`${regime.id}-title`}>
				<h5 id={`${regime.id}-title`}>{regime.title}</h5>
				<p>{regime.description}</p>
				<figure data-visible={undefined}>
					<svg viewBox="0 0 360 170" aria-hidden="true">
						{#if regime.id === 'supervised'}
							<g class="nodes"><rect x="12" y="40" width="98" height="52" rx="12" /><rect x="143" y="40" width="92" height="52" rx="12" /><rect x="268" y="40" width="80" height="52" rx="12" /></g>
							<path class="edge" pathLength="1" d="M110 66 H143 M235 66 H268 M308 92 V123 H189 V92" />
							<g class="labels"><text x="61" y="71">Datos + y</text><text x="189" y="71">Modelo</text><text x="308" y="71">Error</text><text x="237" y="151">Ajustamos con la etiqueta y</text></g>
						{:else if regime.id === 'unsupervised' || regime.id === 'semi'}
							<g class="nodes"><circle cx="76" cy="62" r="9" /><circle cx="98" cy="87" r="9" /><circle cx="55" cy="91" r="9" /><circle cx="256" cy="61" r="9" /><circle cx="279" cy="88" r="9" /><circle cx="235" cy="94" r="9" /></g>
							<g class="groups"><ellipse cx="79" cy="78" rx="55" ry="44" /><ellipse cx="257" cy="78" rx="55" ry="44" /></g>
							<g class="labels"><text x="79" y="148">Grupo A</text><text x="257" y="148">Grupo B</text></g>
							{#if regime.id === 'semi'}<g class="labels"><text x="76" y="27">Etiqueta A</text><text x="256" y="27">Etiqueta B</text></g>{/if}
						{:else}
							<g class="nodes"><rect x="14" y="39" width="155" height="52" rx="12" /><rect x="207" y="39" width="138" height="52" rx="12" /></g>
							<path class="edge" pathLength="1" d="M169 65 H207" />
							<g class="labels"><text x="91" y="70">La IA aprende de…</text><text x="276" y="70">datos</text><text x="180" y="129">Usamos «datos» como objetivo</text><text x="180" y="154">del texto original.</text></g>
						{/if}
					</svg>
					<figcaption>{regime.caption}</figcaption>
				</figure>
			</section>
		{/each}
	</div>
	<section class="model-families" aria-labelledby="model-families-title">
		<h4 id="model-families-title">Después: ¿qué modelo o algoritmo elegimos?</h4>
		<p>Elegimos según el problema, los datos y el resultado que necesitamos; no todos los modelos son redes neuronales.</p>
		<dl>
			<div><dt>Modelos lineales</dt><dd>Relacionamos variables con pesos: regresión lineal para números y regresión logística para clasificación.</dd></div>
			<div><dt>Árboles y bosques</dt><dd>Aprendemos decisiones por ramas; con Random Forest combinamos varios árboles.</dd></div>
			<div><dt>Máquinas de soporte (SVM)</dt><dd>Buscamos una frontera que separe clases; también contamos con variantes de regresión.</dd></div>
			<div><dt>Agrupamiento y proyección</dt><dd>Con k-means o DBSCAN agrupamos; con PCA reducimos dimensiones. Son tareas diferentes.</dd></div>
			<div><dt>Redes neuronales</dt><dd>Conectamos unidades con parámetros ajustables. Será nuestro siguiente paso hacia el deep learning.</dd></div>
		</dl>
	</section>
	<section class="training" aria-labelledby="training-title">
		<h4 id="training-title">Entrenar no es lo mismo que usar el modelo</h4>
		<figure class="training-flow" data-visible={undefined}>
			<ol>
				<li><span>01 · Entrenamos</span><p>Ajustamos parámetros con datos de entrenamiento.</p></li>
				<li><span>02 · Evaluamos</span><p>Comprobamos el resultado con datos separados que no usamos para ajustar.</p></li>
				<li><span>03 · Inferimos</span><p>Aplicamos lo aprendido a una entrada nueva, sin volver a entrenar en cada consulta.</p></li>
			</ol>
			<figcaption>Si solo memorizamos los ejemplos, no necesariamente generalizamos. Por eso evaluamos antes de confiar.</figcaption>
		</figure>
	</section>
	<p class="sources">Podemos profundizar en <a href="https://developers.google.com/machine-learning/intro-to-ml/what-is-ml">Google: introducción al ML</a> y en las guías de <a href="https://scikit-learn.org/stable/supervised_learning.html">aprendizaje supervisado</a> y <a href="https://scikit-learn.org/stable/unsupervised_learning.html">no supervisado de scikit-learn</a>.</p>
</div>

<style>
	.ml-overview { margin-top: 1.75rem; display: grid; gap: 1.5rem; }
	h4 { color: var(--color-ink); font-weight: 700; font-size: 1.25rem; }
	h5 { color: var(--color-primary); font-weight: 700; font-size: 1.125rem; }
	p, dd, figcaption { color: var(--color-muted); line-height: 1.6; }
	p { margin-top: 0.65rem; }
	.regime-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
	.regime-card, .model-families, .training { padding: 1.25rem; background: var(--color-surface); border: 1px solid var(--color-line); border-radius: 1rem; }
	figure { margin: 1rem 0 0; }
	svg { display: block; width: 100%; max-height: 12rem; overflow: visible; }
	svg text { fill: var(--color-ink); text-anchor: middle; font: 600 13px var(--font-sans); }
	.nodes rect, .nodes circle { fill: var(--color-primary-soft); stroke: var(--color-primary); stroke-width: 2; }
	.edge, .groups ellipse { fill: none; stroke: var(--color-accent); stroke-width: 2; }
	.edge { stroke-dasharray: 1; stroke-dashoffset: 0; }
	.groups ellipse { stroke-dasharray: 4 4; }
	figcaption, .sources { font-size: 0.875rem; }
	dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem; }
	dl > div { border-left: 3px solid var(--color-accent); padding-left: 1rem; }
	dt { color: var(--color-ink); font-weight: 700; }
	dd { margin-top: 0.4rem; }
	ol { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
	li { padding: 1rem; border-radius: 0.75rem; background: var(--color-primary-soft); }
	li span { font-weight: 700; color: var(--color-primary); }
	.training figcaption { margin-top: 1rem; }
	a { text-decoration: underline; text-underline-offset: 3px; }
	.motion figure[data-visible='true'] .nodes { animation: reveal 450ms ease-out both; }
	.motion figure[data-visible='true'] .edge { animation: draw 700ms ease-out 550ms both; }
	.motion figure[data-visible='true'] .groups { animation: reveal 700ms ease-out 550ms both; }
	.motion figure[data-visible='true'] .labels { animation: reveal 400ms ease-out 1.3s both; }
	.motion figure[data-visible='true'] li { animation: reveal 600ms ease-out both; }
	.motion figure[data-visible='true'] li:nth-child(2) { animation-delay: 650ms; }
	.motion figure[data-visible='true'] li:nth-child(3) { animation-delay: 1.3s; }
	@keyframes reveal { from { opacity: 0.15; } to { opacity: 1; } }
	@keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
	@media (max-width: 900px) { .regime-grid, dl, ol { grid-template-columns: minmax(0, 1fr); } }
	@media (prefers-reduced-motion: reduce) { .motion figure[data-visible='true'] :is(.nodes, .edge, .groups, .labels, li) { animation: none; } }
</style>
