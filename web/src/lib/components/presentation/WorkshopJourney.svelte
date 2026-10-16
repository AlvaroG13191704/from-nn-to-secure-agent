<script lang="ts">
	let { active, reducedMotion }: { active: boolean; reducedMotion: boolean } = $props();
</script>

<div class="journey" role="group" aria-label="Estructura del taller">
	<ol class="journey-track" class:animate-sequence={active && !reducedMotion}>
		<li class="journey-stop">
			<span class="stop-marker" aria-hidden="true">1</span>
			<div class="stop-card">
				<p class="stop-meta">Sesión 1, 2 horas</p>
				<h2>Fundamentos</h2>
				<p>Exploraremos la IA, el deep learning y las matemáticas del entrenamiento.</p>
			</div>
		</li>
		<li class="journey-stop break-stop">
			<span class="stop-marker" aria-hidden="true"></span>
			<div class="stop-card">
				<p class="stop-meta">Pausa</p>
				<h2>Tomemos una pausa</h2>
			</div>
		</li>
		<li class="journey-stop">
			<span class="stop-marker" aria-hidden="true">2</span>
			<div class="stop-card">
				<p class="stop-meta">Sesión 2, 2 horas</p>
				<h2>Aplicaciones prácticas</h2>
				<p>Conectaremos NLP, modelos de lenguaje y agentes de inteligencia artificial.</p>
			</div>
		</li>
	</ol>
	<p class="journey-note">
		Al inscribirnos, conservamos nuestros datos en este navegador. Cada sesión termina con un laboratorio guiado, y podremos volver al contenido a nuestro ritmo.
	</p>
</div>

<style>
	/* The layout follows the space the journey receives (side column or full width), not the viewport. */
	.journey { min-width: 0; container-type: inline-size; }

	.journey-track {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.journey-stop {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 2.5rem minmax(0, 1fr);
		align-items: start;
		gap: 1rem;
		min-width: 0;
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
		font-family: var(--font-serif);
		font-weight: 600;
	}

	.break-stop .stop-marker { border-color: var(--color-line); }

	.stop-card {
		min-width: 0;
		padding: 1rem 1.25rem;
		border: 1px solid var(--color-line);
		border-radius: 0.5rem;
		background: var(--color-surface);
		overflow-wrap: anywhere;
	}

	.break-stop .stop-card { background: var(--color-canvas); }
	.stop-meta { margin: 0; color: var(--color-accent); font-size: 0.95rem; font-weight: 700; }
	.break-stop .stop-meta { color: var(--color-muted); }
	.stop-card h2 { margin: 0.35rem 0 0; color: var(--color-ink); font-size: 1.35rem; font-weight: 600; line-height: 1.2; }
	.stop-card p:not(.stop-meta) { margin: 0.5rem 0 0; color: var(--color-muted); line-height: 1.55; }

	/* Each stop connects its marker center directly to the next stop. */
	.journey-stop:not(:last-child)::after {
		position: absolute;
		top: 1.25rem;
		left: calc(1.25rem - 1px);
		z-index: -1;
		width: 2px;
		height: calc(100% + 0.75rem);
		background: var(--color-accent);
		content: '';
		transform-origin: top;
	}

	.journey-note {
		margin: 1.5rem 0 0;
		padding: 1rem 1.2rem;
		border-left: 4px solid var(--color-primary);
		background: #f1f4fd;
		color: var(--color-muted);
		line-height: 1.55;
	}

	@container (min-width: 60rem) {
		.journey-track { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
		.journey-stop { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
		.stop-card { min-height: 10rem; }
		.journey-stop:not(:last-child)::after {
			top: calc(1.25rem - 1px);
			left: 1.25rem;
			width: calc(100% + 1rem);
			height: 2px;
			transform-origin: left;
		}
	}

	/* The single orchestrated moment of this panel: the route draws itself when we arrive. */
	.animate-sequence .stop-marker { animation: reveal-marker 450ms ease-out both; }
	.animate-sequence .journey-stop::after { animation: connect-journey-vertical 650ms ease-out 500ms both; }
	.animate-sequence .stop-card { animation: reveal-card 450ms ease-out 1.2s both; }
	@container (min-width: 60rem) {
		.animate-sequence .journey-stop::after { animation-name: connect-journey; }
	}
	@keyframes connect-journey { from { transform: scaleX(0); } to { transform: scaleX(1); } }
	@keyframes connect-journey-vertical { from { transform: scaleY(0); } to { transform: scaleY(1); } }
	@keyframes reveal-marker { from { opacity: 0.25; } to { opacity: 1; } }
	@keyframes reveal-card { from { opacity: 0.4; } to { opacity: 1; } }

	@media (prefers-reduced-motion: reduce) {
		.animate-sequence .stop-marker, .animate-sequence .journey-stop::after, .animate-sequence .stop-card { animation: none; }
	}
</style>
