<script lang="ts">
	const id = $props.id();

	type PartId = 'system' | 'tools' | 'validation' | 'loop' | 'memory' | 'guardrails' | 'logging';
	const parts: Array<{ id: PartId; label: string; car: string; role: string; consequence: string }> = [
		{ id: 'system', label: 'Prompt de sistema', car: 'el manual del conductor', role: 'Le dice al modelo quién es, qué meta tiene y cómo debe responder.', consequence: 'El modelo no sabe su papel ni el formato esperado: responde como un chatbot genérico y el harness no puede leer sus acciones.' },
		{ id: 'tools', label: 'Herramientas y sus descripciones', car: 'las ruedas', role: 'Las acciones que el agente puede pedir (buscar, consultar) y el texto que explica cada una.', consequence: 'El agente solo puede hablar: no consulta el catálogo ni hace nada en el mundo, así que adivina.' },
		{ id: 'validation', label: 'Validación de llamadas', car: 'el revisor antes de arrancar', role: 'Revisa que los argumentos de cada herramienta estén completos y tengan sentido antes de ejecutarla.', consequence: 'La herramienta se ejecuta con argumentos vacíos. Esto nos pasó de verdad en nuestras pruebas: el modelo pidió una herramienta, olvidó sus argumentos y la herramienta corrió sin datos.' },
		{ id: 'loop', label: 'Control del ciclo', car: 'los frenos', role: 'Pone un límite de pasos (en el laboratorio, 6) y decide cuándo terminar.', consequence: 'El agente puede dar vueltas sin parar, repitiendo la misma acción, y gastar todo tu presupuesto.' },
		{ id: 'memory', label: 'Memoria / historial', car: 'el retrovisor', role: 'Guarda lo que el agente ya hizo y observó, y se lo vuelve a mostrar en cada paso.', consequence: 'El agente olvida lo que ya observó: vuelve a buscar lo mismo o responde sin usar el resultado.' },
		{ id: 'guardrails', label: 'Guardrails', car: 'el cinturón de seguridad', role: 'Permisos por herramienta y confirmación humana antes de acciones delicadas.', consequence: 'El agente obedece instrucciones escondidas en un documento (la inyección de la misión 3) y ejecuta acciones que nadie autorizó.' },
		{ id: 'logging', label: 'Registro y costos', car: 'el tablero', role: 'Anota cada paso, cada llamada y cuántos tokens costó (observabilidad).', consequence: 'No sabes cuánto gastaste ni por qué falló: no hay forma de depurar ni de controlar el presupuesto.' }
	];

	let enabled = $state<Record<PartId, boolean>>({ system: true, tools: true, validation: true, loop: true, memory: true, guardrails: true, logging: true });

	const disabledParts = $derived(parts.filter((part) => !enabled[part.id]));
	const statusText = $derived(disabledParts.length === 0 ? 'Todas las piezas están encendidas: el agente funciona con su harness completo.' : `Apagaste ${disabledParts.length} ${disabledParts.length === 1 ? 'pieza' : 'piezas'}. Mira qué se rompe:`);

	function resetAll() {
		for (const part of parts) enabled[part.id] = true;
	}
</script>

<section class="harness" aria-labelledby="{id}-title">
	<p class="stage-label">El harness</p>
	<h3 id="{id}-title">El modelo es el motor; el harness es el carro</h3>
	<p>Un motor potente solo no te lleva a ningún lado: necesitas volante, frenos, tablero y cinturón. Con un agente pasa igual. El modelo decide la siguiente acción, pero el <strong>harness</strong> es todo el programa que lo rodea: arma el prompt, ejecuta las herramientas, controla el ciclo y te protege.</p>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex (The diagram is keyboard-scrollable on narrow screens.) -->
	<div class="diagram-scroll" role="region" tabindex="0" aria-label="Diagrama: usuario, harness, modelo y herramientas">
		<div class="diagram">
			<div class="node user">Usuario</div>
			<span class="arrow" aria-hidden="true">→</span>
			<div class="node harness-box">
				<strong>Harness</strong>
				<ul aria-label="Piezas del harness">
					{#each parts as part (part.id)}
						<li class:off={!enabled[part.id]}>{part.label}</li>
					{/each}
				</ul>
			</div>
			<div class="side">
				<div class="pair"><span class="arrow" aria-hidden="true">⇄</span><div class="node model">Modelo<small>decide la acción</small></div></div>
				<div class="pair"><span class="arrow" aria-hidden="true">⇄</span><div class="node tools">Herramientas<small>actúan y devuelven datos</small></div></div>
			</div>
		</div>
	</div>
	<p class="caption">El usuario nunca habla directo con el modelo: todo pasa por el harness, que habla con el modelo y con las herramientas.</p>

	<div class="controls">
		<h4>Apaga una pieza y observa qué pasa</h4>
		<ul class="switches">
			{#each parts as part (part.id)}
				<li>
					<label class="switch" class:off={!enabled[part.id]}>
						<input type="checkbox" role="switch" bind:checked={enabled[part.id]} />
						<span class="track" aria-hidden="true"><span class="thumb"></span></span>
						<span class="text">
							<strong>{part.label}</strong>
							<small>{part.car} · {part.role}</small>
						</span>
					</label>
				</li>
			{/each}
		</ul>
		<button type="button" onclick={resetAll} disabled={disabledParts.length === 0}>Encender todo</button>
	</div>

	<div class="consequences" aria-live="polite">
		<p class="status">{statusText}</p>
		{#if disabledParts.length > 0}
			<ul>
				{#each disabledParts as part (part.id)}
					<li class="consequence"><strong>Sin {part.label.toLowerCase()}:</strong> {part.consequence}</li>
				{/each}
			</ul>
		{/if}
	</div>

	<p class="note">Harnesses reales: <strong>Claude Code</strong> y <strong>Cursor</strong> envuelven a un modelo con estas mismas piezas para programar. En el laboratorio construiremos el nuestro con bloques.</p>
</section>

<style>
	.harness { margin-top: 1.5rem; padding: clamp(1rem, 2.5vw, 1.75rem); border: 1px solid #d9e1eb; border-radius: 1rem; background: #f8fbff; }
	.stage-label { margin: 0 0 .35rem; color: #0f766e; font-size: .78rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
	h3 { margin: 0 0 .65rem; color: #17253a; font-size: clamp(1.3rem, 2.6vw, 1.8rem); }
	h4 { margin: 0 0 .5rem; color: #17253a; font-size: 1.2rem; }
	p { max-width: 76ch; color: #52627a; line-height: 1.6; }
	.diagram-scroll { margin-top: 1rem; overflow-x: auto; border-radius: 1rem; }
	.diagram-scroll:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.diagram { display: flex; align-items: center; gap: .6rem; min-width: 34rem; padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: white; }
	.node { padding: .6rem .9rem; border: 2px solid #d9e1eb; border-radius: .8rem; color: #17253a; font-weight: 800; text-align: center; }
	.node small { display: block; color: #52627a; font-size: .8rem; font-weight: 600; }
	.user { border-color: #94a3b8; }
	.harness-box { flex: 1; border-color: #1d4ed8; background: #dbeafe; text-align: left; }
	.harness-box ul { display: flex; flex-wrap: wrap; gap: .3rem; margin: .4rem 0 0; padding: 0; list-style: none; }
	.harness-box li { padding: .15rem .55rem; border: 1px solid #1d4ed8; border-radius: 999px; background: white; font-size: .82rem; font-weight: 700; transition: opacity .3s ease; }
	.harness-box li.off { border-style: dashed; border-color: #b91c1c; color: #b91c1c; opacity: .55; text-decoration: line-through; }
	.side { display: grid; gap: .6rem; }
	.pair { display: flex; align-items: center; gap: .5rem; }
	.model { border-color: #0f766e; background: #ccfbf1; }
	.tools { border-color: #f97316; background: #fff7ed; }
	.arrow { color: #17253a; font-size: 1.5rem; font-weight: 800; }
	.caption { font-size: .92rem; }
	.controls, .consequences { margin-top: 1rem; padding: 1rem; border: 1px solid #d9e1eb; border-radius: 1rem; background: #fbfdff; }
	.switches { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr)); gap: .5rem; margin: 0 0 .75rem; padding: 0; list-style: none; }
	.switch { position: relative; display: flex; gap: .7rem; align-items: flex-start; height: 100%; padding: .65rem .8rem; border: 1px solid #1d4ed8; border-radius: .8rem; background: white; cursor: pointer; box-sizing: border-box; }
	.switch.off { border-color: #d9e1eb; background: #f1f5f9; }
	.switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
	.track { flex: none; position: relative; width: 2.6rem; height: 1.5rem; margin-top: .1rem; border-radius: 999px; background: #1d4ed8; transition: background .2s ease; }
	.thumb { position: absolute; top: .2rem; left: 1.3rem; width: 1.1rem; height: 1.1rem; border-radius: 50%; background: white; transition: left .2s ease; }
	.switch.off .track { background: #94a3b8; }
	.switch.off .thumb { left: .2rem; }
	.switch input:focus-visible + .track { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.text strong { display: block; color: #17253a; }
	.text small { color: #52627a; font-size: .88rem; line-height: 1.4; }
	button { min-height: 2.75rem; padding: .45rem 1rem; border: 1px solid #94a3b8; border-radius: 999px; background: white; color: #17253a; font: inherit; font-weight: 800; cursor: pointer; }
	button:disabled { opacity: .5; cursor: not-allowed; }
	button:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
	.status { margin: 0; color: #17253a; font-weight: 800; }
	.consequences ul { display: grid; gap: .5rem; margin: .6rem 0 0; padding: 0; list-style: none; }
	.consequence { padding: .6rem .9rem; border-left: 4px solid #b91c1c; border-radius: .5rem; background: #fef2f2; color: #17253a; line-height: 1.5; }
	.note { margin-bottom: 0; font-size: .95rem; }
	@media (prefers-reduced-motion: reduce) { .track, .thumb, .harness-box li { transition: none; } }
</style>
