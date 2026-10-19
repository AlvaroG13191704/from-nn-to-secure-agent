<script lang="ts">
	import { BACKPROP_EXAMPLE as p, BACKPROP_PARAMETER_NAMES, calculateBackpropagation } from '#lib/domain/backpropagation.js';
	import { formatNumber as fmt } from './format-number.js';
	import StepControls from './StepControls.svelte';

	const { forward: f, gradients: g, updated: u, nextForward: n } = calculateBackpropagation(p);
	const eta = p.learningRate;
	const par = (value: number) => (value < 0 ? `(${fmt(value)})` : fmt(value));
	const symbol: Record<string, string> = { w1: 'w₁', b1: 'b₁', w2: 'w₂', b2: 'b₂', v1: 'v₁', v2: 'v₂', c: 'c' };

	type Step = { phase: 'inicio' | 'adelante' | 'atrás' | 'actualizar'; title: string; general: string; worked: string[]; note: string; fwd?: string[]; back?: string[]; focus?: string[] };
	const steps: Step[] = [
		{ phase: 'inicio', title: 'La red antes de calcular', general: `x = ${p.x},  y = ${p.y},  η = ${eta}`, worked: ['Siete parámetros: w₁, b₁, w₂, b₂ (capa oculta) y v₁, v₂, c (salida).'], note: 'Usamos una entrada, dos neuronas ocultas con ReLU y una salida. Queremos que la predicción se acerque a y = 4.' },
		{ phase: 'adelante', title: 'Neurona oculta 1', general: 'z₁ = w₁·x + b₁,   h₁ = ReLU(z₁)', worked: [`z₁ = ${fmt(p.w1)} × ${p.x} + ${par(p.b1)} = ${fmt(f.z1)}`, `h₁ = ReLU(${fmt(f.z1)}) = ${fmt(f.h1)}`], note: 'Cada neurona hace la suma ponderada que ya conocemos y luego aplica ReLU: si z es positivo lo deja pasar, si es negativo lo vuelve 0.', fwd: ['w1'], focus: ['h1'] },
		{ phase: 'adelante', title: 'Neurona oculta 2', general: 'z₂ = w₂·x + b₂,   h₂ = ReLU(z₂)', worked: [`z₂ = ${fmt(p.w2)} × ${p.x} + ${par(p.b2)} = ${fmt(f.z2)}`, `h₂ = ReLU(${fmt(f.z2)}) = ${fmt(f.h2)}`], note: 'Guardamos z y h de cada neurona: los necesitaremos al regresar.', fwd: ['w2'], focus: ['h2'] },
		{ phase: 'adelante', title: 'Neurona de salida', general: 'ŷ = v₁·h₁ + v₂·h₂ + c', worked: [`ŷ = ${fmt(p.v1)} × ${fmt(f.h1)} + ${fmt(p.v2)} × ${fmt(f.h2)} + ${fmt(p.c)} = ${fmt(f.prediction)}`], note: 'La salida combina lo que produjeron las dos neuronas ocultas.', fwd: ['v1', 'v2'], focus: ['y'] },
		{ phase: 'adelante', title: 'Pérdida', general: 'L = ½ (ŷ − y)²', worked: [`L = ½ (${fmt(f.prediction)} − ${p.y})² = ½ × ${fmt(f.error ** 2)} = ${fmt(f.loss)}`], note: 'Predijimos 2 y esperábamos 4. Ahora comienza el regreso: ¿cuánto contribuyó cada parámetro a este error?', fwd: ['loss'], focus: ['L'] },
		{ phase: 'atrás', title: 'La señal de error nace en la salida', general: '∂L/∂ŷ = ŷ − y', worked: [`∂L/∂ŷ = ${fmt(f.prediction)} − ${p.y} = ${fmt(g.prediction)}`], note: 'Este es el primer número que viaja hacia atrás. Es negativo: si ŷ subiera, la pérdida bajaría.', back: ['loss'], focus: ['y', 'g-prediction'] },
		{ phase: 'atrás', title: 'Gradiente del peso v₁', general: '∂L/∂v₁ = ∂L/∂ŷ · h₁', worked: [`∂L/∂v₁ = ${par(g.prediction)} × ${fmt(f.h1)} = ${fmt(g.v1)}`], note: 'Si v₁ sube una unidad, ŷ sube h₁ unidades. Por eso multiplicamos la señal por h₁: lo que llegó por esa conexión.', back: ['v1'], focus: ['g-v1'] },
		{ phase: 'atrás', title: 'Gradiente del peso v₂', general: '∂L/∂v₂ = ∂L/∂ŷ · h₂', worked: [`∂L/∂v₂ = ${par(g.prediction)} × ${fmt(f.h2)} = ${fmt(g.v2)}`], note: 'Es el doble que el de v₁ porque h₂ = 2 aportó el doble a la predicción. Más participación, más responsabilidad.', back: ['v2'], focus: ['g-v2'] },
		{ phase: 'atrás', title: 'Gradiente del sesgo c', general: '∂L/∂c = ∂L/∂ŷ · 1', worked: [`∂L/∂c = ${par(g.prediction)} × 1 = ${fmt(g.c)}`], note: 'El sesgo se suma directamente a ŷ, así que recibe la señal completa.', focus: ['g-c'] },
		{ phase: 'atrás', title: 'La señal entra a la neurona oculta 1', general: '∂L/∂h₁ = ∂L/∂ŷ · v₁', worked: [`∂L/∂h₁ = ${par(g.prediction)} × ${fmt(p.v1)} = ${fmt(g.h1)}`], note: 'Ahora la señal cruza la conexión v₁ en sentido contrario. Esta vez se multiplica por el peso, porque h₁ influye en ŷ a través de v₁.', back: ['v1'], focus: ['g-h1'] },
		{ phase: 'atrás', title: 'La señal entra a la neurona oculta 2', general: '∂L/∂h₂ = ∂L/∂ŷ · v₂', worked: [`∂L/∂h₂ = ${par(g.prediction)} × ${fmt(p.v2)} = ${fmt(g.h2)}`], note: 'v₂ es pequeño (0.5), así que a la neurona 2 le llega una señal más débil.', back: ['v2'], focus: ['g-h2'] },
		{ phase: 'atrás', title: 'Atravesamos ReLU', general: '∂L/∂z = ∂L/∂h · ReLU′(z)', worked: [`∂L/∂z₁ = ${par(g.h1)} × 1 = ${fmt(g.z1)}   (z₁ = ${fmt(f.z1)} > 0)`, `∂L/∂z₂ = ${par(g.h2)} × 1 = ${fmt(g.z2)}   (z₂ = ${fmt(f.z2)} > 0)`], note: 'ReLU′ vale 1 cuando z es positivo: la señal pasa intacta. Si z hubiera sido negativo valdría 0 y esa neurona no recibiría corrección.', focus: ['g-z1', 'g-z2'] },
		{ phase: 'atrás', title: 'Gradientes de w₁ y b₁', general: '∂L/∂w₁ = ∂L/∂z₁ · x,   ∂L/∂b₁ = ∂L/∂z₁ · 1', worked: [`∂L/∂w₁ = ${par(g.z1)} × ${p.x} = ${fmt(g.w1)}`, `∂L/∂b₁ = ${par(g.z1)} × 1 = ${fmt(g.b1)}`], note: 'Llegamos a la primera capa. Es el mismo patrón de siempre: señal que llega × lo que entró por esa conexión.', back: ['w1'], focus: ['g-w1', 'g-b1'] },
		{ phase: 'atrás', title: 'Gradientes de w₂ y b₂', general: '∂L/∂w₂ = ∂L/∂z₂ · x,   ∂L/∂b₂ = ∂L/∂z₂ · 1', worked: [`∂L/∂w₂ = ${par(g.z2)} × ${p.x} = ${fmt(g.w2)}`, `∂L/∂b₂ = ${par(g.z2)} × 1 = ${fmt(g.b2)}`], note: 'Ya tenemos un gradiente para cada uno de los siete parámetros. Backpropagation terminó; todavía no cambiamos ningún peso.', back: ['w2'], focus: ['g-w2', 'g-b2'] },
		{ phase: 'actualizar', title: 'Descenso de gradiente: actualizamos los siete parámetros', general: 'θ_nuevo = θ − η · ∂L/∂θ', worked: BACKPROP_PARAMETER_NAMES.map((name) => `${symbol[name]}: ${fmt(p[name])} − ${eta} × ${par(g[name])} = ${fmt(u[name])}`), note: 'Todos los gradientes son negativos, así que todos los parámetros suben un poco. Ahora sí cambia la red.', focus: BACKPROP_PARAMETER_NAMES.map((name) => `p-${name}`) },
		{ phase: 'adelante', title: 'Comprobamos con los parámetros nuevos', general: 'repetimos la pasada hacia adelante', worked: [`z₁ = ${fmt(n.z1)}, h₁ = ${fmt(n.h1)};  z₂ = ${fmt(n.z2)}, h₂ = ${fmt(n.h2)}`, `ŷ = ${fmt(n.prediction)},  L = ${fmt(n.loss)}   (antes L = ${fmt(f.loss)})`], note: 'La pérdida bajó de 2 a 0.361 en un solo paso. ŷ se pasó un poco de 4: en el siguiente ciclo los gradientes serán positivos y la corregirán hacia abajo.', fwd: ['w1', 'w2', 'v1', 'v2', 'loss'], focus: ['L'] }
	];

	let step = $state(0);
	const current = $derived(steps[step]);
	const updated = $derived(step >= 14);
	const checked = $derived(step === 15);
	// The step at which each gradient first appears; it stays visible afterwards until the parameters change.
	const gradientStep: Record<string, number> = { prediction: 5, v1: 6, v2: 7, c: 8, h1: 9, h2: 10, z1: 11, z2: 11, w1: 12, b1: 12, w2: 13, b2: 13 };
	const showGradient = (key: string) => step >= gradientStep[key] && !checked;
	const isFocus = (key: string) => current.focus?.includes(key) ?? false;
	const values = $derived(checked ? n : f);
	const shown = (forwardStep: number, value: number) => (step >= forwardStep ? fmt(value) : '?');
	const paramText = (name: keyof typeof symbol) => (updated ? `${symbol[name]} = ${fmt(u[name as 'w1'])}` : `${symbol[name]} = ${fmt(p[name as 'w1'])}`);

	const notebook = [
		{ key: 'prediction', label: '∂L/∂ŷ' },
		{ key: 'v1', label: '∂L/∂v₁' },
		{ key: 'v2', label: '∂L/∂v₂' },
		{ key: 'c', label: '∂L/∂c' },
		{ key: 'h1', label: '∂L/∂h₁' },
		{ key: 'h2', label: '∂L/∂h₂' },
		{ key: 'z1', label: '∂L/∂z₁' },
		{ key: 'z2', label: '∂L/∂z₂' },
		{ key: 'w1', label: '∂L/∂w₁' },
		{ key: 'b1', label: '∂L/∂b₁' },
		{ key: 'w2', label: '∂L/∂w₂' },
		{ key: 'b2', label: '∂L/∂b₂' }
	] as const;

	// Edges: forward solid, backward dashed overlay that flows towards the input.
	const edges = {
		w1: 'M160 252 L340 170',
		w2: 'M160 298 L340 380',
		v1: 'M520 170 L670 260',
		v2: 'M520 380 L670 290',
		loss: 'M830 275 L930 275'
	} as const;
	const edgeKeys = Object.keys(edges) as (keyof typeof edges)[];
	const width = (text: string) => text.length * 10 + 26;
</script>

{#snippet pill(cx: number, cy: number, text: string, kind: 'param' | 'grad', visible: boolean, focus: boolean)}
	<g class="pill pill--{kind}" class:visible class:focus>
		<rect x={cx - width(text) / 2} y={cy - 15} width={width(text)} height="30" rx="15" />
		<text x={cx} y={cy + 6} text-anchor="middle">{text}</text>
	</g>
{/snippet}

<div class="backprop">
	<div class="backprop__stage">
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Focus enables keyboard scrolling of the SVG on narrow screens.) -->
		<div class="diagram-scroll" role="region" tabindex="0" aria-label="Red neuronal del ejemplo; en pantallas pequeñas, desplázate horizontalmente">
			<svg viewBox="0 0 1100 500" role="img" aria-labelledby="bp-title bp-desc">
				<title id="bp-title">Backpropagation en una red con una entrada, dos neuronas ocultas y una salida</title>
				<desc id="bp-desc">{current.title}. {current.worked.join('. ')}</desc>
				<defs>
					<marker id="bp-fwd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 10 5 0 10Z" fill="#1f4fd1" /></marker>
				</defs>

				<g fill="#4a5873" font-size="15" font-weight="700" text-anchor="middle">
					<text x="110" y="28">Entrada</text><text x="430" y="28">Capa oculta (ReLU)</text><text x="750" y="28">Salida</text><text x="1000" y="28">Pérdida</text>
				</g>

				{#each edgeKeys as key (key)}
					<path class="edge" class:lit={current.fwd?.includes(key)} d={edges[key]} marker-end="url(#bp-fwd)" />
					<path class="edge-back" class:lit={current.back?.includes(key)} d={edges[key]} />
				{/each}
				<text x="880" y="262" text-anchor="middle" font-size="14" font-weight="700" fill="#4a5873">½(ŷ − y)²</text>

				<!-- Input -->
				<circle cx="110" cy="275" r="50" fill="#fff" stroke="#1f4fd1" stroke-width="2.5" />
				<text x="110" y="283" text-anchor="middle" font-size="22" font-weight="700" fill="#14213d">x = {p.x}</text>

				<!-- Hidden neurons -->
				{#each [{ id: 'h1', cy: 170, z: values.z1, h: values.h1, gh: g.h1, gz: g.z1, n: '₁', at: 1 }, { id: 'h2', cy: 380, z: values.z2, h: values.h2, gh: g.h2, gz: g.z2, n: '₂', at: 2 }] as neuron (neuron.id)}
					<g class="node" class:focus={isFocus(neuron.id) || isFocus(`g-${neuron.id}`) || isFocus(`g-z${neuron.n === '₁' ? 1 : 2}`)}>
						<rect x="340" y={neuron.cy - 68} width="180" height="136" rx="10" />
						<text x="430" y={neuron.cy - 34} class="v">z{neuron.n} = {shown(neuron.at, neuron.z)}</text>
						<text x="430" y={neuron.cy - 8} class="v">h{neuron.n} = {shown(neuron.at, neuron.h)}</text>
						<text x="430" y={neuron.cy + 24} class="gr" class:visible={showGradient(neuron.id)}>∂L/∂h{neuron.n} = {fmt(neuron.gh)}</text>
						<text x="430" y={neuron.cy + 50} class="gr" class:visible={showGradient(`z${neuron.n === '₁' ? 1 : 2}`)}>∂L/∂z{neuron.n} = {fmt(neuron.gz)}</text>
					</g>
				{/each}

				<!-- Output and loss -->
				<g class="node" class:focus={isFocus('y') || isFocus('g-prediction')}>
					<rect x="670" y="220" width="160" height="110" rx="10" />
					<text x="750" y="262" class="v">ŷ = {shown(3, values.prediction)}</text>
					<text x="750" y="296" class="gr" class:visible={showGradient('prediction')}>∂L/∂ŷ = {fmt(g.prediction)}</text>
				</g>
				<g class="node node--loss" class:focus={isFocus('L')}>
					<rect x="930" y="235" width="140" height="80" rx="10" />
					<text x="1000" y="283" class="v">L = {shown(4, values.loss)}</text>
				</g>
				<path d="M1000 352V315" stroke="#b7791f" stroke-width="2" stroke-dasharray="4 4" />
				<rect x="950" y="352" width="100" height="38" rx="6" fill="#fbf3e2" stroke="#b7791f" stroke-width="2" />
				<text x="1000" y="377" text-anchor="middle" font-size="17" font-weight="700" fill="#7a4f12">y = {p.y}</text>

				<!-- Parameters with their gradients -->
				{@render pill(228, 180, paramText('w1'), 'param', true, isFocus('p-w1'))}
				{@render pill(228, 146, `∂L/∂w₁ = ${fmt(g.w1)}`, 'grad', showGradient('w1'), isFocus('g-w1'))}
				{@render pill(228, 352, paramText('w2'), 'param', true, isFocus('p-w2'))}
				{@render pill(228, 386, `∂L/∂w₂ = ${fmt(g.w2)}`, 'grad', showGradient('w2'), isFocus('g-w2'))}
				{@render pill(375, 80, paramText('b1'), 'param', true, isFocus('p-b1'))}
				{@render pill(500, 80, `∂L/∂b₁ = ${fmt(g.b1)}`, 'grad', showGradient('b1'), isFocus('g-b1'))}
				{@render pill(375, 470, paramText('b2'), 'param', true, isFocus('p-b2'))}
				{@render pill(500, 470, `∂L/∂b₂ = ${fmt(g.b2)}`, 'grad', showGradient('b2'), isFocus('g-b2'))}
				{@render pill(605, 190, paramText('v1'), 'param', true, isFocus('p-v1'))}
				{@render pill(605, 156, `∂L/∂v₁ = ${fmt(g.v1)}`, 'grad', showGradient('v1'), isFocus('g-v1'))}
				{@render pill(605, 360, paramText('v2'), 'param', true, isFocus('p-v2'))}
				{@render pill(605, 394, `∂L/∂v₂ = ${fmt(g.v2)}`, 'grad', showGradient('v2'), isFocus('g-v2'))}
				{@render pill(760, 190, paramText('c'), 'param', true, isFocus('p-c'))}
				{@render pill(760, 156, `∂L/∂c = ${fmt(g.c)}`, 'grad', showGradient('c'), isFocus('g-c'))}
			</svg>
		</div>
	</div>

	<div class="backprop__side">
		<div class="board" aria-live="polite">
			<p class="board__phase board__phase--{current.phase === 'atrás' ? 'back' : current.phase === 'actualizar' ? 'update' : 'forward'}">
				{current.phase === 'atrás' ? 'Pasada hacia atrás' : current.phase === 'actualizar' ? 'Actualización' : current.phase === 'inicio' ? 'Inicio' : 'Pasada hacia adelante'}
			</p>
			<p class="board__title"><strong>Paso {step + 1} de {steps.length}.</strong> {current.title}</p>
			<p class="board__general">{current.general}</p>
			{#each current.worked as line, index (index)}<p class="board__worked" class:board__worked--compact={current.worked.length > 3}>{line}</p>{/each}
			<p class="board__note">{current.note}</p>
		</div>
		<aside class="notebook" aria-label="Libreta de gradientes calculados">
			<p class="notebook__title">Libreta de gradientes</p>
			<p class="notebook__hint">Cada gradiente nuevo usa uno que ya está en la libreta: backpropagation reutiliza su propio trabajo.</p>
			<dl>
				{#each notebook as item (item.key)}
					<div class:filled={step >= gradientStep[item.key]} class:current={step === gradientStep[item.key]}>
						<dt>{item.label}</dt>
						<dd>{step >= gradientStep[item.key] ? fmt(g[item.key]) : '—'}</dd>
					</div>
				{/each}
			</dl>
			<p class="notebook__loss">Pérdida: <strong>{fmt(f.loss)}</strong>{#if checked} → <strong>{fmt(n.loss)}</strong>{/if}</p>
		</aside>
	</div>

	<div class="backprop__controls">
		<StepControls bind:step total={steps.length} label="Controles de backpropagation" interval={2600} />
	</div>
</div>

<style>
	.backprop { display: grid; gap: 1rem; }
	.backprop__side { display: grid; gap: 0.9rem; min-width: 0; }
	@media (min-width: 1100px) {
		/* Diagram and notebook on the left, the board beside them, so the whole step is visible at once. */
		.backprop { grid-template-columns: minmax(0, 2.2fr) minmax(20rem, 1fr); grid-template-areas: 'diagram board' 'notebook board' 'controls controls'; align-items: start; }
		.backprop__side { display: contents; }
		.backprop__stage { grid-area: diagram; }
		.board { grid-area: board; }
		.notebook { grid-area: notebook; }
		.backprop__controls { grid-area: controls; }
		.notebook dl { grid-template-columns: repeat(4, minmax(0, 1fr)); }
		.board__worked--compact { font-size: 1rem !important; }
	}
	.backprop__stage { display: grid; gap: 0.9rem; min-width: 0; }
	.diagram-scroll { overflow-x: auto; overscroll-behavior-inline: contain; }
	.diagram-scroll:focus-visible { outline: 3px solid #93c5fd; outline-offset: 2px; }
	svg { display: block; width: 100%; height: auto; font-family: var(--font-sans); }

	.edge { fill: none; stroke: #9baec3; stroke-width: 3; transition: stroke 0.3s ease, stroke-width 0.3s ease; }
	.edge.lit { stroke: #1f4fd1; stroke-width: 5; }
	.edge-back { fill: none; stroke: #0f6b5e; stroke-width: 5; stroke-dasharray: 9 7; opacity: 0; transition: opacity 0.3s ease; }
	.edge-back.lit { opacity: 1; animation: flow-back 0.8s linear infinite; }

	.node rect { fill: #fff; stroke: #1f4fd1; stroke-width: 2.5; transition: fill 0.3s ease, stroke-width 0.3s ease; }
	.node.focus rect { fill: #dfe7fb; stroke-width: 4; }
	.node--loss rect { stroke: #b7791f; }
	.node--loss.focus rect { fill: #fbf3e2; }
	.node text { text-anchor: middle; font-weight: 700; }
	.node .v { fill: #14213d; font-size: 21px; }
	.node .gr { fill: #0f6b5e; font-size: 18px; opacity: 0; transition: opacity 0.35s ease; }
	.node .gr.visible { opacity: 1; }

	.pill { transition: opacity 0.35s ease; }
	.pill text { font-size: 17px; font-weight: 700; }
	.pill--param rect { fill: #fff; stroke: #9baec3; stroke-width: 1.5; }
	.pill--param text { fill: #1f4fd1; }
	.pill--grad { opacity: 0; }
	.pill--grad.visible { opacity: 1; }
	.pill--grad rect { fill: #d5efe9; stroke: #0f6b5e; stroke-width: 1.5; }
	.pill--grad text { fill: #0b4f45; }
	.pill.focus rect { stroke-width: 3.5; }
	.pill--param.focus rect { fill: #dfe7fb; stroke: #1f4fd1; }
	.pill--grad.focus rect { fill: #0f6b5e; }
	.pill--grad.focus text { fill: #fff; }

	.board { min-height: 16rem; padding: 0.9rem 1.1rem; border-left: 4px solid var(--color-accent); border-radius: 0.3rem; background: #f3faf8; }
	.board p { margin: 0; }
	.board__phase { display: inline-block; margin-bottom: 0.4rem !important; padding: 0.15rem 0.55rem; border-radius: 0.25rem; font-size: 0.85rem; font-weight: 700; }
	.board__phase--forward { background: var(--color-primary-soft); color: var(--color-primary); }
	.board__phase--back { background: var(--color-accent-soft); color: var(--color-accent); }
	.board__phase--update { background: var(--color-ochre-soft); color: #7a4f12; }
	.board__general { margin-top: 0.45rem !important; color: var(--color-muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; }
	.board__worked { margin-top: 0.2rem !important; color: #0b4f45; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: clamp(0.95rem, 1.4vw, 1.2rem); font-weight: 800; overflow-wrap: anywhere; }
	.board__note { margin-top: 0.55rem !important; color: var(--color-muted); line-height: 1.5; }

	.notebook { padding: 1rem; border: 1px solid var(--color-line); border-top: 3px solid var(--color-accent); border-radius: 0 0 0.4rem 0.4rem; background: var(--color-surface); }
	.notebook__title { margin: 0; font-family: var(--font-serif); font-size: 1.1rem; font-weight: 600; }
	.notebook__hint { margin: 0.3rem 0 0.7rem; color: var(--color-muted); font-size: 0.85rem; line-height: 1.4; }
	dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.2rem 0.6rem; margin: 0; }
	dl div { display: flex; justify-content: space-between; padding: 0.25rem 0.5rem; border-radius: 0.25rem; color: #9aa6b8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; transition: background 0.3s ease; }
	dl div.filled { color: var(--color-ink); }
	dl div.filled dd { color: var(--color-accent); }
	dl div.current { background: var(--color-accent-soft); }
	dd { margin: 0; }
	.notebook__loss { margin: 0.8rem 0 0; color: var(--color-muted); }

	@keyframes flow-back { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 32; } }
	@media (max-width: 700px) { svg { min-width: 760px; } }
	@media (prefers-reduced-motion: reduce) {
		.edge, .edge-back, .node rect, .node .gr, .pill, dl div { transition: none; }
		.edge-back.lit { animation: none; }
	}
</style>
