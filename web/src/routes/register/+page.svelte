<script lang="ts">
	import { onMount } from 'svelte';
	import type { LocalSession } from '../../lib/state/local-session.js';
	import { getLocalSession } from '../../lib/state/session-context.js';

	const localSession = getLocalSession();
	let currentSession = $state<LocalSession>({ registration: null, progress: 0 });
	let name = $state('');
	let studentId = $state('');
	let errors = $state<{ name?: string; studentId?: string }>({});
	let editing = $state(false);
	let statusMessage = $state('');

	onMount(() => {
		localSession.hydrate();
		const unsubscribe = localSession.session.subscribe((value) => {
			currentSession = value;
			name = value.registration?.name ?? '';
		});
		return unsubscribe;
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const cleanName = name.trim();
		const cleanStudentId = studentId.trim();
		const nextErrors: typeof errors = {};

		if (cleanName.length < 2 || cleanName.length > 80) {
			nextErrors.name = 'Escribe un nombre de entre 2 y 80 caracteres.';
		}
		if (!currentSession.registration && !cleanStudentId) {
			nextErrors.studentId = 'El carnet es necesario para completar la inscripción.';
		} else if (cleanStudentId && !/^[\p{L}\p{N}-]{3,30}$/u.test(cleanStudentId)) {
			nextErrors.studentId = 'Usa entre 3 y 30 letras, números o guiones.';
		}

		errors = nextErrors;
		if (Object.keys(nextErrors).length > 0) {
			statusMessage = 'Revisa los campos señalados.';
			document.getElementById(nextErrors.name ? 'student-name' : 'student-id')?.focus();
			return;
		}

		localSession.setRegistration({
			name: cleanName,
			studentId: cleanStudentId || currentSession.registration!.studentId
		});
		studentId = '';
		editing = false;
		statusMessage = 'Tus datos se guardaron en este navegador.';
	}

	function beginEditing() {
		editing = true;
		name = currentSession.registration?.name ?? '';
		studentId = '';
		statusMessage = '';
		errors = {};
	}
</script>

<svelte:head>
	<title>Inscripción | De Neuronas a Agentes Seguros</title>
	<meta name="description" content="Registra tu nombre y carnet para participar en las actividades en vivo del taller." />
</svelte:head>

<main class="min-h-screen px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
	<section class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-start" aria-labelledby="registration-title">
		<div class="space-y-5">
			<p class="text-sm font-bold text-accent">Participación en vivo</p>
			<h1 id="registration-title" class="max-w-2xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
				Me sumo al taller
			</h1>
			<p class="max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
				Guardemos nuestro nombre y carnet en este navegador. Podemos recorrer la presentación sin inscribirnos; las actividades en vivo llegarán después.
			</p>
			<a class="inline-flex rounded-lg font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary" href="/">
				Volver a la presentación
			</a>
		</div>

		<div class="rounded-panel border border-line bg-surface p-6 shadow-panel sm:p-8">
			<p class="sr-only" aria-live="polite" role="status">{statusMessage}</p>
			{#if currentSession.registration && !editing}
				<div class="space-y-5" aria-labelledby="saved-registration-title">
					<div class="space-y-2">
						<p class="text-sm font-bold text-success">Inscripción guardada</p>
						<h2 id="saved-registration-title" class="text-2xl font-bold text-ink">Hola, {currentSession.registration.name.split(' ')[0]}</h2>
						<p class="text-base leading-relaxed text-muted">Tu carnet está registrado en este navegador. No necesitas volver a ingresarlo para continuar.</p>
					</div>
					<button class="rounded-lg border border-line px-5 py-3 font-semibold text-ink hover:bg-canvas" type="button" onclick={beginEditing}>
						Actualizar mis datos
					</button>
					<p class="text-sm text-muted">Los datos se conservan solo en este perfil del navegador.</p>
				</div>
			{:else}
				<h2 class="mb-6 text-2xl font-bold text-ink">{currentSession.registration ? 'Actualizar mis datos' : 'Mis datos'}</h2>
				<form class="space-y-5" onsubmit={handleSubmit} novalidate>
					<div class="space-y-2">
						<label class="block font-semibold text-ink" for="student-name">Nombre</label>
						<input
							class="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink placeholder:text-muted/80 focus:border-primary"
							id="student-name"
							name="name"
							autocomplete="name"
							required
							minlength="2"
							maxlength="80"
							bind:value={name}
							aria-invalid={Boolean(errors.name)}
							aria-describedby="name-help name-error"
						/>
						<p class="text-sm text-muted" id="name-help">Puedes usar tu nombre de pila o el nombre con el que prefieres participar.</p>
						{#if errors.name}<p class="text-sm font-semibold text-red-700" id="name-error">{errors.name}</p>{:else}<span id="name-error" class="sr-only"></span>{/if}
					</div>

					<div class="space-y-2">
						<label class="block font-semibold text-ink" for="student-id">Carnet universitario</label>
						<input
							class="w-full rounded-lg border border-line bg-white px-4 py-3 text-ink placeholder:text-muted/80 focus:border-primary"
							id="student-id"
							name="studentId"
							autocomplete="off"
							maxlength="30"
							placeholder={currentSession.registration ? 'Deja en blanco para conservarlo' : 'Escribe tu carnet'}
							bind:value={studentId}
							aria-invalid={Boolean(errors.studentId)}
							aria-describedby="student-id-help student-id-error"
						/>
						<p class="text-sm text-muted" id="student-id-help">{currentSession.registration ? 'Al actualizar, puedes dejarlo en blanco para conservar el carnet actual.' : 'Se guarda en este navegador y no se muestra en la interfaz.'}</p>
						{#if errors.studentId}<p class="text-sm font-semibold text-red-700" id="student-id-error">{errors.studentId}</p>{:else}<span id="student-id-error" class="sr-only"></span>{/if}
					</div>

					<div class="flex flex-wrap items-center gap-4 pt-1">
						<button class="rounded-lg bg-primary px-5 py-3 font-bold text-white hover:bg-blue-800" type="submit">
							{currentSession.registration ? 'Guardar cambios' : 'Guardar inscripción'}
						</button>
						{#if currentSession.registration}
							<button class="rounded-lg px-3 py-3 font-semibold text-muted underline underline-offset-4 hover:text-ink" type="button" onclick={() => (editing = false)}>
								Cancelar
							</button>
						{/if}
					</div>
				</form>
			{/if}
			<p class="mt-7 border-t border-line pt-5 text-sm leading-relaxed text-muted">
				La cantidad de personas activas que aparece en la navegación es una simulación visual y no representa participantes conectados.
			</p>
		</div>
	</section>
</main>
