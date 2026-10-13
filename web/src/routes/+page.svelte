<svelte:head>
	<title>Entorno listo</title>
	<meta
		name="description"
		content="El entorno local de desarrollo está preparado."
	/>
</svelte:head>

<main class="min-h-screen bg-slate-50 text-slate-900">
	<div class="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
		<section class="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
			<p class="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
				Entorno local
			</p>
			<h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Entorno listo</h1>
			<p class="mt-4 max-w-2xl leading-7 text-slate-600">
				La aplicación base está preparada para el desarrollo local. No hay servicios externos
				configurados.
			</p>
			<ul class="mt-8 flex flex-wrap gap-2 text-sm text-slate-700" aria-label="Tecnologías">
				<li class="rounded-full bg-slate-100 px-3 py-1.5">SvelteKit</li>
				<li class="rounded-full bg-slate-100 px-3 py-1.5">TypeScript</li>
				<li class="rounded-full bg-slate-100 px-3 py-1.5">Tailwind CSS 4</li>
			</ul>
		</section>
	</div>
</main>
