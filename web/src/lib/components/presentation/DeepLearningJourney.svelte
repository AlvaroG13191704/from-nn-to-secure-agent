<script lang="ts">
	import { onMount } from 'svelte';
	import DeepLearningLab from './DeepLearningLab.svelte';
	import ActivationFunctionsExplorer from '#lib/components/visualizations/ActivationFunctionsExplorer.svelte';
	import PerceptronWalkthrough from '#lib/components/visualizations/PerceptronWalkthrough.svelte';
	import NonlinearLearningDemo from '#lib/components/visualizations/NonlinearLearningDemo.svelte';
	import MlpLayerWalkthrough from '#lib/components/visualizations/MlpLayerWalkthrough.svelte';
	import GradientDescent1D from '#lib/components/visualizations/GradientDescent1D.svelte';
	import BackpropWalkthrough from '#lib/components/visualizations/BackpropWalkthrough.svelte';
	import LossLandscape3D from '#lib/components/visualizations/LossLandscape3D.svelte';

	const learningPhases = [
		{ number: '01', title: 'Pasada hacia adelante', detail: 'La red transforma las entradas y produce una predicción.' },
		{ number: '02', title: 'Medir la pérdida', detail: 'Comparamos la predicción con la respuesta esperada.' },
		{ number: '03', title: 'Pasada hacia atrás', detail: 'La señal de error regresa por la red y le asigna a cada parámetro su parte de la corrección.' },
		{ number: '04', title: 'Actualizar parámetros', detail: 'El optimizador mueve pesos y sesgos para reducir la pérdida.' }
	];

	let reducedMotion = $state(false);
	let decorativeMotionPaused = $state(false);

	onMount(() => {
		const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
		const syncMotion = () => (reducedMotion = preference.matches);
		syncMotion();
		preference.addEventListener('change', syncMotion);
		return () => preference.removeEventListener('change', syncMotion);
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
		<div><dt><code>gradiente</code></dt><dd>La lista de señales de ajuste: para cada peso, cuánto y en qué dirección cambia la pérdida si ese peso se mueve un poco.</dd></div>
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
	<div class="next-question"><p>¿Para qué tantas neuronas? Cada una aprende a fijarse en algo distinto, y la activación permite combinarlas en fronteras curvas. Lo comprobaremos con diez puntos en 2.9. Primero veamos cómo aprende la red.</p></div>
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

<section class="lesson" id="gradiente" data-lesson="Descenso de gradiente" data-number="2.7" aria-labelledby="gradiente-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.7</span><h2 id="gradiente-title">El descenso de gradiente baja la montaña de la pérdida</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Imaginemos que estamos en una montaña con niebla y queremos bajar al valle. No vemos el valle, pero sí sentimos hacia dónde se inclina el suelo bajo nuestros pies. Damos un paso cuesta abajo y repetimos.</p>
			<p>Empecemos con un solo peso. Para una entrada <var>x = 2</var> y una respuesta <var>y = 10</var>, la predicción es <var>ŷ = 2w</var> y la pérdida es <var>L = ½(2w − 10)²</var>. Con <var>w = 3</var> predecimos 6 en lugar de 10.</p>
			<ol class="reading-steps">
				<li><strong>Medimos la pendiente</strong> con el experimento del empujón: movemos <var>w</var> un poquito y vemos cuánto cambia <var>L</var>.</li>
				<li><strong>Damos un paso en sentido contrario a la pendiente:</strong> <var>w<sub>nuevo</sub> = w − η × pendiente</var>.</li>
				<li><strong>Repetimos</strong> hasta que la pendiente sea casi cero: estamos en el fondo del valle.</li>
			</ol>
			<div class="definition"><p><strong>η, el tamaño del paso:</strong> si es pequeño llegamos despacio; si es grande rebotamos de un lado al otro; si es demasiado grande nos salimos del valle. Pruébalo en la figura.</p></div>
		</div>
		<figure class="lesson__figure">
			<GradientDescent1D />
			<figcaption><b>Figura 2.8.</b> Un solo peso baja por la curva de pérdida. La recta negra es la pendiente en el punto actual.</figcaption>
		</figure>
	</div>
	<div class="lesson__body">
		<div class="lesson__text">
			<h3 class="lesson__subhead">Con más pesos, la curva se vuelve un paisaje</h3>
			<p>Si la red tiene dos pesos, <var>a</var> y <var>b</var>, la pérdida es una superficie: el piso son los valores de los pesos y la altura es la pérdida. Ahora hay una pendiente por cada peso; a esa lista de pendientes la llamamos <strong>gradiente</strong>. Una red real tiene millones de pesos; no podemos dibujarlos, pero la idea es la misma.</p>
			<p>Este paisaje no es un tazón perfecto: tiene un valle profundo, un valle local menos profundo y pequeños baches. Como solo sentimos la pendiente bajo nuestros pies, el camino depende de dónde empezamos y de cómo damos cada paso.</p>
		</div>
		<div class="key-idea"><p><strong>Todos usan la misma regla:</strong> <var>peso<sub>nuevo</sub> = peso − η × pendiente</var>. Lo que cambia entre los tipos de descenso es <strong>con cuántos ejemplos</strong> mido la pendiente y <strong>si recuerdo los pasos anteriores</strong>.</p></div>
	</div>
	<div class="lesson__body lesson__body--wide">
		<figure class="lesson__figure">
			<LossLandscape3D />
			<figcaption><b>Figura 2.9.</b> Superficie de pérdida de dos pesos, calculada como el promedio de ocho ejemplos. Cada color de camino es un tipo de descenso de gradiente que parte del mismo punto.</figcaption>
		</figure>
	</div>
	<div class="next-question"><p>Desde el punto 1, el descenso por lotes se queda en el valle local, mientras que el ruido de SGD y la inercia de momentum llegan al valle profundo: ningún optimizador gana siempre. Pero queda un problema: medir la pendiente empujando cada peso por separado sería lentísimo con millones de pesos. ¿Cómo la obtenemos de todos a la vez?</p></div>
	<div class="key-idea"><p><strong>El objetivo tiene límites:</strong> minimizar la pérdida de entrenamiento no garantiza por sí solo una buena respuesta en datos nuevos. Por eso también medimos el rendimiento en datos que no se usaron para ajustar los parámetros.</p></div>
</section>

<section class="lesson" id="backpropagation" data-lesson="Backpropagation" data-number="2.8" aria-labelledby="backward-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.8</span><h2 id="backward-title">Backpropagation obtiene todas las pendientes en un solo viaje de regreso</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>En lugar de empujar cada peso, hacemos una pasada hacia adelante, medimos el error y enviamos una <strong>señal de ajuste</strong> de regreso por las mismas conexiones. En cada conexión la señal se transforma con una receta corta, y al final cada parámetro tiene su señal: su pendiente.</p>
			<div class="recipe">
				<p class="recipe__title">La receta</p>
				<ol>
					<li>La señal nace en la salida: <var>señal de ŷ = ŷ − y</var>.</li>
					<li>Para un peso: <var>señal del peso = señal que llega × lo que entró por esa conexión</var>.</li>
					<li>Para pasar a la neurona anterior: <var>señal que llega × peso de la conexión</var>.</li>
					<li>Al cruzar ReLU: si la neurona estaba encendida (<var>z &gt; 0</var>) la señal pasa igual; si estaba apagada, se corta.</li>
				</ol>
			</div>
		</div>
		<figure class="lesson__figure">
			<div class="single-check">
				<p class="single-check__title">Comprobación con el peso de 2.7</p>
				<p>Hacia adelante: <var>ŷ = 3 × 2 = 6</var>.</p>
				<p>La señal nace: <var>señal de ŷ = 6 − 10 = −4</var>.</p>
				<p>Por la conexión de <var>w</var> entró <var>x = 2</var>: <var>señal de w = −4 × 2 = <strong>−8</strong></var>.</p>
				<p class="single-check__result">Es el mismo −8 que medimos con el empujón, pero sin empujar nada: solo multiplicamos números que ya teníamos.</p>
			</div>
			<figcaption><b>Figura 2.10.</b> La receta aplicada al ejemplo de un solo peso.</figcaption>
		</figure>
	</div>
	<div class="lesson__body lesson__body--wide">
		<figure class="lesson__figure">
			<BackpropWalkthrough />
			<figcaption><b>Figura 2.11.</b> Backpropagation completo en una red pequeña: cada valor aparece donde se calcula, primero hacia adelante y después hacia atrás, hasta actualizar los siete parámetros.</figcaption>
		</figure>
	</div>
	<div class="glossary-note key-idea"><p><strong>Para quien quiera ir más allá:</strong> en cálculo, la señal de ajuste se llama <em>derivada</em> y la receta se conoce como <em>regla de la cadena</em>. No necesitamos esos nombres para usarla.</p></div>
</section>

<section class="lesson lesson--wide" id="comparacion-entrenamiento" data-lesson="Una red aprende" data-number="2.9" aria-labelledby="comparacion-entrenamiento-title">
	<div class="lesson__head"><span class="lesson__number" aria-hidden="true">2.9</span><h2 id="comparacion-entrenamiento-title">Ahora veamos a una red aprender</h2></div>
	<div class="lesson__body">
		<div class="lesson__text">
			<p>Ya recorrimos la predicción, la pérdida, el viaje de regreso de las señales y la actualización de pesos. Ahora voy a repetir ese ciclo sobre diez ejemplos para comparar qué puede aprender una red con y sin activación en su capa oculta.</p>
		</div>
		<figure class="lesson__figure">
			<NonlinearLearningDemo />
			<figcaption><b>Figura 2.12.</b> La misma red entrenada sobre diez puntos, con y sin activación en su capa oculta.</figcaption>
		</figure>
		<div class="next-question"><p>La demostración de diez puntos usa una red 2 → 8 → 1 y muchas actualizaciones. En el laboratorio usaremos una red más pequeña, 2 → 2 → 1: calcularás una rama representativa y verás cómo la misma regla completa la otra antes de actualizar la red.</p></div>
	</div>
</section>

<section class="lesson lesson--bare" id="laboratorio" data-lesson="Laboratorio: entrena a mano" data-number="2.10" aria-label="Laboratorio: entrena a mano una red 2 → 2 → 1">
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


	.back-home { display: inline-block; padding: 0.7rem 1.05rem; border: 0; border-radius: 0.4rem; background: var(--color-primary); color: white; cursor: pointer; font: inherit; font-size: 0.95rem; font-weight: 800; text-decoration: none; }
	.back-home:hover { background: #193fa8; }
	.back-home:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.back-home.secondary-link { border: 1px solid var(--color-line); background: white; color: var(--color-ink); }
	.back-home.secondary-link:hover { border-color: var(--color-primary); background: white; color: var(--color-primary); }

	.lesson--wide .next-question { margin-top: 0; }
	.sources ul { display: grid; gap: 0.65rem; padding-left: 1.25rem; }
	.sources a:not(.back-home) { color: var(--color-primary); font-weight: 700; text-underline-offset: 0.18em; }
	.closing-links { display: flex; flex-wrap: wrap; gap: 0.6rem; }

	.lesson__subhead { margin: 0 0 0.75rem; font-size: 1.45rem; font-weight: 600; }
	.recipe { margin-top: 1rem; padding: 1rem 1.15rem; border: 1px solid var(--color-line); border-top: 3px solid var(--color-accent); border-radius: 0 0 0.4rem 0.4rem; background: var(--color-surface); }
	.recipe__title { margin: 0 0 0.4rem; font-family: var(--font-serif); font-size: 1.15rem; font-weight: 600; }
	.recipe ol { display: grid; gap: 0.45rem; margin: 0; padding-left: 1.3rem; list-style: decimal; line-height: 1.5; }
	.single-check { display: grid; gap: 0.45rem; padding: 1.1rem 1.25rem; border-left: 4px solid var(--color-accent); border-radius: 0.3rem; background: #f3faf8; font-size: 1.1rem; }
	.single-check p { margin: 0; }
	.single-check__title { font-family: var(--font-serif); font-size: 1.2rem; font-weight: 600; }
	.single-check__result { margin-top: 0.35rem !important; color: var(--color-accent); font-weight: 700; }
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
