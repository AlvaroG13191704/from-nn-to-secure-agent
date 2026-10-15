<script lang="ts">
	import { onMount } from 'svelte';
	import DeepLearningLab from './DeepLearningLab.svelte';
	import ActivationFunctionsExplorer from '#lib/components/visualizations/ActivationFunctionsExplorer.svelte';
	import PerceptronWalkthrough from '#lib/components/visualizations/PerceptronWalkthrough.svelte';
	import NonlinearLearningDemo from '#lib/components/visualizations/NonlinearLearningDemo.svelte';

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
<header class="hero story-card">
	<p class="eyebrow">De neuronas a modelos que aprenden</p>
	<h1>¿Cómo aprende una red neuronal?</h1>
	<p class="hero-copy">Voy a conectar la inspiración biológica con las operaciones matemáticas que hacen posible el aprendizaje. Seguiremos las señales hacia adelante y luego recorreremos el camino inverso para entender cómo mejora una predicción.</p>
	<div class="hero-tags" aria-label="Temas del recorrido">
		<span>Neuronas artificiales</span><span>Redes profundas</span><span>Optimización</span>
	</div>
	<button class="motion-toggle" type="button" onclick={() => decorativeMotionPaused = !decorativeMotionPaused} disabled={reducedMotion} aria-pressed={decorativeMotionPaused}>
		{reducedMotion ? 'Movimiento reducido activado' : decorativeMotionPaused ? 'Reanudar animaciones decorativas' : 'Pausar animaciones decorativas'}
	</button>
</header>

<section class="story-card" id="inspiracion" aria-labelledby="inspiracion-title">
	<p class="eyebrow">01 · Una inspiración, no una copia</p>
	<h2 id="inspiracion-title">De una señal biológica a una idea matemática</h2>
	<p>Primero quiero distinguir la inspiración del modelo. Una neurona biológica recibe señales por sus dendritas, las integra en el soma y, si la actividad supera cierto umbral, transmite un impulso por el axón hacia otras células.</p>
	<div class="visual-panel neuron-panel">
		<svg viewBox="0 0 720 220" role="img" aria-labelledby="neuron-title neuron-desc">
			<title id="neuron-title">Esquema simplificado de una neurona</title>
			<desc id="neuron-desc">Las dendritas llegan al soma; una señal viaja por el axón hasta las terminales.</desc>
			<g class="bio-flow" fill="none" stroke="#0f766e" stroke-linecap="round" stroke-width="5">
				<path d="M160 110 C125 85 105 57 68 45 M160 110 C120 110 95 110 55 110 M160 110 C125 140 100 168 68 184 M170 100 C155 70 155 52 145 30 M170 120 C150 152 150 174 144 195" />
				<path d="M232 110 C310 110 375 110 474 110" stroke="#1d4ed8" stroke-width="12" />
				<path d="M474 110 C535 110 545 70 592 70 M474 110 C535 110 545 150 592 150" stroke="#1d4ed8" stroke-width="7" />
			</g>
			<circle cx="195" cy="110" r="38" fill="#ccfbf1" stroke="#0f766e" stroke-width="5" />
			<circle cx="195" cy="110" r="11" fill="#0f766e" />
			<g fill="#1d4ed8"><circle cx="602" cy="70" r="8"/><circle cx="610" cy="150" r="8"/><circle cx="626" cy="70" r="8"/><circle cx="634" cy="150" r="8"/></g>
			<g fill="#52627a" font-size="16" font-weight="700" text-anchor="middle"><text x="89" y="20">dendritas</text><text x="195" y="177">soma</text><text x="376" y="91">axón</text><text x="625" y="194">terminales</text></g>
		</svg>
		<p class="visual-caption">La célula real es mucho más compleja: este dibujo solo destaca el flujo de señales.</p>
	</div>
	<p>Al observar estas imágenes, quiero destacar dos ideas conectadas: una neurona individual cumple funciones relativamente simples, pero la actividad de muchas neuronas interconectadas puede dar lugar a comportamientos complejos. En algunas zonas de la corteza humana también se observan redes organizadas en capas. Esa organización nos inspira; no significa que una red artificial reproduzca la biología ni sus mecanismos.</p>
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
	<p>La neurona artificial no reproduce la biología. Toma una intuición útil —combinar señales y transformarlas— y la expresa como una operación computable.</p>
</section>

<section class="story-card glossary" id="simbolos" aria-labelledby="symbols-title">
	<p class="eyebrow">Una guía para leer las fórmulas</p>
	<h2 id="symbols-title">Antes de avanzar: ¿qué significa cada símbolo?</h2>
	<p>Voy a presentar varios símbolos nuevos. No necesitas memorizar todo de una vez: puedes volver a esta guía cuando aparezcan en las ecuaciones.</p>
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
	<p class="glossary-note">En breve: <var>∈</var> expresa “pertenece a” y <var>ℝ</var> nombra el conjunto de números reales.</p>
</section>

<section class="story-card" id="perceptron" aria-labelledby="perceptron-title">
	<p class="eyebrow">02 · La unidad básica</p>
	<h2 id="perceptron-title">El perceptrón combina entradas con pesos</h2>
	<p>Para una entrada <var>x</var>, cada peso <var>w</var> expresa cuánto influye esa característica. Sumamos los productos, añadimos el sesgo <var>b</var> y aplicamos una función de activación:</p>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the one-line equation on narrow screens.) -->
	<div class="equation equation-no-wrap" role="region" tabindex="0" aria-label="Ecuación del perceptrón en una sola línea">z = w<sub>1</sub>x<sub>1</sub> + w<sub>2</sub>x<sub>2</sub> + b = w<sup>T</sup>x + b</div>
	<PerceptronWalkthrough />
	<div class="callout-grid">
		<div><strong>El sesgo</strong><p>Desplaza la respuesta incluso cuando las entradas valen cero; ayuda a ubicar la frontera de decisión.</p></div>
		<div><strong>La activación</strong><p>Transforma <var>z</var>. La función escalón del perceptrón clásico decide entre 0 y 1; otras redes usan, por ejemplo, ReLU o sigmoide.</p></div>
	</div>
	<ActivationFunctionsExplorer />
</section>

<section class="story-card" id="mlp" aria-labelledby="mlp-title">
	<p class="eyebrow">03 · Componer capas</p>
	<h2 id="mlp-title">Un MLP convierte vectores con matrices</h2>
	<p>Una sola transformación lineal tiene límites: no puede separar todos los patrones, como XOR. Al apilar capas lineales y activaciones no lineales, el MLP construye representaciones cada vez más útiles.</p>
	<div class="visual-panel mlp-panel">
		<svg viewBox="0 0 690 260" role="img" aria-labelledby="mlp-svg-title mlp-svg-desc">
			<title id="mlp-svg-title">Red densa de entrada, capa oculta y salida</title>
			<desc id="mlp-svg-desc">Dos entradas se conectan con dos neuronas ocultas y estas con una neurona de salida.</desc>
			<g class="network-flow" fill="none" stroke="#c6d2e0" stroke-width="2"><path d="M98 75 315 80M98 75 315 180M98 185 315 80M98 185 315 180M355 80 575 130M355 180 575 130"/></g>
			<g fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"><circle cx="80" cy="75" r="25"/><circle cx="80" cy="185" r="25"/><circle cx="335" cy="80" r="25"/><circle cx="335" cy="180" r="25"/><circle cx="595" cy="130" r="28"/></g>
			<g fill="#17253a" font-size="16" font-weight="700" text-anchor="middle"><text x="80" y="81">x₁</text><text x="80" y="191">x₂</text><text x="335" y="86">h₁</text><text x="335" y="186">h₂</text><text x="595" y="136">ŷ</text></g>
			<g fill="#52627a" font-size="14" font-weight="700" text-anchor="middle"><text x="80" y="237">entrada</text><text x="335" y="250">capa oculta</text><text x="595" y="184">salida</text></g>
		</svg>
	</div>
	<div class="matrix-example">
		<div><span class="matrix-label">lote de entrada</span><code>X ∈ ℝ<sup>2×2</sup></code><small>2 muestras × 2 características</small></div>
		<span class="operator">×</span>
		<div><span class="matrix-label">pesos</span><code>W ∈ ℝ<sup>2×2</sup></code><small>2 entradas × 2 neuronas</small></div>
		<span class="operator">+</span>
		<div><span class="matrix-label">sesgo</span><code>b ∈ ℝ<sup>1×2</sup></code><small>un sesgo por neurona</small></div>
		<span class="operator">→</span>
		<div><span class="matrix-label">activación</span><code>A = φ(XW + b)</code><small>2 muestras × 2 activaciones</small></div>
	</div>
	<p class="note">La multiplicación transforma cada muestra; el sesgo se suma a cada fila del lote. La activación <var>φ</var> permite que varias capas representen relaciones no lineales. Más adelante voy a comprobarlo con diez puntos: ¿podrá una frontera recta separarlos? Primero veamos cómo aprende la red.</p>
</section>

<section class="story-card" id="arquitecturas" aria-labelledby="arquitecturas-title">
	<p class="eyebrow">04 · Elegir una estructura</p>
	<h2 id="arquitecturas-title">Distintas redes organizan las conexiones de distinta forma</h2>
	<p>Cuando digo “profunda”, me refiero a una red con varias capas ocultas. La profundidad permite construir representaciones jerárquicas, pero la estructura también depende del tipo de datos.</p>
	<details class="architecture-extension">
		<summary>Explorar después: redes densas, convolucionales (CNN) y recurrentes (RNN)</summary>
		<p>Estas estructuras amplían el panorama, pero no hacen falta para resolver el laboratorio de hoy.</p>
	<div class="architecture-grid">
		<article class="architecture-card">
			<svg viewBox="0 0 160 90" role="img" aria-label="Capas densas totalmente conectadas"><g stroke="#9baec3" stroke-width="1.5"><path d="M25 20 80 15M25 20 80 45M25 20 80 75M25 45 80 15M25 45 80 45M25 45 80 75M25 70 80 15M25 70 80 45M25 70 80 75M80 15 135 45M80 45 135 45M80 75 135 45"/></g><g fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"><circle cx="25" cy="20" r="8"/><circle cx="25" cy="45" r="8"/><circle cx="25" cy="70" r="8"/><circle cx="80" cy="15" r="8"/><circle cx="80" cy="45" r="8"/><circle cx="80" cy="75" r="8"/><circle cx="135" cy="45" r="8"/></g></svg>
			<h3>Densa</h3><p>Cada neurona recibe señales de todas las neuronas de la capa anterior. Es flexible, aunque el número de pesos puede crecer rápido.</p>
		</article>
		<article class="architecture-card">
			<svg viewBox="0 0 160 90" role="img" aria-label="Filtro local recorriendo una matriz de imagen"><rect x="20" y="10" width="76" height="70" rx="4" fill="#f5f7fa" stroke="#9baec3" stroke-width="2"/><g stroke="#c6d2e0"><path d="M39 10v70M58 10v70M77 10v70M20 27h76M20 45h76M20 62h76"/></g><rect x="39" y="27" width="38" height="35" fill="#ccfbf1" fill-opacity=".8" stroke="#0f766e" stroke-width="3"/><path d="M99 45h34" stroke="#1d4ed8" stroke-width="3"/><path d="m128 38 8 7-8 7" fill="none" stroke="#1d4ed8" stroke-width="3"/><rect x="139" y="35" width="12" height="20" rx="3" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/></svg>
			<h3>Convolucional (CNN)</h3><p>Un kernel mira regiones locales y comparte sus pesos al recorrer una imagen; así detecta patrones espaciales con menos parámetros.</p>
		</article>
		<article class="architecture-card">
			<svg viewBox="0 0 160 90" role="img" aria-label="Secuencia de estados conectados en una red recurrente"><g fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"><circle cx="35" cy="45" r="18"/><circle cx="80" cy="45" r="18"/><circle cx="125" cy="45" r="18"/></g><g fill="#17253a" font-size="12" font-weight="700" text-anchor="middle"><text x="35" y="49">h₁</text><text x="80" y="49">h₂</text><text x="125" y="49">h₃</text></g><g fill="none" stroke="#0f766e" stroke-width="2.5"><path d="M53 45h9M98 45h9M35 27V12h45v15M80 27V8h45v19"/></g></svg>
			<h3>Recurrente (RNN)</h3><p>El estado de un paso se transmite al siguiente. Esa memoria permite procesar secuencias como texto, audio o series temporales.</p>
		</article>
	</div>
	</details>
	<div class="parameter-contrast">
		<div><span class="contrast-tag learned">La red aprende</span><h3>Parámetros</h3><p>Pesos <var>W</var> y sesgos <var>b</var>: valores internos que el entrenamiento ajusta con los datos.</p></div>
		<div><span class="contrast-tag chosen">Yo configuro</span><h3>Hiperparámetros</h3><p>Número de capas y neuronas, tasa de aprendizaje y elecciones de arquitectura: decisiones previas o externas al aprendizaje de esos parámetros.</p></div>
	</div>
</section>

<section class="story-card" id="aprendizaje" aria-labelledby="aprendizaje-title">
	<p class="eyebrow">05 · Un ciclo que se repite</p>
	<h2 id="aprendizaje-title">Entrenar es repetir cuatro fases</h2>
	<p>El entrenamiento ajusta los parámetros para reducir una función de pérdida sobre ejemplos. En la práctica, procesamos lotes pequeños y repetimos este ciclo muchas veces.</p>
	<div class="phase-flow" aria-label="Cuatro fases del aprendizaje">
		{#each learningPhases as phase, index (phase.number)}
			<article class="phase-card" style={`--phase-index:${index}`}>
				<span class="phase-number">{phase.number}</span><h3>{phase.title}</h3><p>{phase.detail}</p>
			</article>
		{/each}
	</div>
	<p class="note"><strong>¿Qué se minimiza?</strong> El objetivo inmediato del optimizador es la pérdida elegida sobre los datos de entrenamiento (o el lote actual), no “la inteligencia” en abstracto. La evaluación con datos separados ayuda a comprobar si el modelo generaliza y no solo memoriza.</p>
</section>

<section class="story-card" aria-labelledby="cadena-title">
	<p class="eyebrow">06 · Cómo viaja el crédito</p>
	<h2 id="cadena-title">Seguimos la corrección por el mismo camino, pero al revés</h2>
	<p>Al predecir, la información avanza de los pesos a la predicción y después a la pérdida. Si el resultado no coincide con lo esperado, comenzamos por esa diferencia y enviamos una señal de corrección hacia atrás por las conexiones que participaron.</p>
	<div class="equation">señal para un peso = señal que vuelve × influencia de su conexión</div>
	<div class="visual-panel chain-panel">
		<svg viewBox="0 0 660 190" role="img" aria-labelledby="chain-svg-title chain-svg-desc">
			<title id="chain-svg-title">Camino de la predicción y regreso de la señal de corrección</title>
			<desc id="chain-svg-desc">La información avanza del peso a la predicción y a la pérdida. Si hay diferencia con el objetivo, la señal de corrección recorre las mismas conexiones en sentido inverso.</desc>
			<g fill="none" stroke="#9baec3" stroke-width="4"><path d="M160 75h130M380 75h130"/></g><g class="gradient-flow" fill="none" stroke="#0f766e" stroke-width="3" stroke-dasharray="7 7"><path d="M510 112H380M290 112H160"/></g>
			<g fill="#dbeafe" stroke="#1d4ed8" stroke-width="3"><rect x="75" y="44" width="85" height="62" rx="15"/><rect x="290" y="44" width="90" height="62" rx="15"/><rect x="510" y="44" width="85" height="62" rx="15"/></g>
			<g fill="#17253a" font-size="17" font-weight="700" text-anchor="middle"><text x="117" y="82">peso w</text><text x="335" y="82">predicción ŷ</text><text x="552" y="82">pérdida L</text></g>
			<g fill="#52627a" font-size="14" font-weight="700" text-anchor="middle"><text x="225" y="34">hacia adelante</text><text x="225" y="148">señal hacia atrás</text><text x="445" y="34">calcular L</text></g>
		</svg>
	</div>
	<p class="note">Multiplicar las influencias de los tramos es la idea detrás de la <strong>regla de la cadena</strong>. En cálculo se expresa con derivadas; aquí no hace falta calcularlas: seguiremos las flechas y multiplicaremos factores conocidos. La señal todavía no es un peso nuevo.</p>
</section>

<section class="story-card" aria-labelledby="backward-title">
	<p class="eyebrow">07 · La pasada hacia atrás</p>
	<h2 id="backward-title">Backpropagation reparte la señal de ajuste</h2>
	<p>Primero comparo la predicción con la respuesta esperada. Luego recorro la red en sentido inverso: cada conexión recibe una señal y la multiplica por su factor de influencia. Reutilizo esas señales hasta llegar a todos los pesos y sesgos.</p>
	<div class="backward-steps">
		<div><span>1</span><p><strong>Predigo:</strong> guardo las activaciones de la pasada hacia adelante.</p></div>
		<div><span>2</span><p><strong>Comparo:</strong> calculo la pérdida usando la respuesta esperada.</p></div>
		<div><span>3</span><p><strong>Propago:</strong> sigo las conexiones hacia atrás y calculo un factor de ajuste para cada parámetro.</p></div>
		<div><span>4</span><p><strong>Actualizo:</strong> uso esos factores para dar un paso pequeño con cada peso y sesgo.</p></div>
	</div>
	<p class="note">En matemáticas, estos factores de ajuste se llaman <strong>gradientes</strong>. Backpropagation los calcula; el descenso del gradiente es el paso posterior que los usa para actualizar la red. No son la misma operación.</p>
</section>

<section class="story-card gradient-story" id="gradiente" aria-labelledby="gradiente-title">
	<p class="eyebrow">08 · El peso baja la pérdida</p>
	<h2 id="gradiente-title">El descenso de gradiente busca el mínimo</h2>
	<p>Veámoslo con un solo peso. Para una entrada <var>x = 2</var> y una respuesta <var>y = 10</var>, la predicción es <var>ŷ = 2w</var> y usamos <var>L(w) = ½(2w − 10)²</var>. Su mínimo está en <var>w = 5</var>, donde la predicción coincide con el objetivo.</p>
	<div class="gradient-demo">
		<div class="chart-wrap">
			<svg viewBox="0 0 600 300" role="img" aria-labelledby="loss-plot-title loss-plot-desc">
				<title id="loss-plot-title">La pérdida disminuye cuando el peso avanza de 3 a 5</title>
				<desc id="loss-plot-desc">La curva L de w tiene su mínimo en 5. El punto actual se mueve hacia ese mínimo con cada paso de gradiente.</desc>
				<path d="M70 250H550M70 250V25" fill="none" stroke="#9baec3" stroke-width="2" />
				<path d={curvePath} fill="none" stroke="#1d4ed8" stroke-width="5" stroke-linecap="round" />
				<path d="M310 250V20" stroke="#0f766e" stroke-width="2" stroke-dasharray="6 7" />
				<circle cx="310" cy="250" r="7" fill="#0f766e" />
				<circle cx={pointX(weight)} cy={pointY(weight)} r="11" fill="#f97316" stroke="white" stroke-width="4" />
				<g fill="#52627a" font-size="14" font-weight="700"><text x="548" y="276">w</text><text x="25" y="30">L(w)</text><text x="302" y="276">5</text><text x="183" y="276">3</text><text x="324" y="240">mínimo</text></g>
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
	<p>Con <var>η = 0.1</var>, el gradiente inicial es <var>∂L/∂w = 4w − 20 = −8</var>. Como es negativo, restarlo aumenta el peso: <var>3 − 0.1(−8) = 3.8</var>. En cada paso la pérdida baja y el peso se acerca a 5.</p>
	<p class="note"><strong>El objetivo tiene límites:</strong> minimizar la pérdida de entrenamiento no garantiza por sí solo una buena respuesta en datos nuevos. Por eso también medimos el rendimiento en datos que no se usaron para ajustar los parámetros.</p>
</section>

<section class="story-card" id="comparacion-entrenamiento" aria-labelledby="comparacion-entrenamiento-title">
	<p class="eyebrow">09 · Reunir las piezas</p>
	<h2 id="comparacion-entrenamiento-title">Ahora veamos a una red aprender</h2>
	<p>Ya recorrimos la predicción, la pérdida, el cálculo de gradientes y la actualización de pesos. Ahora voy a repetir ese ciclo sobre diez ejemplos para comparar qué puede aprender una red con y sin activación en su capa oculta.</p>
	<NonlinearLearningDemo />
	<p class="note">La demostración de diez puntos usa una red 2 → 8 → 1 y muchas actualizaciones. En el laboratorio usaremos una red más pequeña, 2 → 2 → 1: calcularás una rama representativa y verás cómo la misma regla completa la otra antes de actualizar la red.</p>
</section>

<DeepLearningLab />

<footer class="story-card sources" aria-labelledby="fuentes-title">
	<p class="eyebrow">Para continuar</p>
	<h2 id="fuentes-title">Fuentes y materiales extra</h2>
	<p>La estructura y los ejemplos de este recorrido están <em>basados en</em> Aurélien Géron, <cite>Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow</cite>, 3.ª edición, O’Reilly, 2022. No atribuyo cada explicación como una transcripción literal del libro.</p>
	<ul>
		<li><a href="https://www.oreilly.com/library/view/hands-on-machine-learning/9781098125967/" target="_blank" rel="noreferrer">Referencia principal: libro de Aurélien Géron (O’Reilly)</a></li>
		<li><a href="https://poloclub.github.io/cnn-explainer/" target="_blank" rel="noreferrer">CNN Explainer: explora visualmente una red convolucional</a></li>
		<li><a href="https://playground.tensorflow.org/" target="_blank" rel="noreferrer">TensorFlow Playground: experimenta con redes y datos</a></li>
	</ul>
	<p class="note"><strong>Siguiente pregunta:</strong> ya construimos aprendizaje a partir de números. ¿Qué cambia cuando los datos son palabras?</p>
	<div class="controls"><a class="back-home" href="/language-models">Continuar con lenguaje y LLMs →</a><a class="back-home secondary-link" href="/">Volver a la introducción ↑</a></div>
</footer>

</div>

<style>
	.story-card { margin: 0 0 1.5rem; padding: clamp(1.25rem, 3.4vw, 3rem); border: 1px solid var(--color-line); border-radius: var(--radius-panel); background: var(--color-surface); box-shadow: var(--shadow-panel); scroll-margin-top: 5.75rem; }
	.symbol-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; margin: 1.25rem 0 0; }
	.symbol-grid > div { min-width: 0; padding: 0.8rem 0.9rem; border: 1px solid var(--color-line); border-radius: 0.8rem; background: #f8fbff; }
	.symbol-grid dt { margin-bottom: 0.35rem; color: var(--color-primary); font-weight: 800; }
	.symbol-grid dt code { font-size: 1rem; }
	.symbol-grid dd { margin: 0; color: var(--color-muted); line-height: 1.5; }
	.glossary-note { margin: 1rem 0 0; padding: 0.85rem 1rem; border-left: 4px solid var(--color-accent); background: var(--color-accent-soft); color: var(--color-ink); }
	.hero { padding-block: clamp(2rem, 6vw, 5rem); background: linear-gradient(140deg, #fff 20%, #eff6ff 100%); }
	.eyebrow { margin: 0 0 0.8rem; color: var(--color-accent); font-size: 0.82rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
	h1, h2, h3, p { margin-top: 0; }
	h1 { max-width: 17ch; margin-bottom: 1rem; color: var(--color-ink); font-size: clamp(2.4rem, 6vw, 5.2rem); line-height: 1.04; letter-spacing: -0.045em; }
	h2 { margin-bottom: 1rem; color: var(--color-ink); font-size: clamp(1.7rem, 3.5vw, 2.75rem); line-height: 1.12; letter-spacing: -0.03em; }
	h3 { margin-bottom: 0.5rem; color: var(--color-ink); font-size: 1.15rem; }
	p { max-width: 76ch; color: var(--color-muted); line-height: 1.7; }
	.hero-copy { max-width: 68ch; font-size: clamp(1.1rem, 2vw, 1.35rem); }
	.motion-toggle { margin-top: 1rem; border: 1px solid var(--color-line); border-radius: 999px; background: white; padding: .65rem .9rem; color: var(--color-ink); cursor: pointer; font: inherit; font-size: .88rem; font-weight: 750; }
	.motion-toggle:hover { border-color: var(--color-primary); color: var(--color-primary); }
	.motion-toggle:focus-visible { outline: 3px solid #99f6e4; outline-offset: 3px; }
	.motion-toggle:disabled { cursor: not-allowed; opacity: .65; }
	.hero-tags { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 1.75rem; }
	.hero-tags span { border-radius: 999px; background: var(--color-primary-soft); padding: 0.5rem 0.9rem; color: var(--color-primary); font-size: 0.9rem; font-weight: 700; }
	.visual-panel { margin: 1.5rem 0; padding: clamp(0.5rem, 2vw, 1.5rem); border: 1px solid var(--color-line); border-radius: 1.25rem; background: #fbfdff; }
	.visual-panel svg, .architecture-card svg { display: block; width: 100%; height: auto; max-height: 19rem; }
	.visual-caption { margin: 0.5rem auto 0; text-align: center; font-size: 0.9rem; }
	.neuron-panel { background: linear-gradient(135deg, #f0fdfa, #f8fbff); }
	.biological-figures { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; margin: 1.5rem 0; }
	.biological-figure { min-width: 0; margin: 0; border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 0.75rem; }
	.figure-image-scroll { overflow-x: auto; overscroll-behavior-inline: contain; border-radius: 0.5rem; }
	.figure-image-scroll:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.figure-image-scroll img { display: block; width: 100%; min-width: 38rem; height: auto; margin: 0 auto; object-fit: contain; }
	.biological-figure figcaption { margin-top: 0.7rem; color: var(--color-muted); font-size: 0.82rem; line-height: 1.5; }
	.biological-figure figcaption a { color: var(--color-primary); font-weight: 700; text-underline-offset: 0.18em; }
	.equation { margin: 1rem 0; border-left: 4px solid var(--color-accent); border-radius: 0 0.8rem 0.8rem 0; background: var(--color-accent-soft); padding: 1rem 1.25rem; color: var(--color-ink); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(1.05rem, 2.5vw, 1.5rem); font-weight: 700; overflow-wrap: anywhere; }
	.equation-no-wrap { white-space:nowrap; overflow-x:auto; overflow-wrap:normal; }
	.equation-no-wrap:focus-visible { outline:3px solid var(--color-primary); outline-offset:2px; }
	.callout-grid, .architecture-grid, .parameter-contrast { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1.5rem; }
	.callout-grid > div, .parameter-contrast > div { border: 1px solid var(--color-line); border-radius: 1rem; padding: 1.2rem; background: #fff; }
	.callout-grid strong { color: var(--color-ink); }
	.callout-grid p, .parameter-contrast p { margin: 0.4rem 0 0; font-size: 0.98rem; }
	.mlp-panel { background: linear-gradient(180deg, #fbfdff, #f5f7fa); }
	.matrix-example { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.6rem; margin: 1.5rem 0; }
	.matrix-example > div { display: grid; min-width: 9rem; gap: 0.3rem; border: 1px solid var(--color-line); border-radius: 0.9rem; background: white; padding: 0.9rem; }
	.matrix-label, .matrix-example small { color: var(--color-muted); font-size: 0.8rem; }
	.matrix-example code { color: var(--color-primary); font-size: 1.1rem; font-weight: 800; }
	.operator { color: var(--color-accent); font-size: 1.4rem; font-weight: 800; }
	.note { margin: 1.5rem 0 0; border-left: 4px solid var(--color-primary); border-radius: 0 0.8rem 0.8rem 0; background: #eff6ff; padding: 1rem 1.2rem; }
	.architecture-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	.architecture-extension { margin-top:1.3rem; padding:.9rem 1.1rem; border:1px solid var(--color-line); border-radius:.85rem; background:#f8fbff; }
	.architecture-extension summary { color:var(--color-primary); font-weight:800; cursor:pointer; }
	.architecture-extension summary:focus-visible { outline:3px solid #93c5fd; outline-offset:3px; }
	.architecture-extension > p { margin:.65rem 0 0; }
	.architecture-card { min-width: 0; border: 1px solid var(--color-line); border-radius: 1rem; padding: 1rem; }
	.architecture-card svg { height: 6rem; margin-bottom: 0.6rem; }
	.architecture-card p { margin: 0; font-size: 0.95rem; }
	.parameter-contrast > div { background: #f8fbff; }
	.contrast-tag { display: inline-block; margin-bottom: 0.8rem; border-radius: 999px; padding: 0.25rem 0.65rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
	.contrast-tag.learned { background: #ccfbf1; color: #115e59; }
	.contrast-tag.chosen { background: #dbeafe; color: #1e40af; }
	.phase-flow { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; margin: 1.6rem 0; }
	.phase-card { position: relative; border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 1.1rem; animation: phase-in 700ms both; animation-delay: calc(var(--phase-index) * 180ms); }
	.phase-card:not(:last-child)::after { position: absolute; top: 1.35rem; right: -0.9rem; z-index: 2; color: var(--color-accent); content: '→'; font-weight: 900; }
	.phase-number { display: grid; width: 2rem; height: 2rem; margin-bottom: 0.8rem; place-items: center; border-radius: 50%; background: var(--color-primary); color: white; font-size: 0.8rem; font-weight: 800; }
	.phase-card h3 { font-size: 1rem; }
	.phase-card p { margin: 0; font-size: 0.9rem; }
	.chain-panel { background: linear-gradient(180deg, #fbfdff, #f0fdfa); }
	.backward-steps { display: grid; gap: 0.7rem; margin-top: 1.5rem; }
	.backward-steps > div { display: flex; gap: 0.9rem; align-items: center; border-radius: 0.9rem; background: #f8fbff; padding: 0.9rem 1rem; }
	.backward-steps span { display: grid; width: 2rem; height: 2rem; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--color-accent-soft); color: #115e59; font-weight: 800; }
	.backward-steps p { margin: 0; }
	.gradient-story { border-color: #c7d2fe; }
	.gradient-demo { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(14rem, 0.8fr); gap: 1rem; align-items: center; margin: 1.25rem 0; }
	.chart-wrap { min-width: 0; border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 0.6rem; }
	.chart-wrap svg { width: 100%; height: auto; }
	.gradient-readout { border: 1px solid var(--color-line); border-radius: 1rem; background: #f8fbff; padding: 1.1rem; }
	.readout-label { margin-bottom: 0.7rem; color: var(--color-accent); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
	.gradient-readout > div { display: flex; justify-content: space-between; gap: 0.75rem; border-bottom: 1px solid var(--color-line); padding: 0.65rem 0; color: var(--color-muted); font-size: 0.9rem; }
	.gradient-readout strong { color: var(--color-ink); font-variant-numeric: tabular-nums; }
	.update-equation { margin: 0.8rem 0 0; color: var(--color-primary); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; font-weight: 800; }
	.controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.65rem; margin: 1rem 0 1.5rem; }
	.controls button, .back-home { border: 0; border-radius: 999px; background: var(--color-primary); padding: 0.7rem 1rem; color: white; cursor: pointer; font-size: 0.9rem; font-weight: 800; }
	.controls button:hover, .back-home:hover { background: #1e40af; }
	.controls button.secondary { border: 1px solid var(--color-line); background: white; color: var(--color-ink); }
	.controls button:disabled { cursor: not-allowed; opacity: 0.55; }
	.motion-note { color: var(--color-muted); font-size: 0.86rem; }
	.sources { margin-bottom: 0; }
	.sources ul { display: grid; gap: 0.65rem; margin: 1rem 0 1.75rem; padding-left: 1.25rem; color: var(--color-muted); }
	.sources a { color: var(--color-primary); font-weight: 700; text-underline-offset: 0.18em; }
	.back-home { display: inline-block; text-decoration: none; }
	.back-home.secondary-link { border: 1px solid var(--color-line); background: white; color: var(--color-ink); }
	.back-home.secondary-link:hover { background: var(--color-canvas); }
	@keyframes phase-in { from { opacity: 0.55; transform: translateY(0.5rem); } to { opacity: 1; transform: translateY(0); } }
	.bio-flow, .network-flow, .gradient-flow { animation: dash-flow 1.8s linear infinite; }
	.bio-flow, .network-flow { stroke-dasharray: 5 7; }
	@keyframes dash-flow { to { stroke-dashoffset: -24; } }
	.decorative-motion-paused .bio-flow,
	.decorative-motion-paused .network-flow,
	.decorative-motion-paused .gradient-flow { animation-play-state: paused !important; }
	@media (max-width: 820px) {
		.architecture-grid { grid-template-columns: 1fr; }
		.architecture-card { display: grid; grid-template-columns: minmax(6rem, 0.45fr) 1fr; column-gap: 1rem; align-items: center; }
		.architecture-card svg { grid-row: span 2; margin: 0; }
		.phase-flow { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.phase-card:nth-child(2)::after { content: ''; }
		.gradient-demo { grid-template-columns: 1fr; }
	}
	@media (max-width: 560px) {
		.story-card { border-radius: 1.15rem; }
		.symbol-grid { grid-template-columns: 1fr; }
		.callout-grid, .parameter-contrast { grid-template-columns: 1fr; }
		.phase-flow { grid-template-columns: 1fr; }
		.phase-card:not(:last-child)::after { top: auto; right: 1rem; bottom: -1.05rem; content: '↓'; }
		.phase-card:nth-child(2)::after { content: '↓'; }
		.matrix-example { justify-content: stretch; }
		.matrix-example > div { flex: 1 1 40%; }
		.operator { flex: 0 0 1.2rem; text-align: center; }
		.architecture-card { display: block; }
		.architecture-card svg { height: 5rem; margin-bottom: 0.6rem; }
	}
	@media (prefers-reduced-motion: reduce) {
		.phase-card, .bio-flow, .network-flow, .gradient-flow { animation: none; }
	}
</style>
