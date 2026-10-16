<script lang="ts">
	import AttentionLab from './AttentionLab.svelte';
	import NextWordHook from '#lib/components/visualizations/language/NextWordHook.svelte';
	import TokenizerPlayground from '#lib/components/visualizations/language/TokenizerPlayground.svelte';
	import EmbeddingPlane from '#lib/components/visualizations/language/EmbeddingPlane.svelte';
	import AttentionExplorer from '#lib/components/visualizations/language/AttentionExplorer.svelte';
	import TransformerBlockDiagram from '#lib/components/visualizations/language/TransformerBlockDiagram.svelte';
	import NextTokenSampler from '#lib/components/visualizations/language/NextTokenSampler.svelte';
	import MultidimensionalEmbeddings from '#lib/components/visualizations/language/MultidimensionalEmbeddings.svelte';

	const applications = [
		{ title: 'Clasificar', detail: 'Filtros de spam, detección de comentarios tóxicos y análisis de sentimiento.' },
		{ title: 'Traducir', detail: 'Convertir una frase de un idioma a otro conservando su significado.' },
		{ title: 'Resumir y generar', detail: 'Condensar documentos largos o redactar respuestas nuevas.' },
		{ title: 'Conversar', detail: 'Asistentes que responden preguntas y mantienen el contexto de una conversación.' }
	];

	const eras = [
		{ label: 'Reglas escritas a mano', detail: 'Expertos programaban reglas: “si el correo dice GRATIS tres veces, es spam”. Funcionaba en tareas muy acotadas y fallaba con el contexto.' },
		{ label: 'Embeddings y redes recurrentes', detail: 'Las palabras se convierten en vectores y una red las lee en orden, una por una.' },
		{ label: 'Transformers y LLMs', detail: 'La atención permite mirar toda la frase a la vez. Un solo modelo preentrenado resuelve muchas tareas.' }
	];

	const forgettingWords = ['Ayer', 'me', 'senté', 'a', 'descansar', 'junto', 'al', 'río', 'que', 'pasa', 'cerca', 'del', 'parque', 'en', 'el', 'banco'];

	const qkv = [
		{ symbol: 'q', name: 'Query · consulta', detail: 'Lo que una palabra busca. «banco» pregunta: ¿quién me ayuda a saber qué significo?' },
		{ symbol: 'k', name: 'Key · etiqueta', detail: 'Lo que cada palabra ofrece, como la etiqueta en el lomo de un libro.' },
		{ symbol: 'v', name: 'Value · contenido', detail: 'La información que se lleva quien consulta, como el contenido del libro.' }
	];

	const causalTokens = ['La', 'capital', 'de', 'Guatemala'];
	const causalTargets = ['capital', 'de', 'Guatemala', 'es'];

	const trainingStages = [
		{ number: '01', title: 'Preentrenamiento', detail: 'Lee billones de tokens de la web, libros y código. Su única tarea: predecir el siguiente token. Es aprendizaje autosupervisado: el propio texto trae la respuesta.' },
		{ number: '02', title: 'Ajuste con instrucciones', detail: 'Se entrena con pares de pregunta y respuesta para que siga instrucciones en formato de conversación.' },
		{ number: '03', title: 'Alineación', detail: 'Personas comparan respuestas y el modelo se ajusta hacia las preferidas (RLHF). Así nace un asistente.' }
	];
</script>

<div class="language-journey">
<header class="hero story-card">
	<p class="eyebrow">De las palabras a los modelos de lenguaje</p>
	<h1>¿Cómo entiende y genera texto una máquina?</h1>
	<p class="hero-copy">En la mañana entrenamos una red que solo entiende números. Ahora voy a mostrar cómo convertimos palabras en números, cómo un modelo decide a qué palabras prestar atención y cómo eso se convierte en un asistente como ChatGPT o Claude.</p>
	<div class="hero-tags" aria-label="Temas del recorrido">
		<span>NLP</span><span>Tokens y embeddings</span><span>Atención</span><span>Transformers</span><span>LLMs</span>
	</div>
</header>

<section class="story-card" id="gancho" aria-labelledby="gancho-title">
	<p class="eyebrow">00 · Antes de empezar</p>
	<h2 id="gancho-title">Tu celular ya predice palabras</h2>
	<p>Cuando escribes un mensaje, el teclado sugiere la siguiente palabra. Antes de explicar cómo lo hace, quiero que tú hagas lo mismo.</p>
	<NextWordHook />
	<p class="note">Acabas de hacer lo que hace un modelo de lenguaje: mirar el contexto y elegir una continuación probable. Para lograrlo, primero necesitamos que la red pueda leer palabras.</p>
</section>

<section class="story-card" id="nlp" aria-labelledby="nlp-title">
	<p class="eyebrow">01 · El problema</p>
	<h2 id="nlp-title">¿Qué es el procesamiento del lenguaje natural?</h2>
	<p>El <strong>procesamiento del lenguaje natural</strong> (NLP, por sus siglas en inglés) es la rama de la inteligencia artificial que busca que una computadora procese, comprenda y genere lenguaje humano. Lo usas todos los días:</p>
	<div class="card-grid">
		{#each applications as application, index (application.title)}
			<article class="mini-card" style={`--card-index:${index}`}><h3>{application.title}</h3><p>{application.detail}</p></article>
		{/each}
	</div>
	<h3 class="subheading">Tres etapas de la misma historia</h3>
	<ol class="era-line">
		{#each eras as era, index (era.label)}
			<li style={`--card-index:${index}`}><span class="era-number">{index + 1}</span><div><strong>{era.label}</strong><p>{era.detail}</p></div></li>
		{/each}
	</ol>
	<p class="note"><strong>El obstáculo:</strong> la red de la mañana recibe vectores de números, no texto. ¿Cómo convierto «Hoy en Chiquimula» en números?</p>
</section>

<section class="story-card" id="tokens" aria-labelledby="tokens-title">
	<p class="eyebrow">02 · Partir el texto</p>
	<h2 id="tokens-title">Un tokenizador convierte texto en números</h2>
	<p>El primer paso es dividir el texto en piezas llamadas <strong>tokens</strong>: palabras completas, fragmentos de palabras o signos. Cada token tiene un número en un vocabulario fijo. Ese número es lo que entra a la red.</p>
	<TokenizerPlayground />
	<p class="note">Un ID es solo una etiqueta: el token 57 no es “más grande” que el 12. Necesito una representación donde la distancia entre números diga algo sobre el significado.</p>
</section>

<section class="story-card" id="embeddings" aria-labelledby="embeddings-title">
	<p class="eyebrow">03 · Palabras como vectores</p>
	<h2 id="embeddings-title">Un embedding ubica cada token en un espacio</h2>
	<p>Un <strong>embedding</strong> asigna a cada token un vector. Durante el entrenamiento, las palabras que aparecen en contextos parecidos terminan cerca. Para medir qué tan parecidos son dos vectores, uso una operación que ya conoces del álgebra lineal: el <strong>producto punto</strong>.</p>
	<div class="equation">a · b = a₁b₁ + a₂b₂</div>
	<EmbeddingPlane />
</section>

<section class="story-card" id="embeddings-reales" aria-labelledby="embeddings-reales-title">
	<p class="eyebrow">03 · Un embedding real</p>
	<h2 id="embeddings-reales-title">De 2 a 384 dimensiones</h2>
	<p>Mi plano tenía solo 2 números por palabra. Un modelo real usa cientos: el que vamos a explorar asigna <strong>384 números</strong> a cada palabra. No puedo dibujar 384 ejes, así que uso el <strong>análisis de componentes principales (PCA)</strong>: busca las 3 direcciones donde las palabras más se diferencian y proyecta cada punto sobre ellas, como la sombra de un objeto vista desde el mejor ángulo.</p>
	<MultidimensionalEmbeddings />
	<p class="note"><strong>Siguiente pregunta:</strong> cada palabra tiene ahora un vector rico en significado. Pero ¿qué pasa cuando la misma palabra significa cosas distintas según la frase?</p>
</section>

<section class="story-card" id="contexto" aria-labelledby="contexto-title">
	<p class="eyebrow">04 · Un vector no basta</p>
	<h2 id="contexto-title">La misma palabra puede significar cosas distintas</h2>
	<p>Mira estas dos frases. Con un embedding fijo, «banco» recibe <em>exactamente el mismo vector</em> en ambas, aunque su significado cambia.</p>
	<div class="ambiguity-panel">
		<div class="sentence-card river"><span>Me senté junto al río en el</span> <mark>banco</mark><small>asiento</small></div>
		<div class="shared-vector"><small>mismo vector</small><br />[1, 1]</div>
		<div class="sentence-card money"><span>Deposité el dinero en el</span> <mark>banco</mark><small>institución financiera</small></div>
	</div>
	<p>Las redes recurrentes (RNN) intentaron resolverlo leyendo palabra por palabra y guardando una memoria. El problema: en frases largas, la memoria de las primeras palabras se va diluyendo.</p>
	<div class="forgetting" role="img" aria-label="Una red recurrente lee la frase de izquierda a derecha y el recuerdo de las primeras palabras se vuelve más débil al llegar a banco.">
		{#each forgettingWords as word, index (index)}
			<span style={`--memory:${Math.max(0.15, 1 - (forgettingWords.length - 1 - index) * 0.07)}; --word-index:${index}`} class:target={word === 'banco'} class:clue={word === 'río'}>{word}</span>
		{/each}
	</div>
	<p class="visual-caption">Al llegar a «banco», la pista «río» ya se recuerda débilmente.</p>
	<p class="note"><strong>Siguiente pregunta:</strong> ¿y si cada palabra pudiera mirar directamente a todas las demás y decidir cuáles le importan?</p>
</section>

<section class="story-card glossary" id="simbolos-lenguaje" aria-labelledby="simbolos-lenguaje-title">
	<p class="eyebrow">Guía para leer las fórmulas</p>
	<h2 id="simbolos-lenguaje-title">Los símbolos de esta parte</h2>
	<dl class="symbol-grid">
		<div><dt><code>a · b</code></dt><dd>Producto punto: multiplico componente por componente y sumo. Un resultado grande indica vectores que apuntan en direcciones parecidas.</dd></div>
		<div><dt><code>q, k, v</code></dt><dd>Los vectores de consulta (query), etiqueta (key) y contenido (value) de cada token.</dd></div>
		<div><dt><code>e ≈ 2.718</code></dt><dd>Un número fijo, como π. <var>eˣ</var> siempre es positivo y crece muy rápido.</dd></div>
		<div><dt><code>softmax</code></dt><dd>Convierte una lista de puntajes en porcentajes que suman 1: divide cada <var>eˣ</var> entre la suma de todos.</dd></div>
		<div><dt><code>Σ</code></dt><dd>Suma de varios términos; por ejemplo, Σ peso × v suma cada vector multiplicado por su peso.</dd></div>
		<div><dt><code>T</code></dt><dd>Temperatura: controla qué tan aleatoria es la elección del siguiente token.</dd></div>
	</dl>
</section>

<section class="story-card" id="articulo" aria-labelledby="articulo-title">
	<p class="eyebrow">Un momento clave · 2017</p>
	<h2 id="articulo-title">Un artículo que cambió la inteligencia artificial</h2>
	<div class="paper-layout">
		<figure class="paper-figure">
			<a href="/images/attention-is-all-you-need.png" target="_blank" rel="noreferrer" aria-label="Abrir la primera página del artículo en tamaño completo">
				<img src="/images/attention-is-all-you-need.png" alt="Primera página del artículo «Attention Is All You Need»: título, los ocho autores con sus instituciones y el resumen." loading="lazy" />
			</a>
			<figcaption>Primera página de Vaswani et al., «Attention Is All You Need», <em>Advances in Neural Information Processing Systems</em> 30, 2017 (arXiv:1706.03762, versión 7). <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">Ver el artículo</a>.</figcaption>
		</figure>
		<div class="paper-copy">
			<p>Antes de entrar al mecanismo de atención, quiero detenerme en este documento. En 2017, ocho investigadores de Google Brain, Google Research y la Universidad de Toronto publicaron este artículo. Su objetivo era concreto: traducir mejor del inglés al alemán y al francés.</p>
			<p>Su propuesta fue atrevida: eliminar la lectura palabra por palabra de las redes recurrentes y quedarse <strong>solo con la atención</strong>. El modelo tradujo mejor que los anteriores y se entrenó en apenas 3.5 días con 8 tarjetas gráficas (GPUs).</p>
			<p>Esa arquitectura, el <strong>Transformer</strong>, es la base de GPT, Claude, Gemini, LLaMA y de casi todos los modelos de lenguaje que usamos hoy. El título, por cierto, juega con la canción «All You Need Is Love» de los Beatles.</p>
		</div>
	</div>
	<div class="reflection">
		<strong>Una reflexión sobre la investigación</strong>
		<p>Ninguno de los autores estaba construyendo ChatGPT. Resolvían un problema específico, midieron sus resultados con honestidad y publicaron su trabajo abiertamente. Eso permitió que miles de equipos en el mundo construyeran sobre su idea. Así avanza la ciencia: una buena pregunta, experimentos cuidadosos y resultados compartidos. Una investigación que hoy parece pequeña, incluso un proyecto universitario, puede ser la pieza que otra persona necesitaba.</p>
	</div>
</section>

<section class="story-card" id="atencion" aria-labelledby="atencion-title">
	<p class="eyebrow">05 · El corazón del Transformer</p>
	<h2 id="atencion-title">El mecanismo de atención</h2>
	<p>La <strong>autoatención</strong> deja que cada token consulte a todos los demás. Me gusta pensarlo como una biblioteca: cada palabra llega con una pregunta, revisa las etiquetas de los libros y se lleva un poco del contenido de los que más le sirven.</p>
	<div class="qkv-grid">
		{#each qkv as item (item.symbol)}
			<article><span class="qkv-symbol">{item.symbol}</span><h3>{item.name}</h3><p>{item.detail}</p></article>
		{/each}
	</div>
	<div class="recipe" aria-label="Receta de la atención en tres pasos">
		<div><span>1</span><p><strong>Puntaje:</strong> q · k para cada token.</p></div>
		<div><span>2</span><p><strong>Porcentajes:</strong> softmax de los puntajes.</p></div>
		<div><span>3</span><p><strong>Mezcla:</strong> Σ porcentaje × v. Es el nuevo vector con contexto.</p></div>
	</div>
	<div class="attention-formula" aria-labelledby="formula-title">
		<p id="formula-title" class="formula-label">La misma receta, como aparece en el artículo</p>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the equation on narrow screens.) -->
		<div class="formula" role="region" tabindex="0" aria-label="Atención de Q, K y V es igual a softmax de Q por K transpuesta dividido entre la raíz de d sub k, multiplicado por V">
			Atención(Q, K, V) = <span class="term step-two">softmax(</span><span class="term step-one">Q·Kᵀ</span><span class="term scale"> ⁄ √dₖ</span><span class="term step-two">)</span> <span class="term step-three">· V</span>
		</div>
		<dl class="formula-legend">
			<div><dt><span class="term step-one">Q·Kᵀ</span></dt><dd><strong>Paso 1.</strong> Q, K y V son tablas (matrices) donde cada fila es el q, k o v de un token. Multiplicar Q por K transpuesta calcula todos los productos punto q · k a la vez.</dd></div>
			<div><dt><span class="term scale">⁄ √dₖ</span></dt><dd><strong>Ajuste de escala.</strong> dₖ es cuántos números tiene cada vector. Dividir entre su raíz evita que los puntajes crezcan demasiado cuando los vectores son largos.</dd></div>
			<div><dt><span class="term step-two">softmax( )</span></dt><dd><strong>Paso 2.</strong> Convierte cada fila de puntajes en porcentajes que suman 1.</dd></div>
			<div><dt><span class="term step-three">· V</span></dt><dd><strong>Paso 3.</strong> Mezcla los vectores v con esos porcentajes: el nuevo vector con contexto de cada token.</dd></div>
		</dl>
		<div class="softmax-box">
			<p class="formula-label">¿Y cómo se ve softmax por dentro?</p>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the equation on narrow screens.) -->
			<div class="formula softmax-formula" role="region" tabindex="0" aria-label="softmax de z sub i es igual a e elevado a z sub i, dividido entre la suma, para todo j, de e elevado a z sub j">
				<span class="term step-two">softmax(zᵢ)</span> =
				<span class="fraction"><span>e<sup>zᵢ</sup></span><span>Σⱼ e<sup>zⱼ</sup></span></span>
			</div>
			<p><var>z</var> es la lista de puntajes y <var>zᵢ</var> uno de ellos. Arriba elevo <var>e ≈ 2.718</var> a ese puntaje; abajo sumo lo mismo para todos los puntajes. Así cada resultado queda entre 0 y 1 y todos suman 1.</p>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the example on narrow screens.) -->
			<div class="softmax-example" role="region" tabindex="0" aria-label="Ejemplo de softmax con los puntajes 3 y 1">
				<span>Ejemplo con puntajes z = [3, 1]:</span>
				<span>softmax(3) = <span class="fraction small"><span>e³</span><span>e³ + e¹</span></span> = <span class="fraction small"><span>20.086</span><span>20.086 + 2.718</span></span> ≈ <strong>0.881</strong></span>
				<span>softmax(1) = <span class="fraction small"><span>e¹</span><span>e³ + e¹</span></span> ≈ <strong>0.119</strong></span>
				<span>0.881 + 0.119 = <strong>1</strong></span>
			</div>
		</div>
	</div>
	<p>Haz clic en una palabra para verla como consulta. Fíjate a dónde mira «banco» en cada frase.</p>
	<AttentionExplorer />
	<div class="causal-explainer">
		<h3>¿Por qué la atención de un LLM es causal?</h3>
		<p>Un LLM escribe de izquierda a derecha. Cuando predice lo que sigue a «La capital de», la palabra «Guatemala» todavía no existe: no tiene sentido mirarla. La <strong>máscara causal</strong> obliga a cada token a mirar solo hacia atrás, a sí mismo y a los anteriores.</p>
		<div class="causal-layout">
			<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard focus lets students scroll the mask on narrow screens.) -->
			<div class="mask-scroll" role="region" tabindex="0" aria-label="Máscara causal para la frase «La capital de Guatemala»">
				<table class="causal-mask">
					<caption>Cada fila es un token que consulta; cada columna, un token que podría mirar.</caption>
					<thead><tr><th scope="col">consulta ↓ · mira →</th>{#each causalTokens as token (token)}<th scope="col">{token}</th>{/each}<th scope="col" class="target-head">aprende a predecir</th></tr></thead>
					<tbody>
						{#each causalTokens as rowToken, row (rowToken)}
							<tr style={`--row-index:${row}`}>
								<th scope="row">{rowToken}</th>
								{#each causalTokens as columnToken, column (columnToken)}
									<td class:allowed={column <= row} class:blocked={column > row}>{column <= row ? '✓' : '✕'}<span class="sr-only">{column <= row ? `«${rowToken}» puede mirar «${columnToken}»` : `«${rowToken}» no puede mirar «${columnToken}»`}</span></td>
								{/each}
								<td class="target">«{causalTargets[row]}»</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="causal-reasons">
				<div><strong>1 · Al generar</strong><p>El futuro todavía no existe. El modelo produce un token, lo agrega y recién entonces puede mirarlo.</p></div>
				<div><strong>2 · Al entrenar</strong><p>Aquí sí tenemos la frase completa. Si un token pudiera mirar hacia adelante, copiaría la respuesta en vez de aprender a predecirla, como un examen con las respuestas a la vista.</p></div>
				<div><strong>3 · Un bonus</strong><p>Gracias a la máscara, una sola frase se convierte en varios ejercicios a la vez: cada fila de la tabla es una predicción distinta que se entrena en paralelo.</p></div>
			</div>
		</div>
		<p class="try-it"><strong>Pruébalo arriba:</strong> activa «Atención causal» y elige «senté» como consulta. Las palabras que vienen después se apagan. Los modelos que solo leen y clasifican texto, como BERT, no usan esta máscara: miran en ambas direcciones porque no tienen que generar.</p>
	</div>
	<p class="note">En el laboratorio vas a calcular estos porcentajes a mano. Antes quiero mostrarte dónde vive la atención dentro de un modelo completo.</p>
</section>

<section class="story-card" id="transformer" aria-labelledby="transformer-title">
	<p class="eyebrow">06 · Armar el modelo</p>
	<h2 id="transformer-title">El Transformer apila atención y redes densas</h2>
	<p>Ahora sí veamos el <strong>Transformer</strong> que propuso el artículo: una arquitectura que abandona la lectura palabra por palabra y usa atención para procesar toda la secuencia en paralelo. Cada bloque combina dos piezas: la atención, que mezcla información entre tokens, y una red densa, que transforma cada token por separado. Esa red densa es un MLP como el que entrenamos.</p>
	<TransformerBlockDiagram />
	<details class="extension">
		<summary>Para profundizar: ¿cómo sabe el modelo el orden de las palabras?</summary>
		<p>La atención por sí sola no distingue «el perro muerde al hombre» de «el hombre muerde al perro». Por eso, antes del primer bloque se suma a cada embedding un vector que codifica su posición. El artículo original usó ondas seno y coseno; muchos modelos actuales usan variantes como RoPE.</p>
	</details>
</section>

<section class="story-card" id="llm" aria-labelledby="llm-title">
	<p class="eyebrow">07 · Modelos grandes</p>
	<h2 id="llm-title">Un LLM es un Transformer que predice el siguiente token</h2>
	<p>Un <strong>gran modelo de lenguaje</strong> (LLM) es un Transformer con miles de millones de parámetros. Al recibir un texto, calcula una probabilidad para cada token de su vocabulario, elige uno, lo agrega al final y repite.</p>
	<NextTokenSampler />
	<h3 class="subheading">¿Cómo se convierte en un asistente?</h3>
	<div class="phase-flow">
		{#each trainingStages as stage (stage.number)}
			<article class="phase-card"><span class="phase-number">{stage.number}</span><h3>{stage.title}</h3><p>{stage.detail}</p></article>
		{/each}
	</div>
	<p class="note"><strong>Entrenar no es lo mismo que usar.</strong> Entrenar ajusta los pesos, como en el laboratorio de la mañana, y cuesta semanas en miles de procesadores. Cuando conversas con un LLM, sus pesos ya están fijos: solo hace pasadas hacia adelante. A eso se le llama <strong>inferencia</strong>.</p>
	<div class="callout-grid">
		<div><strong>Ventana de contexto</strong><p>El modelo solo “ve” una cantidad máxima de tokens: tu mensaje más lo que va generando. Lo que no cabe, no existe para él.</p></div>
		<div><strong>Alucinaciones</strong><p>El modelo elige continuaciones probables, no verificadas. Puede inventar datos con total seguridad.</p></div>
		<div><strong>Fecha de corte</strong><p>Solo conoce lo que había en sus datos de entrenamiento. No sabe lo que pasó después.</p></div>
		<div><strong>No consulta ni actúa</strong><p>Por sí solo no busca en internet, no abre archivos y no ejecuta acciones: solo produce texto.</p></div>
	</div>
	<details class="extension">
		<summary>Para profundizar: modelos abiertos y cerrados</summary>
		<p>Los modelos de <strong>pesos abiertos</strong> (como LLaMA, Qwen u OLMo) se pueden descargar y ejecutar en una computadora propia, lo que da control sobre los datos. Los modelos <strong>cerrados</strong> (como GPT, Gemini o Claude) se usan a través de una aplicación web o una API del proveedor.</p>
	</details>
</section>

<AttentionLab />

<section class="story-card bridge" aria-labelledby="puente-title">
	<p class="eyebrow">Lo que sigue</p>
	<h2 id="puente-title">El modelo responde, pero no actúa</h2>
	<p>Recorrimos el camino completo: texto → tokens → embeddings → atención → bloques Transformer → probabilidades del siguiente token. Un LLM es muy bueno produciendo texto, pero por sí solo no consulta una base de datos, no revisa tu calendario ni envía un correo.</p>
	<p class="note"><strong>Siguiente pregunta:</strong> ¿qué le falta a un modelo para usar herramientas y perseguir un objetivo? Ahí empiezan los <strong>agentes</strong>, y con ellos, nuevos riesgos de seguridad.</p>
</section>

<footer class="story-card sources" aria-labelledby="fuentes-lenguaje-title">
	<p class="eyebrow">Para continuar</p>
	<h2 id="fuentes-lenguaje-title">Fuentes y materiales extra</h2>
	<p>Los vectores, vocabularios y probabilidades de este recorrido son ejemplos de juguete hechos a mano para poder calcularlos en clase. Los modelos reales usan vectores de cientos o miles de dimensiones aprendidos durante el entrenamiento.</p>
	<ul>
		<li><a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noreferrer">Vaswani et al. (2017), «Attention Is All You Need»: el artículo original del Transformer</a></li>
		<li><a href="https://jalammar.github.io/illustrated-transformer/" target="_blank" rel="noreferrer">Jay Alammar, «The Illustrated Transformer»: explicación visual paso a paso</a></li>
		<li><a href="https://poloclub.github.io/transformer-explainer/" target="_blank" rel="noreferrer">Transformer Explainer: explora un GPT-2 real en el navegador</a></li>
	</ul>
	<a class="back-home" href="/agents">Continuar con agentes →</a>
</footer>
</div>

<style>
	.story-card { margin: 0 0 1.5rem; padding: clamp(1.25rem, 3.4vw, 3rem); border: 1px solid var(--color-line); border-radius: var(--radius-panel); background: var(--color-surface); box-shadow: var(--shadow-panel); scroll-margin-top: 5.75rem; }
	.hero { padding-block: clamp(2rem, 6vw, 5rem); background: linear-gradient(140deg, #fff 20%, #f0fdfa 100%); }
	.eyebrow { margin: 0 0 0.8rem; color: var(--color-accent); font-size: 0.82rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
	h1, h2, h3, p { margin-top: 0; }
	h1 { max-width: 18ch; margin-bottom: 1rem; color: var(--color-ink); font-size: clamp(2.4rem, 6vw, 5.2rem); line-height: 1.04; letter-spacing: -0.045em; }
	h2 { margin-bottom: 1rem; color: var(--color-ink); font-size: clamp(1.7rem, 3.5vw, 2.75rem); line-height: 1.12; letter-spacing: -0.03em; }
	h3 { margin-bottom: 0.5rem; color: var(--color-ink); font-size: 1.15rem; }
	p { max-width: 76ch; color: var(--color-muted); line-height: 1.7; }
	.hero-copy { max-width: 68ch; font-size: clamp(1.1rem, 2vw, 1.35rem); }
	.hero-tags { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 1.75rem; }
	.hero-tags span { border-radius: 999px; background: var(--color-primary-soft); padding: 0.5rem 0.9rem; color: var(--color-primary); font-size: 0.9rem; font-weight: 700; }
	.subheading { margin-top: 1.75rem; }
	.note { margin: 1.5rem 0 0; border-left: 4px solid var(--color-primary); border-radius: 0 0.8rem 0.8rem 0; background: #eff6ff; padding: 1rem 1.2rem; }
	.equation { margin: 1rem 0; border-left: 4px solid var(--color-accent); border-radius: 0 0.8rem 0.8rem 0; background: var(--color-accent-soft); padding: 1rem 1.25rem; color: var(--color-ink); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(1.05rem, 2.5vw, 1.5rem); font-weight: 700; }
	.visual-caption { margin: 0.5rem auto 0; text-align: center; font-size: 0.9rem; }
	.card-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.8rem; margin: 1.25rem 0; }
	.mini-card { border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 1rem; animation: rise-in 600ms both; animation-delay: calc(var(--card-index) * 140ms); }
	.mini-card p { margin: 0; font-size: 0.95rem; }
	.era-line { display: grid; gap: 0.7rem; margin: 0.75rem 0 0; padding: 0; list-style: none; }
	.era-line li { display: flex; gap: 0.9rem; align-items: flex-start; border-radius: 0.9rem; background: #f8fbff; padding: 0.9rem 1rem; animation: rise-in 600ms both; animation-delay: calc(var(--card-index) * 200ms); }
	.era-line strong { color: var(--color-ink); }
	.era-line p { margin: 0.2rem 0 0; }
	.era-number { display: grid; width: 2rem; height: 2rem; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--color-primary); color: white; font-size: 0.85rem; font-weight: 800; }
	.ambiguity-panel { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 0.9rem; margin: 1.25rem 0; }
	.sentence-card { display: grid; gap: 0.35rem; border: 1px solid var(--color-line); border-radius: 1rem; padding: 1rem 1.1rem; font-size: 1.15rem; color: var(--color-ink); }
	.sentence-card.river { background: #f0fdfa; }
	.sentence-card.money { background: #eff6ff; }
	.sentence-card mark { justify-self: start; border-radius: 0.4rem; background: #fed7aa; padding: 0 0.35rem; color: #7c2d12; font-weight: 800; }
	.sentence-card small { color: var(--color-muted); font-size: 0.85rem; font-weight: 700; }
	.shared-vector small { color: var(--color-muted); font-family: var(--font-sans); font-size: 0.8rem; }
	.shared-vector { color: #c2410c; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.2rem; font-weight: 800; text-align: center; white-space: nowrap; }
	.forgetting { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 1.25rem 0 0; padding: 1rem; border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; }
	.forgetting span { border-radius: 0.5rem; background: rgb(29 78 216 / calc(var(--memory) * 0.22)); padding: 0.3rem 0.55rem; color: var(--color-ink); opacity: var(--memory); font-weight: 700; animation: read-word 500ms both; animation-delay: calc(var(--word-index) * 120ms); }
	.forgetting span.clue { outline: 2px dashed var(--color-accent); }
	.forgetting span.target { background: #fed7aa; color: #7c2d12; opacity: 1; }
	.symbol-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; margin: 1.25rem 0 0; }
	.symbol-grid > div { min-width: 0; padding: 0.8rem 0.9rem; border: 1px solid var(--color-line); border-radius: 0.8rem; background: #f8fbff; }
	.symbol-grid dt { margin-bottom: 0.35rem; color: var(--color-primary); font-weight: 800; }
	.symbol-grid dd { margin: 0; color: var(--color-muted); line-height: 1.5; }
	.qkv-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; margin: 1.25rem 0; }
	.qkv-grid article { border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 1rem; }
	.qkv-grid p { margin: 0; font-size: 0.95rem; }
	.qkv-symbol { display: grid; width: 2.4rem; height: 2.4rem; margin-bottom: 0.6rem; place-items: center; border-radius: 0.7rem; background: var(--color-accent-soft); color: #115e59; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.3rem; font-weight: 800; }
	.recipe { display: grid; gap: 0.6rem; margin: 1rem 0 1.25rem; }
	.recipe > div { display: flex; gap: 0.9rem; align-items: center; border-radius: 0.9rem; background: #f8fbff; padding: 0.75rem 1rem; }
	.recipe span { display: grid; width: 2rem; height: 2rem; flex: 0 0 auto; place-items: center; border-radius: 50%; background: var(--color-accent-soft); color: #115e59; font-weight: 800; }
	.recipe p { margin: 0; }
	.attention-formula { margin: 1.25rem 0; padding: 1.1rem 1.2rem; border: 1px solid #c7d2fe; border-radius: 1rem; background: linear-gradient(145deg, #f8fbff, #eef2ff); }
	.formula-label { margin: 0 0 0.6rem; color: var(--color-accent); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
	.formula { overflow-x: auto; padding: 0.9rem 1rem; border-radius: 0.8rem; background: white; color: var(--color-ink); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(1.1rem, 2.6vw, 1.7rem); font-weight: 800; text-align: center; white-space: nowrap; }
	.formula:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.term { border-radius: 0.35rem; padding: 0 0.15rem; }
	.term.step-one { background: #dbeafe; color: #1e40af; }
	.term.step-two { background: #ccfbf1; color: #115e59; }
	.term.step-three { background: #ffedd5; color: #9a3412; }
	.term.scale { background: #f1f5f9; color: #475569; }
	.formula-legend { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0.9rem 0 0; }
	.formula-legend > div { display: grid; gap: 0.3rem; padding: 0.7rem 0.85rem; border-radius: 0.8rem; background: white; }
	.formula-legend dt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 800; }
	.formula-legend dd { margin: 0; color: var(--color-muted); font-size: 0.93rem; line-height: 1.5; }
	.softmax-box { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #c7d2fe; }
	.softmax-box > p:not(.formula-label) { margin: 0.75rem 0 0; }
	.softmax-formula { display: flex; align-items: center; justify-content: center; gap: 0.6rem; }
	.fraction { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1.25; }
	.fraction > span:first-child { padding: 0 0.4rem 0.15rem; border-bottom: 2px solid currentColor; }
	.fraction > span:last-child { padding: 0.15rem 0.4rem 0; }
	.fraction sup { font-size: 0.65em; }
	.fraction.small { font-size: 0.9em; }
	.fraction.small > span:first-child { border-bottom-width: 1.5px; }
	.softmax-example { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1.4rem; overflow-x: auto; margin-top: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.8rem; background: white; color: var(--color-ink); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.95rem; font-weight: 700; }
	.softmax-example > span { display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
	.softmax-example > span:first-child { color: var(--color-muted); font-family: var(--font-sans); }
	.softmax-example:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.extension { margin-top: 1.3rem; padding: 0.9rem 1.1rem; border: 1px solid var(--color-line); border-radius: 0.85rem; background: #f8fbff; }
	.extension summary { color: var(--color-primary); font-weight: 800; cursor: pointer; }
	.extension > p { margin: 0.65rem 0 0; }
	.phase-flow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.8rem; margin: 1rem 0; }
	.phase-card { position: relative; border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 1.1rem; }
	.phase-card:not(:last-child)::after { position: absolute; top: 1.35rem; right: -0.9rem; z-index: 2; color: var(--color-accent); content: '→'; font-weight: 900; }
	.phase-number { display: grid; width: 2rem; height: 2rem; margin-bottom: 0.8rem; place-items: center; border-radius: 50%; background: var(--color-primary); color: white; font-size: 0.8rem; font-weight: 800; }
	.phase-card p { margin: 0; font-size: 0.92rem; }
	.callout-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 1.5rem; }
	.callout-grid > div { border: 1px solid var(--color-line); border-radius: 1rem; padding: 1.2rem; background: #fff; }
	.callout-grid strong { color: var(--color-ink); }
	.callout-grid p { margin: 0.4rem 0 0; font-size: 0.98rem; }
	.paper-layout { display: grid; grid-template-columns: minmax(16rem, 0.9fr) minmax(0, 1.1fr); gap: clamp(1rem, 3vw, 2.25rem); align-items: start; margin-top: 1.25rem; }
	.paper-figure { min-width: 0; margin: 0; border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 0.75rem; }
	.paper-figure img { display: block; width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 8px 24px rgb(23 37 58 / 12%); }
	.paper-figure figcaption { margin-top: 0.7rem; color: var(--color-muted); font-size: 0.82rem; line-height: 1.5; }
	.paper-figure figcaption a { color: var(--color-primary); font-weight: 700; }
	.paper-copy p { font-size: 1.05rem; }
	.paper-copy p + p { margin-top: 0.85rem; }
	.reflection { margin-top: 1.5rem; padding: 1.1rem 1.25rem; border: 1px solid #fcd34d; border-radius: 1rem; background: #fffbeb; }
	.reflection strong { color: #92400e; }
	.reflection p { margin: 0.4rem 0 0; color: #713f12; }
	.causal-explainer { margin-top: 1.75rem; padding-top: 1.5rem; border-top: 1px solid var(--color-line); }
	.causal-layout { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 1.25rem; align-items: start; margin-top: 1rem; }
	.mask-scroll { min-width: 0; overflow-x: auto; border: 1px solid var(--color-line); border-radius: 1rem; background: #fbfdff; padding: 0.75rem; }
	.mask-scroll:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
	.causal-mask { width: 100%; border-collapse: separate; border-spacing: 0.3rem; font-size: 0.95rem; }
	.causal-mask caption { margin-bottom: 0.4rem; color: var(--color-muted); font-size: 0.82rem; text-align: left; }
	.causal-mask th { color: var(--color-ink); font-weight: 800; white-space: nowrap; }
	.causal-mask thead th:first-child { color: var(--color-muted); font-size: 0.75rem; font-weight: 700; }
	.causal-mask td { min-width: 2.6rem; height: 2.4rem; border-radius: 0.5rem; text-align: center; font-weight: 800; }
	.causal-mask tbody tr { animation: rise-in 500ms both; animation-delay: calc(var(--row-index) * 160ms); }
	.causal-mask td.allowed { background: var(--color-accent-soft); color: #115e59; }
	.causal-mask td.blocked { background: repeating-linear-gradient(135deg, #f1f5f9 0 6px, #e2e8f0 6px 12px); color: #94a3b8; }
	.causal-mask td.target { padding: 0 0.6rem; background: #fff7ed; color: #9a3412; white-space: nowrap; }
	.causal-mask .target-head { min-width: 5.5rem; color: #9a3412; font-size: 0.8rem; line-height: 1.2; white-space: normal; }
	.causal-reasons { display: grid; gap: 0.7rem; }
	.causal-reasons > div { border-radius: 0.9rem; background: #f8fbff; padding: 0.85rem 1rem; }
	.causal-reasons strong { color: var(--color-ink); }
	.causal-reasons p { margin: 0.3rem 0 0; font-size: 0.95rem; }
	.try-it { margin-top: 1rem; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	.bridge { background: linear-gradient(140deg, #fff 30%, #eff6ff 100%); }
	.sources { margin-bottom: 0; }
	.sources ul { display: grid; gap: 0.65rem; margin: 1rem 0 1.75rem; padding-left: 1.25rem; color: var(--color-muted); }
	.sources a { color: var(--color-primary); font-weight: 700; text-underline-offset: 0.18em; }
	.back-home { display: inline-block; border-radius: 999px; background: var(--color-primary); padding: 0.7rem 1rem; color: white; font-size: 0.9rem; font-weight: 800; text-decoration: none; }
	.back-home:hover { background: #1e40af; }
	@keyframes rise-in { from { opacity: 0.4; transform: translateY(0.5rem); } to { opacity: 1; transform: translateY(0); } }
	@keyframes read-word { from { opacity: 0; } }
	@media (max-width: 900px) {
		.card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.qkv-grid, .phase-flow, .paper-layout, .causal-layout { grid-template-columns: 1fr; }
		.paper-figure { max-width: 32rem; }
		.phase-card:not(:last-child)::after { top: auto; right: 1rem; bottom: -1.05rem; content: '↓'; }
		.ambiguity-panel { grid-template-columns: 1fr; }
	}
	@media (max-width: 560px) {
		.story-card { border-radius: 1.15rem; }
		.card-grid, .symbol-grid, .callout-grid, .formula-legend { grid-template-columns: 1fr; }
	}
	@media (prefers-reduced-motion: reduce) {
		.mini-card, .era-line li, .forgetting span, .causal-mask tbody tr { animation: none; }
	}
</style>
