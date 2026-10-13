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
				<p class="mt-2 text-muted">Inteligencia artificial, deep learning y matemáticas del entrenamiento.</p>
			</div>
		</li>
		<li class="journey-stop break-stop">
			<span class="stop-marker" aria-hidden="true">P</span>
			<div class="stop-card">
				<p class="text-sm font-semibold uppercase tracking-wide text-muted">Pausa</p>
				<h2 class="mt-2 text-xl font-bold text-ink">Un momento para descansar</h2>
			</div>
		</li>
		<li class="journey-stop session-stop">
			<span class="stop-marker" aria-hidden="true">02</span>
			<div class="stop-card">
				<p class="text-sm font-semibold uppercase tracking-wide text-accent">Sesión 2 · 2 horas</p>
				<h2 class="mt-2 text-xl font-bold text-ink">Aplicaciones prácticas</h2>
				<p class="mt-2 text-muted">NLP, modelos de lenguaje y agentes de inteligencia artificial.</p>
			</div>
		</li>
		<li class="journey-stop quiz-stop">
			<span class="stop-marker" aria-hidden="true">03</span>
			<div class="stop-card">
				<p class="text-sm font-semibold uppercase tracking-wide text-accent">Cierre</p>
				<h2 class="mt-2 text-xl font-bold text-ink">Repaso y reconocimiento</h2>
				<p class="mt-2 text-muted">Un quiz final y reconocimiento para las tres mejores puntuaciones.</p>
			</div>
		</li>
	</ol>
	<p class="mt-6 rounded-xl bg-primary-soft px-5 py-4 text-muted">
		La inscripción permite participar en los desafíos y el quiz en vivo. El contenido también podrá consultarse de forma asincrónica.
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

	.journey-track::before {
		position: absolute;
		top: 1.25rem;
		right: 12.5%;
		left: 12.5%;
		z-index: 0;
		height: 2px;
		background: var(--color-line);
		content: '';
		transform: scaleX(0);
		transform-origin: left;
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

	.animate-sequence::before {
		animation: connect-journey 850ms ease-out forwards;
	}

	.animate-sequence .journey-stop {
		animation: reveal-stop 500ms ease-out both;
	}

	.animate-sequence .journey-stop:nth-child(2) { animation-delay: 250ms; }
	.animate-sequence .journey-stop:nth-child(3) { animation-delay: 450ms; }
	.animate-sequence .journey-stop:nth-child(4) { animation-delay: 650ms; }

	@keyframes connect-journey {
		to { transform: scaleX(1); }
	}

	@keyframes connect-journey-vertical {
		to { transform: scaleY(1); }
	}

	@keyframes reveal-stop {
		from { opacity: 0.25; transform: translateY(0.5rem); }
		to { opacity: 1; transform: translateY(0); }
	}

	@media (max-width: 900px) {
		.journey-track {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.journey-track::before { display: none; }
		.stop-card { min-height: 8rem; }
	}

	@media (max-width: 640px) {
		.journey-track {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.75rem;
		}

		.journey-track::before {
			display: block;
			top: 1.25rem;
			right: auto;
			bottom: 1.25rem;
			left: 1.25rem;
			width: 2px;
			height: auto;
			transform: scaleY(0);
			transform-origin: top;
		}

		.journey-stop {
			display: grid;
			grid-template-columns: 2.5rem minmax(0, 1fr);
			align-items: start;
			gap: 0.75rem;
		}

		.stop-card {
			grid-column: 2;
			margin-top: 0;
			min-height: 0;
			padding: 1rem;
			overflow-wrap: anywhere;
		}

		.animate-sequence::before {
			animation-name: connect-journey-vertical;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-sequence::before,
		.animate-sequence .journey-stop {
			animation: none;
		}

		.animate-sequence::before { transform: none; }
	}
</style>
