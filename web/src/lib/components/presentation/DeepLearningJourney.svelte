<script lang="ts">
	import { onMount } from 'svelte';
	import DeepLearningLab from './DeepLearningLab.svelte';
	import ActivationFunctionsExplorer from '#lib/components/visualizations/ActivationFunctionsExplorer.svelte';
	import PerceptronWalkthrough from '#lib/components/visualizations/PerceptronWalkthrough.svelte';
	import NonlinearLearningDemo from '#lib/components/visualizations/NonlinearLearningDemo.svelte';
	import MlpLayerWalkthrough from '#lib/components/visualizations/MlpLayerWalkthrough.svelte';
	import ChainRuleWalkthrough from '#lib/components/visualizations/ChainRuleWalkthrough.svelte';
	import BackpropWalkthrough from '#lib/components/visualizations/BackpropWalkthrough.svelte';
	import LossLandscape3D from '#lib/components/visualizations/LossLandscape3D.svelte';

	const learningPhases = [
		{ number: '01', title: 'Pasada hacia adelante', detail: 'La red transforma las entradas y produce una predicción.' },
		{ number: '02', title: 'Medir la pérdida', detail: 'Comparamos la predicción con la respuesta esperada.' },
		{ number: '03', title: 'Pasada hacia atrás', detail: 'La regla de la cadena atribuye el error a cada parámetro.' },
		{ number: '04', title: 'Actualizar parámetros', detail: 'El optimizador mueve pesos y sesgos para reducir la pérdida.' }
	];

	const curvePath = Array.from({ length: 81 }, (_, index) => {
		const weight = 1 + index * 0.1;
		const x = 70 + (weight - 1) * 60;
		const loss = 0.5 * (2 * weight - 10) ** 2;
		const y = 250 - loss * 7;
		return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
	}).join(' ');

	let weight = $state(3);
	let playing = $state(false);
	let reducedMotion = $state(false);
	let decorativeMotionPaused = $state(false);
	let intervalId: ReturnType<typeof setInterval> | undefined;
	let loss = $derived(0.5 * (2 * weight - 10) ** 2);
	let gradient = $derived(4 * weight - 20);

	function pointX(value: number) {
		return 70 + (value - 1) * 60;
	}

	function pointY(value: number) {
		return 250 - (0.5 * (2 * value - 10) ** 2) * 7;
	}

	function stopAnimation() {
		if (intervalId !== undefined) clearInterval(intervalId);
		intervalId = undefined;
		playing = false;
	}

	function step() {
		weight = Math.min(5, weight - 0.1 * gradient);
		if (Math.abs(weight - 5) < 0.005) {
			weight = 5;
			stopAnimation();
		}
	}

	function play() {
		if (playing || reducedMotion) return;
		if (weight >= 5) weight = 3;
		playing = true;
		intervalId = setInterval(step, 650);
	}

	function replay() {
		stopAnimation();
		weight = 3;
	}

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const syncMotion = () => {
			reducedMotion = preference.matches;
			if (reducedMotion) stopAnimation();
		};
		syncMotion();
		preference.addEventListener('change', syncMotion);
		return () => {
			preference.removeEventListener('change', syncMotion);
			stopAnimation();
		};
	});
</script>

<div class:decorative-motion-paused={decorativeMotionPaused} class="deep-learning-journey">
<header class="chapter-hero">
	<p class="chapter-hero__kicker">Slide 2 · De neuronas a modelos que aprenden</p>
	<h1>¿Cómo aprende una red neuronal?</h1>
	<p>Voy a conectar la inspiración biológica con las operaciones matemáticas que hacen posible el aprendizaje. Seguiremos las señales hacia adelante y luego recorreremos el camino inverso para entender cómo mejora una predicción.</p>
	<ul class="chapter-topics" aria-label="Temas del recorrido">
		<li>Neuronas artificiales</li><li>Redes profundas</li><li>Optimización</li>
	</ul>
</header>

<section class="lesson" id="inspiracion" data-lesson="Inspiración biológica" data-number="2.1" aria-labelledby="inspiracion-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.1</span><h2 id="inspiracion-title">De una señal biológica a una idea matemática</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Primero quiero distinguir la inspiración del modelo. Una neurona biológica recibe señales por sus dendritas, las integra en el soma y, si la actividad supera cierto umbral, transmite un impulso por el axón hacia otras células.</p>
		</div>
		<figure class="lesson__figure">
			<div class="visual-panel">
				<svg viewBox="0 0 720 220" role="img" aria-labelledby="neuron-title neuron-desc">
					<title id="neuron-title">Esquema simplificado de una neurona</title>
					<desc id="neuron-desc">Las dendritas llegan al soma; una señal viaja por el axón hasta las terminales.</desc>
					<g class="bio-flow" fill="none" stroke="#0f6b5e" stroke-linecap="round" stroke-width="5">
						<path d="M160 110 C125 85 105 57 68 45 M160 110 C120 110 95 110 55 110 M160 110 C125 140 100 168 68 184 M170 100 C155 70 155 52 145 30 M170 120 C150 152 150 174 144 195" />
						<path d="M232 110 C310 110 375 110 474 110" stroke="#1f4fd1" stroke-width="12" />
						<path d="M474 110 C535 110 545 70 592 70 M474 110 C535 110 545 150 592 150" stroke="#1f4fd1" stroke-width="7" />
					</g>
					<circle cx="195" cy="110" r="38" fill="#d5efe9" stroke="#0f6b5e" stroke-width="5" />
					<circle cx="195" cy="110" r="11" fill="#0f6b5e" />
					<g fill="#1f4fd1"><circle cx="602" cy="70" r="8"/><circle cx="610" cy="150" r="8"/><circle cx="626" cy="70" r="8"/><circle cx="634" cy="150" r="8"/></g>
					<g fill="#4a5873" font-size="16" font-weight="700" text-anchor="middle"><text x="89" y="20">dendritas</text><text x="195" y="177">soma</text><text x="376" y="91">axón</text><text x="625" y="194">terminales</text></g>
				</svg>
			</div>
			<button class="motion-toggle" type="button" onclick={() => decorativeMotionPaused = !decorativeMotionPaused} disabled={reducedMotion} aria-pressed={decorativeMotionPaused}>
				{reducedMotion ? 'Movimiento reducido activado' : decorativeMotionPaused ? 'Reanudar animaciones decorativas' : 'Pausar animaciones decorativas'}
			</button>
			<figcaption><b>Figura 2.1.</b> La célula real es mucho más compleja: este dibujo solo destaca el flujo de señales.</figcaption>
		</figure>
	</div>
	<div class="lesson__body lesson__body--wide">
		<div class="lesson__text">
			<p>Al observar estas imágenes, quiero destacar dos ideas conectadas: una neurona individual cumple funciones relativamente simples, pero la actividad de muchas neuronas interconectadas puede dar lugar a comportamientos complejos. En algunas zonas de la corteza humana también se observan redes organizadas en capas. Esa organización nos inspira; no significa que una red artificial reproduzca la biología ni sus mecanismos.</p>
		</div>
		<figure class="lesson__figure">
			<div class="biological-figures" aria-label="Figuras del capítulo 10 sobre neuronas biológicas y la corteza humana">
				<figure class="biological-figure">
					<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the full-width figure on narrow screens.) -->
					<div class="figure-image-scroll" role="region" tabindex="0" aria-label="Figura 10-1 completa; desplázate horizontalmente para ver los detalles o abre la imagen original">
						<a href="/images/biologic-neuron.png" target="_blank" rel="noreferrer" aria-label="Abrir la figura 10-1 en tamaño completo">
							<img src="/images/biologic-neuron.png" alt="Ilustración etiquetada de una neurona biológica con cuerpo celular, núcleo, dendritas, axón, telodendrias y terminales sinápticas." />
						</a>
					</div>
					<figcaption>Figura 10-1. Una neurona biológica. Fuente: Aurélien Géron, <cite>Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow</cite>, 3.ª ed., O’Reilly, 2022, cap. 10, fig. 10-1. <a href="https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/ch10.html" target="_blank" rel="noreferrer">Ver capítulo 10</a>. <a href="/images/biologic-neuron.png" target="_blank" rel="noreferrer">Abrir imagen a tamaño completo</a>.</figcaption>
				</figure>
				<figure class="biological-figure">
					<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the full-width figure on narrow screens.) -->
					<div class="figure-image-scroll" role="region" tabindex="0" aria-label="Figura 10-2 completa; desplázate horizontalmente para ver los detalles o abre la imagen original">
						<a href="/images/multilayer-biological-neuroal.png" target="_blank" rel="noreferrer" aria-label="Abrir la figura 10-2 en tamaño completo">
							<img src="/images/multilayer-biological-neuroal.png" alt="Imagen de múltiples capas de neuronas interconectadas en la corteza humana, identificada como una red neuronal biológica." />
						</a>
					</div>
					<figcaption>Figura 10-2. Capas de una red neuronal biológica en la corteza humana. Fuente: Aurélien Géron, <cite>Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow</cite>, 3.ª ed., O’Reilly, 2022, cap. 10, fig. 10-2. <a href="https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/ch10.html" target="_blank" rel="noreferrer">Ver capítulo 10</a>. <a href="/images/multilayer-biological-neuroal.png" target="_blank" rel="noreferrer">Abrir imagen a tamaño completo</a>.</figcaption>
				</figure>
			</div>
			<figcaption><b>Figura 2.2.</b> Una neurona biológica y las capas de neuronas de la corteza humana, tomadas del capítulo 10 de Géron.</figcaption>
		</figure>
		<div class="key-idea"><p>La neurona artificial no reproduce la biología. Toma una intuición útil —combinar señales y transformarlas— y la expresa como una operación computable.</p></div>
	</div>
</section>

<section class="lesson lesson--wide" id="simbolos" data-lesson="Símbolos" data-number="2.2" aria-labelledby="symbols-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.2</span><h2 id="symbols-title">Antes de avanzar: ¿qué significa cada símbolo?</h2></div>
	<div class="lesson__text">
		<p>Voy a presentar varios símbolos nuevos. No necesitas memorizar todo de una vez: puedes volver a esta guía cuando aparezcan en las ecuaciones.</p>
	</div>
	<dl class="symbol-grid">
		<div><dt><code>x, x₁, x₂</code></dt><dd>Una entrada o característica. Los subíndices solo distinguen una entrada de otra.</dd></div>
		<div><dt><code>w, W</code></dt><dd>Un peso, o una colección de pesos: cuánto influye cada entrada. Una mayúscula suele nombrar una matriz.</dd></div>
		<div><dt><code>b</code></dt><dd>El sesgo: un valor que se suma a la combinación de entradas y pesos.</dd></div>
		<div><dt><code>z</code></dt><dd>La suma ponderada que llega a una neurona antes de aplicar la activación.</dd></div>
		<div><dt><code>Σ</code></dt><dd>“Sigma” mayúscula indica que sumamos varios términos; por ejemplo, Σ wᵢxᵢ significa sumar cada entrada multiplicada por su peso.</dd></div>
		<div><dt><code>f(z), φ(z)</code></dt><dd>Una función de activación: transforma <var>z</var> y entrega la salida de la neurona.</dd></div>
		<div><dt><code>σ(z)</code></dt><dd>“Sigma” minúscula suele nombrar la función sigmoide, una activación que produce valores entre 0 y 1.</dd></div>
		<div><dt><code>y, ŷ</code></dt><dd><var>y</var> es la respuesta esperada; <var>ŷ</var> (“y con sombrero”) es la predicción del modelo.</dd></div>
		<div><dt><code>L</code></dt><dd>La pérdida: un número que resume cuánto se aleja la predicción de la respuesta esperada.</dd></div>
		<div><dt><code>η</code></dt><dd>“Eta”, la tasa de aprendizaje: cuánto cambia un peso en una actualización.</dd></div>
		<div><dt><code>∂L/∂w</code></dt><dd>La derivada parcial: indica cómo cambia la pérdida cuando cambia el peso, manteniendo el resto del cálculo como está.</dd></div>
		<div><dt><code>∈ ℝ</code></dt><dd><strong>x ∈ ℝ</strong> se lee “x pertenece a los reales”: x puede ser cualquier número real, como −2, 0 o 3.5.</dd></div>
		<div><dt><code>ℝ<sup>m×n</sup></code></dt><dd>Una matriz de <var>m</var> filas y <var>n</var> columnas, cuyos elementos son números reales. Por ejemplo, ℝ<sup>2×3</sup> tiene 2 filas y 3 columnas.</dd></div>
		<div><dt><code>w<sup>T</sup>, e², ½</code></dt><dd><sup>T</sup> indica transpuesta; el exponente 2 significa “al cuadrado”; ½ significa “la mitad”.</dd></div>
	</dl>
	<div class="key-idea glossary-note"><p>En breve: <var>∈</var> expresa “pertenece a” y <var>ℝ</var> nombra el conjunto de números reales.</p></div>
</section>

<section class="lesson" id="perceptron" data-lesson="El perceptrón" data-number="2.3" aria-labelledby="perceptron-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.3</span><h2 id="perceptron-title">El perceptrón combina entradas con pesos</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Para una entrada <var>x</var>, cada peso <var>w</var> expresa cuánto influye esa característica. Sumamos los productos, añadimos el sesgo <var>b</var> y aplicamos una función de activación:</p>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the one-line equation on narrow screens.) -->
			<div class="equation equation-no-wrap" role="region" tabindex="0" aria-label="Ecuación del perceptrón en una sola línea">z = w<sub>1</sub>x<sub>1</sub> + w<sub>2</sub>x<sub>2</sub> + b = w<sup>T</sup>x + b</div>
			<div class="callout-grid">
				<div><strong>El sesgo</strong><p>Desplaza la respuesta incluso cuando las entradas valen cero; ayuda a ubicar la frontera de decisión.</p></div>
				<div><strong>La activación</strong><p>Transforma <var>z</var>. La función escalón del perceptrón clásico decide entre 0 y 1; otras redes usan, por ejemplo, ReLU o sigmoide.</p></div>
			</div>
		</div>
		<figure class="lesson__figure">
			<PerceptronWalkthrough />
			<figcaption><b>Figura 2.3.</b> Cálculo guiado de una neurona artificial: entradas, pesos, suma ponderada, activación y salida.</figcaption>
		</figure>
	</div>
	<div class="lesson__body lesson__body--wide">
		<figure class="lesson__figure">
			<ActivationFunctionsExplorer />
			<figcaption><b>Figura 2.4.</b> La misma <var>z</var> transformada por distintas funciones de activación.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson" id="mlp" data-lesson="Perceptrón multicapa" data-number="2.4" aria-labelledby="mlp-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.4</span><h2 id="mlp-title">Un MLP pone varias neuronas a trabajar en equipo</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Una sola neurona solo puede trazar una frontera recta entre dos grupos. Algunos patrones no se separan con una recta: en XOR, los puntos de un mismo grupo quedan en esquinas opuestas.</p>
			<p>La solución es usar varias neuronas. Una <strong>capa oculta</strong> es un grupo de neuronas que miran las mismas entradas, cada una con sus propios pesos. La siguiente capa combina sus respuestas. Eso es un <strong>perceptrón multicapa</strong> (MLP).</p>
			<ol class="reading-steps">
				<li>Cada neurona hace el mismo cálculo de 2.3: multiplica, suma el sesgo y aplica la activación.</li>
				<li>Guardo los pesos de toda la capa en una tabla <var>W</var>: cada columna es una neurona.</li>
				<li>Así, la capa completa es una sola operación: <var>h = ReLU(x · W + b)</var>.</li>
			</ol>
			<div class="definition"><p><strong>Matriz:</strong> una tabla de números con filas y columnas. “2×3” significa 2 filas y 3 columnas.</p></div>
		</div>
		<figure class="lesson__figure">
			<MlpLayerWalkthrough />
			<figcaption><b>Figura 2.5.</b> Una capa oculta de tres neuronas, primero una por una y después como una sola multiplicación de matrices.</figcaption>
		</figure>
	</div>
	<div class="next-question"><p>¿Para qué tantas neuronas? Cada una aprende a fijarse en algo distinto, y la activación permite combinarlas en fronteras curvas. Lo comprobaremos con diez puntos en 2.11. Primero veamos cómo aprende la red.</p></div>
</section>

<section class="lesson lesson--wide" id="arquitecturas" data-lesson="Arquitecturas y parámetros" data-number="2.5" aria-labelledby="arquitecturas-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.5</span><h2 id="arquitecturas-title">Distintas redes organizan las conexiones de distinta forma</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Cuando digo “profunda”, me refiero a una red con varias capas ocultas. La profundidad permite construir representaciones jerárquicas, pero la estructura también depende del tipo de datos.</p>
		</div>
		<details class="architecture-extension">
			<summary>Explorar después: redes densas, convolucionales (CNN) y recurrentes (RNN)</summary>
			<p>Estas estructuras amplían el panorama, pero no hacen falta para resolver el laboratorio de hoy.</p>
			<figure class="lesson__figure">
				<div class="architecture-grid">
					<article class="architecture-card">
						<svg viewBox="0 0 160 90" role="img" aria-label="Capas densas totalmente conectadas"><g stroke="#9baec3" stroke-width="1.5"><path d="M25 20 80 15M25 20 80 45M25 20 80 75M25 45 80 15M25 45 80 45M25 45 80 75M25 70 80 15M25 70 80 45M25 70 80 75M80 15 135 45M80 45 135 45M80 75 135 45"/></g><g fill="#dfe7fb" stroke="#1f4fd1" stroke-width="2"><circle cx="25" cy="20" r="8"/><circle cx="25" cy="45" r="8"/><circle cx="25" cy="70" r="8"/><circle cx="80" cy="15" r="8"/><circle cx="80" cy="45" r="8"/><circle cx="80" cy="75" r="8"/><circle cx="135" cy="45" r="8"/></g></svg>
						<h3>Densa</h3><p>Cada neurona recibe señales de todas las neuronas de la capa anterior. Es flexible, aunque el número de pesos puede crecer rápido.</p>
					</article>
					<article class="architecture-card">
						<svg viewBox="0 0 160 90" role="img" aria-label="Filtro local recorriendo una matriz de imagen"><rect x="20" y="10" width="76" height="70" rx="4" fill="#f5f7fa" stroke="#9baec3" stroke-width="2"/><g stroke="#c6d2e0"><path d="M39 10v70M58 10v70M77 10v70M20 27h76M20 45h76M20 62h76"/></g><rect x="39" y="27" width="38" height="35" fill="#d5efe9" fill-opacity=".8" stroke="#0f6b5e" stroke-width="3"/><path d="M99 45h34" stroke="#1f4fd1" stroke-width="3"/><path d="m128 38 8 7-8 7" fill="none" stroke="#1f4fd1" stroke-width="3"/><rect x="139" y="35" width="12" height="20" rx="3" fill="#dfe7fb" stroke="#1f4fd1" stroke-width="2"/></svg>
						<h3>Convolucional (CNN)</h3><p>Un kernel mira regiones locales y comparte sus pesos al recorrer una imagen; así detecta patrones espaciales con menos parámetros.</p>
					</article>
					<article class="architecture-card">
						<svg viewBox="0 0 160 90" role="img" aria-label="Secuencia de estados conectados en una red recurrente"><g fill="#dfe7fb" stroke="#1f4fd1" stroke-width="2"><circle cx="35" cy="45" r="18"/><circle cx="80" cy="45" r="18"/><circle cx="125" cy="45" r="18"/></g><g fill="#14213d" font-size="12" font-weight="700" text-anchor="middle"><text x="35" y="49">h₁</text><text x="80" y="49">h₂</text><text x="125" y="49">h₃</text></g><g fill="none" stroke="#0f6b5e" stroke-width="2.5"><path d="M53 45h9M98 45h9M35 27V12h45v15M80 27V8h45v19"/></g></svg>
						<h3>Recurrente (RNN)</h3><p>El estado de un paso se transmite al siguiente. Esa memoria permite procesar secuencias como texto, audio o series temporales.</p>
					</article>
				</div>
				<figcaption><b>Figura 2.6.</b> Tres formas de conectar neuronas: densa, convolucional y recurrente.</figcaption>
			</figure>
		</details>
		<div class="parameter-contrast">
			<div class="learned"><h3>Parámetros</h3><p class="contrast-tag">La red aprende</p><p>Pesos <var>W</var> y sesgos <var>b</var>: valores internos que el entrenamiento ajusta con los datos.</p></div>
			<div class="chosen"><h3>Hiperparámetros</h3><p class="contrast-tag">Yo configuro</p><p>Número de capas y neuronas, tasa de aprendizaje y elecciones de arquitectura: decisiones previas o externas al aprendizaje de esos parámetros.</p></div>
		</div>
	</div>
</section>

<section class="lesson" id="aprendizaje" data-lesson="Las fases del entrenamiento" data-number="2.6" aria-labelledby="aprendizaje-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.6</span><h2 id="aprendizaje-title">Entrenar es repetir cuatro fases</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>El entrenamiento ajusta los parámetros para reducir una función de pérdida sobre ejemplos. En la práctica, procesamos lotes pequeños y repetimos este ciclo muchas veces.</p>
			<div class="key-idea"><p><strong>¿Qué se minimiza?</strong> El objetivo inmediato del optimizador es la pérdida elegida sobre los datos de entrenamiento (o el lote actual), no “la inteligencia” en abstracto. La evaluación con datos separados ayuda a comprobar si el modelo generaliza y no solo memoriza.</p></div>
		</div>
		<figure class="lesson__figure">
			<ol class="phase-flow" aria-label="Cuatro fases del aprendizaje">
				{#each learningPhases as phase (phase.number)}
					<li class="phase-card"><span class="phase-number">{phase.number}</span><div><h3>{phase.title}</h3><p>{phase.detail}</p></div></li>
				{/each}
			</ol>
			<figcaption><b>Figura 2.7.</b> Las cuatro fases de cada paso de entrenamiento; al terminar la cuarta, el ciclo empieza otra vez.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson" id="cadena" data-lesson="Regla de la cadena" data-number="2.7" aria-labelledby="cadena-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.7</span><h2 id="cadena-title">Seguimos la corrección por el mismo camino, pero al revés</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Al predecir, la información avanza de los pesos a la predicción y después a la pérdida. Si el resultado no coincide con lo esperado, comenzamos por esa diferencia y enviamos una señal de corrección hacia atrás por las conexiones que participaron.</p>
			<div class="equation">señal para un peso = señal que vuelve × influencia de su conexión</div>
			<div class="key-idea"><p>Multiplicar las influencias de los tramos es la idea detrás de la <strong>regla de la cadena</strong>. En cálculo se expresa con derivadas; aquí no hace falta calcularlas: seguiremos las flechas y multiplicaremos factores conocidos. La señal todavía no es un peso nuevo.</p></div>
		</div>
		<figure class="lesson__figure">
			<ChainRuleWalkthrough />
			<figcaption><b>Figura 2.8.</b> La regla de la cadena con números: avanzamos de <var>w</var> a la pérdida y regresamos multiplicando la tasa de cambio de cada tramo.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson lesson--wide" id="backpropagation" data-lesson="Backpropagation" data-number="2.8" aria-labelledby="backward-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.8</span><h2 id="backward-title">Backpropagation reparte la señal de ajuste</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Primero comparo la predicción con la respuesta esperada. Luego recorro la red en sentido inverso: cada conexión recibe una señal y la multiplica por su factor de influencia. Reutilizo esas señales hasta llegar a todos los pesos y sesgos.</p>
			<div class="key-idea"><p>En matemáticas, estos factores de ajuste se llaman <strong>gradientes</strong>. Backpropagation los calcula; el descenso del gradiente es el paso posterior que los usa para actualizar la red. No son la misma operación.</p></div>
		</div>
		<figure class="lesson__figure">
			<ol class="backward-steps">
				<li><span>1</span><p><strong>Predigo:</strong> guardo las activaciones de la pasada hacia adelante.</p></li>
				<li><span>2</span><p><strong>Comparo:</strong> calculo la pérdida usando la respuesta esperada.</p></li>
				<li><span>3</span><p><strong>Propago:</strong> sigo las conexiones hacia atrás y calculo un factor de ajuste para cada parámetro.</p></li>
				<li><span>4</span><p><strong>Actualizo:</strong> uso esos factores para dar un paso pequeño con cada peso y sesgo.</p></li>
			</ol>
			<figcaption><b>Figura 2.9.</b> Los cuatro pasos de backpropagation y la actualización que le sigue.</figcaption>
		</figure>
	</div>
	<div class="lesson__body lesson__body--wide">
		<figure class="lesson__figure">
			<BackpropWalkthrough />
			<figcaption><b>Figura 2.10.</b> Backpropagation completo en una red pequeña: cada valor aparece donde se calcula, primero hacia adelante y después hacia atrás, hasta actualizar los siete parámetros.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson" id="gradiente" data-lesson="Descenso de gradiente" data-number="2.9" aria-labelledby="gradiente-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.9</span><h2 id="gradiente-title">El descenso de gradiente busca el mínimo</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Veámoslo con un solo peso. Para una entrada <var>x = 2</var> y una respuesta <var>y = 10</var>, la predicción es <var>ŷ = 2w</var> y usamos <var>L(w) = ½(2w − 10)²</var>. Su mínimo está en <var>w = 5</var>, donde la predicción coincide con el objetivo.</p>
			<p>Con <var>η = 0.1</var>, el gradiente inicial es <var>∂L/∂w = 4w − 20 = −8</var>. Como es negativo, restarlo aumenta el peso: <var>3 − 0.1(−8) = 3.8</var>. En cada paso la pérdida baja y el peso se acerca a 5.</p>
			<div class="key-idea"><p><strong>El objetivo tiene límites:</strong> minimizar la pérdida de entrenamiento no garantiza por sí solo una buena respuesta en datos nuevos. Por eso también medimos el rendimiento en datos que no se usaron para ajustar los parámetros.</p></div>
		</div>
		<figure class="lesson__figure lesson__figure--sticky">
			<div class="gradient-demo">
				<div class="chart-wrap">
					<svg viewBox="0 0 600 300" role="img" aria-labelledby="loss-plot-title loss-plot-desc">
						<title id="loss-plot-title">La pérdida disminuye cuando el peso avanza de 3 a 5</title>
						<desc id="loss-plot-desc">La curva L de w tiene su mínimo en 5. El punto actual se mueve hacia ese mínimo con cada paso de gradiente.</desc>
						<path d="M70 250H550M70 250V25" fill="none" stroke="#9baec3" stroke-width="2" />
						<path d={curvePath} fill="none" stroke="#1f4fd1" stroke-width="5" stroke-linecap="round" />
						<path d="M310 250V20" stroke="#0f6b5e" stroke-width="2" stroke-dasharray="6 7" />
						<circle cx="310" cy="250" r="7" fill="#0f6b5e" />
						<circle cx={pointX(weight)} cy={pointY(weight)} r="11" fill="#b7791f" stroke="white" stroke-width="4" />
						<g fill="#4a5873" font-size="14" font-weight="700"><text x="548" y="276">w</text><text x="25" y="30">L(w)</text><text x="302" y="276">5</text><text x="183" y="276">3</text><text x="324" y="240">mínimo</text></g>
					</svg>
				</div>
				<div class="gradient-readout" aria-live="polite" aria-atomic="true">
					<p class="readout-label">Estado del paso</p>
					<div><span>Peso w</span><strong>{weight.toFixed(3)}</strong></div>
					<div><span>Gradiente ∂L/∂w</span><strong>{gradient.toFixed(3)}</strong></div>
					<div><span>Pérdida L(w)</span><strong>{loss.toFixed(3)}</strong></div>
					<p class="update-equation">w<sub>nuevo</sub> = w − 0.1 · ∂L/∂w</p>
				</div>
			</div>
			<div class="controls" role="group" aria-label="Controles de la animación de descenso de gradiente">
				<button type="button" onclick={playing ? stopAnimation : play} aria-pressed={playing} disabled={reducedMotion && !playing}>{playing ? 'Pausar' : 'Continuar'}</button>
				<button type="button" class="secondary" onclick={step} disabled={weight >= 5}>Un paso</button>
				<button type="button" class="secondary" onclick={replay}>Repetir desde w = 3</button>
				<span class="motion-note">{reducedMotion ? 'Movimiento reducido: usa “Un paso” o “Repetir desde w = 3”.' : 'La animación solo avanza cuando eliges continuar.'}</span>
			</div>
			<figcaption><b>Figura 2.11.</b> Un solo peso baja por la curva de pérdida hacia el mínimo en <var>w = 5</var>.</figcaption>
		</figure>
	</div>
</section>

<section class="lesson lesson--wide" id="muchas-dimensiones" data-lesson="Descenso en muchas dimensiones" data-number="2.10" aria-labelledby="muchas-dimensiones-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.10</span><h2 id="muchas-dimensiones-title">Con más pesos, la curva se vuelve un paisaje</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Con un solo peso, la pérdida era una curva. Si la red tiene dos pesos, <var>a</var> y <var>b</var>, la pérdida es una superficie: el piso son los valores de los pesos y la altura es la pérdida. Una red real tiene millones de pesos; no podemos dibujarlos, pero la idea es la misma.</p>
			<p>Este paisaje no es un tazón perfecto: tiene un valle profundo, un valle local menos profundo y pequeños baches. El gradiente solo ve la pendiente bajo nuestros pies, así que el camino depende de dónde empezamos y de cómo damos cada paso.</p>
		</div>
		<div class="key-idea"><p><strong>Todos usan la misma regla</strong> <var>peso<sub>nuevo</sub> = peso − η · gradiente</var>. Lo que cambia entre los tipos de descenso es <strong>con cuántos ejemplos</strong> calculo el gradiente y <strong>si recuerdo los pasos anteriores</strong>.</p></div>
	</div>
	<div class="lesson__body lesson__body--wide">
		<figure class="lesson__figure">
			<LossLandscape3D />
			<figcaption><b>Figura 2.12.</b> Superficie de pérdida de dos pesos, calculada como el promedio de ocho ejemplos. Cada color de camino es un tipo de descenso de gradiente que parte del mismo punto.</figcaption>
		</figure>
	</div>
	<div class="next-question"><p>Desde el punto 1, el descenso por lotes se queda en el valle local, mientras que el ruido de SGD y la inercia de momentum llegan al valle profundo. Cambia al punto 2 o pide una nueva tirada: ningún optimizador gana siempre.</p></div>
</section>

<section class="lesson lesson--wide" id="comparacion-entrenamiento" data-lesson="Una red aprende" data-number="2.11" aria-labelledby="comparacion-entrenamiento-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.11</span><h2 id="comparacion-entrenamiento-title">Ahora veamos a una red aprender</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Ya recorrimos la predicción, la pérdida, el cálculo de gradientes y la actualización de pesos. Ahora voy a repetir ese ciclo sobre diez ejemplos para comparar qué puede aprender una red con y sin activación en su capa oculta.</p>
		</div>
		<figure class="lesson__figure">
			<NonlinearLearningDemo />
			<figcaption><b>Figura 2.13.</b> La misma red entrenada sobre diez puntos, con y sin activación en su capa oculta.</figcaption>
		</figure>
		<div class="next-question"><p>La demostración de diez puntos usa una red 2 → 8 → 1 y muchas actualizaciones. En el laboratorio usaremos una red más pequeña, 2 → 2 → 1: calcularás una rama representativa y verás cómo la misma regla completa la otra antes de actualizar la red.</p></div>
	</div>
</section>

<section class="lesson lesson--bare" id="laboratorio" data-lesson="Laboratorio: entrena a mano" data-number="2.12" aria-label="Laboratorio: entrena a mano una red 2 → 2 → 1">
	<DeepLearningLab />
</section>

<footer class="lesson lesson--closing sources" aria-labelledby="fuentes-title">
	<h2 id="fuentes-title">Fuentes y materiales extra</h2>
	<div class="lesson__text">
		<p>La estructura y los ejemplos de este recorrido están <em>basados en</em> Aurélien Géron, <cite>Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow</cite>, 3.ª edición, O’Reilly, 2022. No atribuyo cada explicación como una transcripción literal del libro.</p>
		<ul>
			<li><a href="https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/" target="_blank" rel="noreferrer">Referencia principal: libro de Aurélien Géron (O’Reilly)</a></li>
			<li><a href="https://poloclub.github.io/cnn-explainer/" target="_blank" rel="noreferrer">CNN Explainer: explora visualmente una red convolucional</a></li>
			<li><a href="https://playground.tensorflow.org/" target="_blank" rel="noreferrer">TensorFlow Playground: experimenta con redes y datos</a></li>
		</ul>
		<div class="next-question"><p><strong>Siguiente pregunta:</strong> ya construimos aprendizaje a partir de números. ¿Qué cambia cuando los datos son palabras?</p></div>
		<div class="closing-links"><a class="back-home" href="/language-models">Continuar con lenguaje y LLMs</a><a class="back-home secondary-link" href="/">Volver a la introducción</a></div>
	</div>
</footer>

</div>

<style>
	.chapter-topics { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin: 1.5rem 0 0; padding: 0; list-style: none; color: var(--color-muted); font-size: 1rem; }
	.chapter-topics li { padding-left: 0.75rem; border-left: 2px solid var(--color-line); }

	h3 { margin: 0 0 0.4rem; color: var(--color-ink); font-family: var(--font-serif); font-size: 1.15rem; font-weight: 600; }
	.lesson__body + .lesson__body { margin-top: clamp(2rem, 3vw, 3rem); padding-top: clamp(2rem, 3vw, 3rem); border-top: 1px solid var(--color-line); }
	@media (min-width: 1100px) { .lesson__body--wide { grid-template-columns: minmax(0, 1fr) !important; } }
	.lesson--wide > .lesson__text, .lesson--wide > .symbol-grid { margin-bottom: 1.5rem; }

	.visual-panel { padding: clamp(0.5rem, 1.5vw, 1.25rem); border: 1px solid var(--color-line); border-radius: 0.5rem; background: #fbfcfe; }
	.visual-panel svg, .architecture-card svg { display: block; width: 100%; height: auto; max-height: 19rem; }
	.motion-toggle { margin-top: 0.75rem; padding: 0.55rem 0.9rem; border: 1px solid var(--color-line); border-radius: 0.4rem; background: white; color: var(--color-ink); cursor: pointer; font: inherit; font-size: 0.9rem; font-weight: 700; }
	.motion-toggle:hover { border-color: var(--color-primary); color: var(--color-primary); }
	.motion-toggle:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.motion-toggle:disabled { cursor: not-allowed; opacity: 0.65; }

	.biological-figures { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; }
	.biological-figure { min-width: 0; margin: 0; padding: 0.75rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: #fbfcfe; }
	/* position: relative keeps any absolutely positioned descendants inside the scroll area. */
	.figure-image-scroll { position: relative; overflow-x: auto; overscroll-behavior-inline: contain; border-radius: 0.4rem; }
	.figure-image-scroll:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.figure-image-scroll img { display: block; width: 100%; min-width: 38rem; height: auto; margin: 0 auto; object-fit: contain; }
	.biological-figure figcaption { margin-top: 0.7rem; color: var(--color-muted); font-size: 0.85rem; line-height: 1.5; }
	.biological-figure figcaption a, .lesson__figure figcaption a { color: var(--color-primary); font-weight: 700; text-underline-offset: 0.18em; }
	@media (min-width: 1100px) {
		.biological-figures { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
		.figure-image-scroll img { min-width: 0; }
	}

	.symbol-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; margin: 0; }
	.symbol-grid > div { min-width: 0; padding: 0.9rem 1rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: #fbfcfe; }
	.symbol-grid dt { margin-bottom: 0.35rem; color: var(--color-primary); font-weight: 800; }
	.symbol-grid dt code { font-size: 1.05rem; }
	.symbol-grid dd { margin: 0; color: var(--color-muted); line-height: 1.55; }

	.equation { padding: 0.9rem 1.2rem; border-left: 4px solid var(--color-accent); background: var(--color-accent-soft); color: var(--color-ink); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(1.05rem, 1.6vw, 1.5rem); font-weight: 700; overflow-wrap: anywhere; }
	.equation-no-wrap { overflow-x: auto; overflow-wrap: normal; white-space: nowrap; }
	.equation-no-wrap:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 2px; }

	.callout-grid { display: grid; gap: 0.75rem; }
	.callout-grid > div { padding: 1rem 1.15rem; border: 1px solid var(--color-line); border-top: 3px solid var(--color-ochre); border-radius: 0 0 0.5rem 0.5rem; background: white; }
	.callout-grid strong { color: var(--color-ink); font-family: var(--font-serif); font-size: 1.1rem; }
	.callout-grid p { margin: 0.4rem 0 0; color: var(--color-muted); font-size: 0.98rem; line-height: 1.55; }


	.architecture-extension { margin-top: 1.5rem; padding: 0.9rem 1.1rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: #fbfcfe; }
	.architecture-extension summary { color: var(--color-primary); font-weight: 800; cursor: pointer; }
	.architecture-extension summary:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.architecture-extension > p { margin: 0.65rem 0 1rem; color: var(--color-muted); }
	.architecture-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
	.architecture-card { min-width: 0; padding: 1rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: white; }
	.architecture-card svg { height: 6rem; margin-bottom: 0.6rem; }
	.architecture-card p { margin: 0; color: var(--color-muted); font-size: 0.98rem; line-height: 1.55; }

	.parameter-contrast { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; margin-top: 1.5rem; }
	.parameter-contrast > div { padding: 1.1rem 1.2rem; border: 1px solid var(--color-line); border-top: 3px solid var(--color-accent); border-radius: 0 0 0.5rem 0.5rem; background: white; }
	.parameter-contrast > div.chosen { border-top-color: var(--color-primary); }
	.parameter-contrast p { margin: 0.4rem 0 0; color: var(--color-muted); font-size: 0.98rem; line-height: 1.55; }
	.parameter-contrast .contrast-tag { margin: 0; color: var(--color-accent); font-size: 0.95rem; font-weight: 700; }
	.parameter-contrast .chosen .contrast-tag { color: var(--color-primary); }

	.phase-flow { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; border-left: 2px solid var(--color-line); }
	.phase-card { display: flex; gap: 0.9rem; align-items: flex-start; padding: 0.8rem 0 0.8rem 1rem; }
	.phase-card h3 { margin-bottom: 0.2rem; }
	.phase-card p { margin: 0; color: var(--color-muted); font-size: 0.98rem; line-height: 1.55; }
	.phase-number { display: grid; width: 2rem; height: 2rem; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--color-ink); color: white; font-family: var(--font-serif); font-size: 0.85rem; font-weight: 600; }

	.backward-steps { display: grid; gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
	.backward-steps li { display: flex; gap: 0.9rem; align-items: center; padding: 0.8rem 1rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: #fbfcfe; }
	.backward-steps span { display: grid; width: 2rem; height: 2rem; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--color-ink); color: white; font-family: var(--font-serif); font-weight: 600; }
	.backward-steps p { margin: 0; color: #2b3a55; line-height: 1.55; }
	.backward-steps strong { color: var(--color-ink); }

	.gradient-demo { display: grid; gap: 0.75rem; }
	.chart-wrap { min-width: 0; padding: 0.6rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: #fbfcfe; }
	.chart-wrap svg { display: block; width: 100%; height: auto; }
	.gradient-readout { min-width: 0; padding: 1rem 1.1rem; border: 1px solid var(--color-line); border-radius: 0.5rem; background: white; }
	.readout-label { margin: 0 0 0.5rem; color: var(--color-ink); font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600; }
	.gradient-readout > div { display: flex; justify-content: space-between; gap: 0.75rem; padding: 0.55rem 0; border-bottom: 1px solid var(--color-line); color: var(--color-muted); font-size: 0.95rem; }
	.gradient-readout strong { color: var(--color-ink); font-variant-numeric: tabular-nums; }
	.update-equation { margin: 0.8rem 0 0; color: var(--color-primary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9rem; font-weight: 800; }
	@media (min-width: 1500px) { .gradient-demo { grid-template-columns: minmax(0, 1.6fr) minmax(13rem, 0.8fr); align-items: center; } }

	.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin-top: 0.9rem; }
	.controls button, .back-home { display: inline-block; padding: 0.7rem 1.05rem; border: 0; border-radius: 0.4rem; background: var(--color-primary); color: white; cursor: pointer; font: inherit; font-size: 0.95rem; font-weight: 800; text-decoration: none; }
	.controls button:hover, .back-home:hover { background: #193fa8; }
	.controls button:focus-visible, .back-home:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.controls button.secondary, .back-home.secondary-link { border: 1px solid var(--color-line); background: white; color: var(--color-ink); }
	.controls button.secondary:hover, .back-home.secondary-link:hover { border-color: var(--color-primary); background: white; color: var(--color-primary); }
	.controls button:disabled { cursor: not-allowed; opacity: 0.55; }
	.motion-note { color: var(--color-muted); font-size: 0.9rem; }

	.lesson--wide .next-question { margin-top: 0; }
	.sources ul { display: grid; gap: 0.65rem; padding-left: 1.25rem; }
	.sources a:not(.back-home) { color: var(--color-primary); font-weight: 700; text-underline-offset: 0.18em; }
	.closing-links { display: flex; flex-wrap: wrap; gap: 0.6rem; }

	.reading-steps { display: grid; gap: 0.45rem; margin: 1rem 0; padding-left: 1.4rem; line-height: 1.5; list-style: decimal; }
	.reading-steps li::marker { color: var(--color-primary); font-family: var(--font-serif); font-weight: 600; }
	.bio-flow { animation: dash-flow 1.8s linear infinite; stroke-dasharray: 5 7; }
	@keyframes dash-flow { to { stroke-dashoffset: -24; } }
	.decorative-motion-paused .bio-flow { animation-play-state: paused !important; }

	@media (max-width: 900px) {
		.symbol-grid, .architecture-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
	@media (max-width: 560px) {
		.symbol-grid, .architecture-grid, .parameter-contrast { grid-template-columns: 1fr; }
	}
	@media (prefers-reduced-motion: reduce) {
		.bio-flow { animation: none; }
	}
</style>
