# De Neuronas a Agentes Seguros

Presentación web interactiva para un taller de inteligencia artificial dirigido a estudiantes de tercer semestre de la UMG Chiquimula. En dos sesiones de dos horas recorre el camino completo: cómo aprende una red neuronal, cómo un modelo de lenguaje entiende y genera texto, y cómo se construye un agente que actúa con herramientas sin caer en ataques como la inyección de instrucciones.

Está pensada para estudiantes que conocen álgebra lineal y precálculo, pero no programación ni derivadas: cada concepto se explica primero con un ejemplo numérico y una animación, y después con su fórmula.

**Sitio publicado:** https://de-neuronas-a-agentes-seguros.ga1318garcia.workers.dev

## Qué contiene

| Slide | Ruta | Tema | Laboratorio |
|-------|------|------|-------------|
| 1 | `/` | Introducción: quién presenta, cómo es el taller y el mapa de las cinco slides | — |
| 2 | `/deep-learning` | Neurona, perceptrón multicapa, pérdida, descenso de gradiente (en 1 y 2 dimensiones) y backpropagation sin derivadas | Entrena a mano una red 2 → 2 → 1 |
| 3 | `/language-models` | Tokens, embeddings reales (MiniLM + PCA), el mecanismo de atención paso a paso (`softmax(Q·Kᵀ)·V`), el Transformer y los LLMs | Atención a mano |
| 4 | `/agents` | Agentes, harness, prompt engineering, tokens y costo, RAG, guardrails y buenas prácticas | Arma tu agente: bloques y misiones con un modelo real |
| 5 | `/contacto` | Redes de contacto con códigos QR | — |

Páginas de apoyo:

- `/device-check`: revisa en casa si la computadora puede usar Gemini Nano dentro de Chrome.
- `/register`: inscripción con nombre y carnet, guardada solo en el navegador, con opción para borrar todos los datos.

## Cómo correrlo en local

Requisitos: Node 24 y pnpm 11 (la versión está fijada en `web/package.json`).

1. Instala las dependencias:

   ```bash
   cd web && pnpm install
   ```

2. Crea tus variables locales a partir del ejemplo y completa los valores:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Levanta el servidor de desarrollo y abre http://localhost:5173:

   ```bash
   pnpm dev
   ```

Sin `.dev.vars` todo el contenido funciona; solo el laboratorio de agentes con Gemini Flash necesita la clave y el código del taller.

## Verificación

| Qué | Comando (dentro de `web/`) |
|-----|----------------------------|
| Pruebas del dominio y del estado | `node --test src/lib/domain/*.test.ts src/lib/domain/*/*.test.ts src/lib/state/*.test.ts` |
| Tipos y Svelte | `pnpm check` |
| Build de producción | `pnpm build` |

## Cómo está hecho

| Parte | Decisión |
|-------|----------|
| Framework | SvelteKit con Svelte 5 (runes) y Tailwind CSS 4 |
| Lógica | Las matemáticas de cada animación y laboratorio viven en `web/src/lib/domain` como TypeScript puro con pruebas; los componentes solo dibujan esos números |
| Diseño | «Libro de texto proyectado»: Literata y Atkinson Hyperlegible Next, secciones y figuras numeradas, pensado para leerse desde el fondo del aula |
| Cerebro del agente | Gemini Nano en Chrome cuando el equipo lo permite; si no, Gemini Flash a través del servidor, con presupuesto limitado |
| Presupuesto | Tope global de $10 (el servidor se detiene en $9.50) y $0.25 por estudiante, registrados en una base D1 |
| Hosting | Cloudflare Workers con `@sveltejs/adapter-cloudflare` |
| Datos de estudiantes | Inscripción y avance solo en el navegador (`localStorage`); el servidor guarda únicamente el gasto del laboratorio de agentes |

## Despliegue

Cada merge a `main` se despliega solo con Cloudflare Workers Builds (raíz `web`, build `pnpm run build`, deploy `npx wrangler deploy`).

Lo que vive en Cloudflare y no en el repositorio:

- Secretos del Worker: `GEMINI_API_KEY` y `WORKSHOP_CODE` (`wrangler secret put <NOMBRE>`).
- Base D1 `agents-lab-budget`, creada con las migraciones de `web/migrations` (`wrangler d1 migrations apply agents-lab-budget --remote`).

> Nunca subas `web/.dev.vars`: contiene la clave de Gemini y está en `.gitignore`.

## Estructura

| Carpeta | Contenido |
|---------|-----------|
| `web/src/routes` | Una ruta por slide, más `register`, `device-check` y la API del agente |
| `web/src/lib/components` | Recorridos de cada slide, laboratorios y visualizaciones |
| `web/src/lib/domain` | Cálculos con pruebas: redes, pérdida, gradiente, atención, harness del agente y presupuesto. En sus carpetas `data` están los embeddings y las ejecuciones del agente precalculados |
| `web/src/lib/state` | Lo que se guarda en el navegador |
| `web/static` | Imágenes y QR de contacto |
| `web/migrations` | Esquema de la base D1 del presupuesto |
