<script lang="ts">
	import { tokenizeText, TOY_VOCABULARY_SIZE, UNKNOWN_TOKEN_ID } from '#lib/domain/language/text-tokenizer.js';

	const DEFAULT_TEXT = 'Hoy en Chiquimula aprendemos inteligencia artificial';
	const CHALLENGE_WORD = 'Chiquimula';
	const challengeOptions = [
		{ label: '1', value: 1 },
		{ label: '2', value: 2 },
		{ label: '3', value: 3 },
		{ label: '4+', value: 4 }
	];

	let text = $state(DEFAULT_TEXT);
	let challengeGuess = $state<number | null>(null);

	const tokens = $derived(tokenizeText(text));
	const wordCount = $derived(text.match(/[^\s.,;:¿?¡!]+/gu)?.length ?? 0);
	const challengeTokens = tokenizeText(CHALLENGE_WORD);
	const challengeCount = challengeTokens.length;
	const challengeMatches = $derived(
		challengeGuess !== null && (challengeGuess === challengeCount || (challengeGuess === 4 && challengeCount >= 4))
	);
</script>

<section class="tokenizer-playground" aria-labelledby="tokenizer-title">
	<p class="stage-label">Tokenización</p>
	<h3 id="tokenizer-title">De texto a números</h3>
	<p class="intro">Voy a cortar tu frase en piezas llamadas <strong>tokens</strong>. Cada token tiene un número (su ID) dentro de un vocabulario. Esos IDs son lo que la red realmente recibe: la red de la mañana solo entiende números.</p>

	<div class="challenge">
		<h4>Reto</h4>
		<p>¿En cuántos tokens crees que se divide «{CHALLENGE_WORD}»?</p>
		<div class="options" role="group" aria-label="Número de tokens">
			{#each challengeOptions as option (option.label)}
				<button type="button" class:selected={challengeGuess === option.value} aria-pressed={challengeGuess === option.value} onclick={() => (challengeGuess = option.value)}>{option.label}</button>
			{/each}
		</div>
		<div aria-live="polite">
			{#if challengeGuess !== null}
				<div class="challenge-result">
					<p>
						<strong>{challengeMatches ? '¡Correcto!' : 'Casi.'}</strong>
						Nuestro tokenizador divide «{CHALLENGE_WORD}» en <strong>{challengeCount} tokens</strong>:
					</p>
					<ol class="chips compact">
						{#each challengeTokens as token, index (index)}
							<li class="chip" class:continuation={!token.wordStart}><span class="piece">{token.piece}</span><span class="id">ID {token.id}</span></li>
						{/each}
					</ol>
					<p>Cuando una palabra no está completa en el vocabulario, el tokenizador la parte en piezas que sí conoce. Los tokenizadores reales, como BPE, aprenden decenas de miles de piezas a partir de muchísimo texto; el nuestro es un vocabulario diminuto hecho a mano, así que los cortes no serán idénticos a los de un modelo real.</p>
				</div>
			{/if}
		</div>
	</div>

	{#if challengeGuess === null}
		<p class="empty">Responde primero el reto; después abro el tokenizador para que pruebes tus propias frases.</p>
	{:else}
	<div class="input-row">
		<label for="tokenizer-input">Escribe una frase</label>
		<div class="input-controls">
			<input id="tokenizer-input" type="text" bind:value={text} autocomplete="off" spellcheck="false" />
			<button type="button" onclick={() => (text = CHALLENGE_WORD)}>Probar «{CHALLENGE_WORD}»</button>
			<button type="button" class="secondary" onclick={() => (text = DEFAULT_TEXT)}>Frase inicial</button>
		</div>
	</div>

	<div class="output" aria-live="polite">
		<p class="counts">
			<span><strong>{wordCount}</strong> palabras</span>
			<span><strong>{tokens.length}</strong> tokens</span>
			<span>Vocabulario de juguete: <strong>{TOY_VOCABULARY_SIZE}</strong> piezas</span>
		</p>
		{#if tokens.length === 0}
			<p class="empty">Escribe algo para ver sus tokens.</p>
		{:else}
			<ol class="chips" aria-label="Tokens de la frase">
				{#each tokens as token, index (index)}
					<li class="chip" class:word-start={token.wordStart && index > 0} class:continuation={!token.wordStart} class:unknown={token.id === UNKNOWN_TOKEN_ID}>
						<span class="piece">{token.piece}</span>
						<span class="id">ID {token.id}</span>
						{#if !token.wordStart}<span class="sr-only">(continúa la palabra anterior)</span>{/if}
					</li>
				{/each}
			</ol>
			<p class="legend">
				<span class="legend-item"><span class="swatch start"></span>inicio de palabra</span>
				<span class="legend-item"><span class="swatch cont"></span>continuación</span>
				<span class="legend-item"><span class="swatch unk"></span>desconocido (&lt;unk&gt;)</span>
			</p>
			<p class="ids">Lo que entra a la red: <code>[{tokens.map((token) => token.id).join(', ')}]</code></p>
		{/if}
	</div>
	{/if}
</section>

<style>
	.tokenizer-playground { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	h4 { margin: 0 0 .35rem; color: #17253a; font-size: 1.1rem; }
	.intro { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.challenge { margin: 1rem 0; padding: 1rem; border: 1px solid #d9e1eb; border-left: 5px solid #f97316; border-radius: 1rem; background: #fbfdff; }
	.challenge p { margin: .35rem 0; color: #24364b; line-height: 1.55; }
	.options { display: flex; flex-wrap: wrap; gap: .5rem; margin: .6rem 0; }
	button { min-height: 2.6rem; padding: .45rem .95rem; border: 1px solid #1d4ed8; border-radius: 999px; background: #1d4ed8; color: white; font: inherit; font-weight: 800; cursor: pointer; }
	.options button { min-width: 3.2rem; border-color: #94a3b8; background: white; color: #17253a; font-size: 1.05rem; }
	.options button.selected { border-color: #1d4ed8; background: #dbeafe; color: #1d4ed8; }
	button.secondary { background: white; color: #1d4ed8; }
	button:focus-visible, input:focus-visible { outline: 3px solid #93c5fd; outline-offset: 3px; }
	.challenge-result { margin-top: .5rem; padding: .75rem; border-radius: .75rem; background: #f0fdfa; }
	.input-row { display: grid; gap: .4rem; margin: 1rem 0; }
	.input-row label { color: #17253a; font-weight: 800; }
	.input-controls { display: flex; flex-wrap: wrap; gap: .5rem; }
	.input-controls input { flex: 1 1 16rem; min-width: 0; min-height: 2.75rem; padding: .5rem .75rem; border: 1px solid #94a3b8; border-radius: .7rem; color: #17253a; font: inherit; font-size: 1.1rem; }
	.output { padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.counts { display: flex; flex-wrap: wrap; gap: .5rem 1.25rem; margin: 0 0 .8rem; color: #52627a; }
	.counts strong { color: #17253a; font-size: 1.25rem; font-variant-numeric: tabular-nums; }
	.chips { display: flex; flex-wrap: wrap; align-items: stretch; gap: .5rem .2rem; margin: 0; padding: 0; list-style: none; }
	.chips.compact { margin: .5rem 0; }
	.chip { display: grid; justify-items: center; gap: .1rem; padding: .4rem .6rem; border: 1px solid #93c5fd; border-left: 4px solid #1d4ed8; border-radius: .6rem; background: #dbeafe; }
	.chip.word-start { margin-left: .8rem; }
	.chip.continuation { border-color: #5eead4; border-left: 1px dashed #0f766e; background: #ccfbf1; }
	.chip.unknown { border: 2px dashed #f97316; background: #ffedd5; }
	.piece { color: #17253a; font-size: 1.15rem; font-weight: 800; }
	.id { color: #52627a; font-size: .78rem; font-variant-numeric: tabular-nums; }
	.legend { display: flex; flex-wrap: wrap; gap: .4rem 1rem; margin: .9rem 0 .4rem; color: #52627a; font-size: .85rem; }
	.legend-item { display: inline-flex; align-items: center; gap: .35rem; }
	.swatch { display: inline-block; width: 1rem; height: 1rem; border-radius: .25rem; }
	.swatch.start { background: #dbeafe; border-left: 4px solid #1d4ed8; }
	.swatch.cont { background: #ccfbf1; border: 1px dashed #0f766e; }
	.swatch.unk { background: #ffedd5; border: 2px dashed #f97316; }
	.ids { margin: .5rem 0 0; color: #24364b; overflow-wrap: anywhere; }
	.ids code { color: #17253a; font-weight: 750; }
	.empty { color: #52627a; }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>
