# Entorno local de la plataforma interactiva del taller

## Objetivo

Preparar un proyecto web local y mínimo con Svelte 5, SvelteKit, TypeScript y Tailwind CSS 4 como reemplazo paradigmático autorizado del notebook anterior, sin incorporar todavía funcionalidades del taller.

## Alcance autorizado

- Crear el proyecto bajo `web/` mediante el Svelte CLI oficial, usando la plantilla mínima, TypeScript y npm.
- Integrar Tailwind CSS 4 mediante `@tailwindcss/vite` y `@import "tailwindcss"`.
- Mostrar una página neutra que confirme que el entorno está listo.
- Mantener SSR y `adapter-auto` por defecto; validar instalación, chequeo y build.
- Por autorización explícita del usuario, eliminar únicamente `notebooks/de-neuronas-a-agentes-seguros.ipynb`; conservar el documento histórico `odd/tasks/workshop-notebook.md` y cualquier otro contenido de `notebooks/`.
- Preservar sin cambios `.agents/**`, `.gitignore` y `skills-lock.json`; `.gitignore` conserva solamente la regla local `.agents`.

## Fuera de alcance y restricciones

- No diseñar diapositivas, juegos, torneos, realtime, backend, infraestructura AWS ni despliegue.
- No agregar base de datos, autenticación, WebSocket, SDK de AWS, adapter de despliegue, animación ni configuración de nube.
- No diseñar ni implementar diapositivas, juegos, torneos, realtime, backend, infraestructura AWS o despliegue.
- No modificar README, `.atl/`, historial Git ni otros archivos fuera de `web/**`, este documento y la eliminación exacta del notebook autorizada por el usuario.
- Usar npm; no añadir extras opcionales que no sean necesarios para el stack.
- No crear commit en esta tarea.

## Ruta y disparadores

- **Ruta:** implementación directa delegada a un único writer acotado.
- **Evidencia:** preparar un entorno nuevo implica varias decisiones y archivos; la lectura de preparación y la escritura se agrupan en el writer.
- **TDD:** excepción de scaffolding; no existe una prueba de comportamiento previa con una señal RED significativa. Se ejecutarán chequeos de tipos/Svelte y build después del cambio.
- **Forecast inicial de líneas authored:** aproximadamente 60–120, excluyendo lockfiles generados; estimación revisada al observar el scaffold completo.
- **Estrategia de entrega:** `ask-on-risk`; el cambio authored quedó por debajo de 400 líneas, por lo que corresponde un único work-unit commit.
- **Cambio de alcance autorizado posteriormente:** el usuario autorizó sustituir el notebook anterior por la plataforma Svelte y borrar solo `notebooks/de-neuronas-a-agentes-seguros.ipynb`; los archivos de skills locales y sus archivos de soporte deben preservarse.

## Checklist

- [x] T1 — Inspeccionar el help real de `npx sv create` y crear el proyecto mínimo en `web/` con TypeScript y npm. Evidencia: `sv@1.1.1` help confirmó `--template minimal --types ts --no-add-ons --install npm`; scaffold e instalación completaron.
- [x] T2 — Instalar Tailwind CSS 4 con el plugin oficial de Vite y la importación CSS oficial. Evidencia: `@tailwindcss/vite@4.3.3`, `tailwindcss@4.3.3`; plugin en Vite e import CSS presentes.
- [x] T3 — Reemplazar la página de inicio por un estado neutral de entorno listo, sin diseño de producto. Evidencia: página “Entorno listo” con clases Tailwind.
- [x] T4 — Verificar versiones, `npm run check`, `npm run build`, SSR/`adapter-auto` y ausencia de dependencias o configuración fuera de alcance. Evidencia: comandos exitosos; se detalla abajo.
- [x] T5 — Aplicar el reemplazo autorizado, preservar los skills locales y eliminar solo el notebook anterior. Evidencia: `npm run check` y estado Git/ficheros inspeccionados tras el cambio; se detalla abajo.

## Criterios de aceptación

- `web/` contiene un proyecto SvelteKit actual con Svelte 5, TypeScript, npm y SSR habilitado por defecto.
- `adapter-auto` continúa configurado; no hay decisión de adapter de producción.
- Tailwind CSS 4 se procesa mediante `@tailwindcss/vite` y `@import "tailwindcss"`.
- La única UI de inicio es neutral, de estado listo, y demuestra clases Tailwind.
- El notebook anterior fue eliminado de forma explícita y limitada; el documento histórico de tareas del notebook se conserva.
- `.agents/**`, `.gitignore` y `skills-lock.json` se conservan; `.gitignore` solo ignora `.agents`.
- No se incorporan servicios de backend, realtime, AWS ni despliegue.
- El chequeo y el build terminan correctamente; los comandos y versiones observados quedan registrados abajo.

## Verificación

- Help previo: `npx sv create --help` → exit 0; Svelte CLI `1.1.1` confirmó las opciones utilizadas.
- Scaffold: `npx sv create web --template minimal --types ts --no-add-ons --install npm` → exit 0.
- Integración de CSS: `npm install -D tailwindcss @tailwindcss/vite` → exit 0; 0 vulnerabilidades reportadas.
- En `web/`, `npm run check` → exit 0; `svelte-check found 0 errors and 0 warnings`.
- En `web/`, `npm run build` → exit 0; Vite generó salida cliente y servidor SSR y usó `@sveltejs/adapter-auto`.
- Versiones: `npm ls svelte @sveltejs/kit @sveltejs/adapter-auto tailwindcss @tailwindcss/vite --depth=0` → Svelte `5.57.2`, SvelteKit `3.0.1`, adapter-auto `8.0.0`, Tailwind y plugin Vite `4.3.3`.
- Límites de alcance: `npm pkg get scripts dependencies devDependencies` e inspección de los archivos bajo `web/` no muestran dependencias ni configuración de backend, realtime, AWS o despliegue. `vite.config.ts` conserva `adapter-auto`; no declara `ssr = false` ni un adapter específico.
- Sustitución autorizada: `rm -- notebooks/de-neuronas-a-agentes-seguros.ipynb` → exit 0; el archivo ya no existe, mientras que `odd/tasks/workshop-notebook.md` permanece. `git status --short --branch` muestra ` D notebooks/de-neuronas-a-agentes-seguros.ipynb` y los paths nuevos `?? odd/tasks/interactive-workshop-platform.md` y `?? web/`; `.atl/` sigue como contenido preexistente no relacionado.
- Skills locales: `.agents/**` (14 archivos) y `skills-lock.json` se preservaron sin cambios en esta fase; `.gitignore` contiene solamente la regla `.agents`.
- Después de la eliminación, en `web/`: `npm run check` → exit 0; `svelte-check found 0 errors and 0 warnings`. No se repitió build porque no hubo cambios de código o configuración desde el build exitoso registrado arriba.
- Análisis oficial de Svelte: `npx --yes @sveltejs/mcp svelte-autofixer` sobre `+page.svelte` y `+layout.svelte` → sin issues ni sugerencias.
- Configuración SvelteKit 3: la documentación oficial vigente confirma que `svelte.config.js` ya no es compatible y que `adapter-auto` se configura dentro de `sveltekit({ adapter: adapter() })` en `vite.config.ts`; el scaffold coincide con ese contrato.

## Progreso

- Estado: entorno local y reemplazo autorizado completos; listo para el work-unit commit `feat(platform): scaffold interactive workshop environment`.
- Tamaño observado: 277 líneas añadidas en archivos autorizados, excluyendo `web/package-lock.json` (211 líneas del scaffold/app bajo `web/` y 66 líneas de este documento); por debajo de 400. El scaffold oficial añadió README/configuración auxiliar, por eso supera el forecast inicial.
- Entorno observado: Node `v26.7.0`, npm `11.19.0`, Svelte CLI `1.1.1`, Svelte `5.57.2`, SvelteKit `3.0.1`, Vite `8.3.4`, TypeScript `6.0.3`, adapter-auto `8.0.0`, Tailwind CSS y `@tailwindcss/vite` `4.3.3`.
- `npm run check`: exit 0; 0 errores y 0 warnings de Svelte.
- `npm run build`: exit 0; generó cliente y servidor SSR; seleccionó adapter-auto. Mensaje de adapter-auto indicando que no detectó plataforma de producción es esperado porque aún no se eligió destino.
- Instalación npm: 0 vulnerabilidades reportadas; una advertencia informativa indica que el script opcional de `fsevents` aún no está en allowScripts, sin bloquear check o build.

## Próximo paso

Crear el work-unit commit y, en una tarea posterior, decidir la arquitectura realtime y el adapter de despliegue sin incorporar todavía funcionalidades del producto.
