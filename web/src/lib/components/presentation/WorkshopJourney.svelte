<script lang="ts">
	let { active, reducedMotion }: { active: boolean; reducedMotion: boolean } = $props();
</script>

<div class="mt-9" role="group" aria-label="Estructura del taller">
	<ol class="journey-track" class:animate-sequence={active && !reducedMotion}>
		<li class="journey-stop session-stop">
			<span class="stop-marker" aria-hidden="true">01</span>
			<div class="stop-card">
				<p class="text-sm font-semibold uppercase tracking-wide text-accent">Sesión 1 · 2 horas</p>
				<h2 class="mt-2 text-xl font-bold text-ink">Fundamentos</h2>
				<p class="mt-2 text-muted">Exploraremos la IA, el deep learning y las matemáticas del entrenamiento.</p>
			</div>
		</li>
		<li class="journey-stop break-stop">
			<span class="stop-marker" aria-hidden="true">P</span>
			<div class="stop-card">
				<p class="text-sm font-semibold uppercase tracking-wide text-muted">Pausa</p>
				<h2 class="mt-2 text-xl font-bold text-ink">Tomemos una pausa</h2>
			</div>
		</li>
		<li class="journey-stop session-stop">
			<span class="stop-marker" aria-hidden="true">02</span>
			<div class="stop-card">
				<p class="text-sm font-semibold uppercase tracking-wide text-accent">Sesión 2 · 2 horas</p>
				<h2 class="mt-2 text-xl font-bold text-ink">Aplicaciones prácticas</h2>
				<p class="mt-2 text-muted">Conectaremos NLP, modelos de lenguaje y agentes de inteligencia artificial.</p>
			</div>
		</li>
		<li class="journey-stop quiz-stop">
			<span class="stop-marker" aria-hidden="true">03</span>
			<div class="stop-card">
				<p class="text-sm font-semibold uppercase tracking-wide text-accent">Cierre</p>
				<h2 class="mt-2 text-xl font-bold text-ink">Repaso y reconocimiento</h2>
				<p class="mt-2 text-muted">Repasaremos con un quiz y reconoceremos las tres mejores puntuaciones.</p>
			</div>
		</li>
	</ol>
	<p class="mt-6 rounded-xl bg-primary-soft px-5 py-4 text-muted">
		Al inscribirnos, conservamos nuestros datos en este navegador. Más adelante participaremos en desafíos y un quiz en vivo; también podremos consultar el contenido a nuestro ritmo.
	</p>
</div>

<style>
	.journey-track {
		position: relative;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
		list-style: none;
		padding: 0;
	}

	.journey-stop {
		position: relative;
		z-index: 1;
		min-width: 0;
		opacity: 1;
		transform: none;
	}

	.stop-marker {
		display: grid;
		width: 2.5rem;
		height: 2.5rem;
		place-items: center;
		border: 2px solid var(--color-primary);
		border-radius: 9999px;
		background: var(--color-surface);
		color: var(--color-primary);
		font-weight: 700;
	}

	.break-stop .stop-marker {
		border-color: var(--color-line);
		color: var(--color-muted);
	}

	.stop-card {
		margin-top: 1rem;
		min-width: 0;
		min-height: 10rem;
		padding: 1.25rem;
		border: 1px solid var(--color-line);
		border-radius: 1rem;
		background: var(--color-surface);
	}

	/* Each stop connects its marker center directly to the next stop. */
	.journey-stop:not(:last-child)::after {
		position: absolute;
		top: calc(1.25rem - 1px);
		left: 1.25rem;
		width: calc(100% + 1rem);
		height: 2px;
		background: var(--color-accent);
		content: '';
		z-index: -1;
		transform-origin: left;
	}
	.animate-sequence .stop-marker { animation: reveal-marker 450ms ease-out both; }
	.animate-sequence .journey-stop::after { animation: connect-journey 650ms ease-out 500ms both; }
	.animate-sequence .stop-card { animation: reveal-card 450ms ease-out 1.2s both; }
	@keyframes connect-journey { from { transform: scaleX(0); } to { transform: scaleX(1); } }
	@keyframes connect-journey-vertical { from { transform: scaleY(0); } to { transform: scaleY(1); } }
	@keyframes reveal-marker { from { opacity: 0.25; } to { opacity: 1; } }
	@keyframes reveal-card { from { opacity: 0.4; } to { opacity: 1; } }

	@media (max-width: 1000px) {
		.journey-track { grid-template-columns: minmax(0, 1fr); gap: 0.75rem; }
		.journey-stop { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr); align-items: start; gap: 0.75rem; }
		.journey-stop:not(:last-child)::after {
			top: 1.25rem;
			left: calc(1.25rem - 1px);
			width: 2px;
			height: calc(100% + 0.75rem);
			transform-origin: top;
		}
		.stop-card { grid-column: 2; margin-top: 0; min-height: 0; padding: 1rem; overflow-wrap: anywhere; }
		.animate-sequence .journey-stop::after { animation-name: connect-journey-vertical; }
	}
	@media (prefers-reduced-motion: reduce) {
		.animate-sequence .stop-marker, .animate-sequence .journey-stop::after, .animate-sequence .stop-card { animation: none; }
	}
</style>
