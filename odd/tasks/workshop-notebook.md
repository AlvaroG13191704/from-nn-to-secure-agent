# Notebook del workshop: De neuronas a agentes seguros

## Objetivo

Crear un Jupyter Notebook completo, ejecutable y pedagógico que lleve a estudiantes de primer ingreso desde una neurona artificial hasta un agente con controles básicos de seguridad.

## Problema

Los estudiantes conocen nociones iniciales de algoritmos, cálculo, vectores y matrices, pero no conocen APIs ni arquitectura frontend/backend. El material debe conectar teoría y práctica sin depender de servicios pagados ni configuraciones complejas.

## Alcance autorizado

- Crear un notebook bajo `notebooks/`.
- Usar Python, NumPy, Matplotlib y biblioteca estándar.
- Incluir explicaciones breves, ejemplos, ejercicios ejecutables y checkpoints.
- Investigar, sin desplegar, la opción actual de AWS para distribuir entornos individuales.

## Restricciones

- Una sola narrativa acumulativa.
- Todas las celdas deben ejecutarse de principio a fin sin intervención.
- Los ejercicios deben permitir modificación sin dejar el notebook roto inicialmente.
- No usar APIs de LLM, GPU ni credenciales.
- Artefacto educativo en español neutro.

## Checklist

- [x] T1 — Diseñar y crear el notebook acumulativo. Ruta: delegada. Evidencia: `notebooks/de-neuronas-a-agentes-seguros.ipynb`, 55 celdas y agenda 120 + 120 minutos.
- [x] T2 — Ejecutar el notebook desde cero y verificar resultados, ejercicios y seguridad. Ruta: delegada. Evidencia: 33 celdas de código ejecutadas en orden; 9 intentos auditados; hash final verificado; sin excepciones ni errores almacenados.
- [x] T3 — Confirmar la alternativa actual de AWS SageMaker para laboratorios individuales y documentar el tradeoff en la entrega. Ruta: delegada. Evidencia: documentación oficial confirma que Studio Lab no acepta nuevos clientes y que SageMaker Studio con espacios JupyterLab e IAM Identity Center es la alternativa administrable.
- [x] T4 — Rediseñar entrada y ritmo: preparación técnica plegable, inicio visible en la neurona, agenda 240 minutos, ecuaciones y gráficas. Ruta: delegada. Evidencia: secciones 1–15; 120 + 120 min.
- [x] T5 — Convertir ejercicios a andamiajes editables con TODOs, `None` seguro y checkpoints. Ruta: delegada. Evidencia: 15 ejercicios TODO; ejecución intacta sin excepciones.
- [x] T6 — Simplificar la interfaz del código y hacer explícita la construcción acumulativa, política, seguridad y auditoría. Ruta: delegada. Evidencia: 2 celdas plegables; adaptador reutiliza vocabulario, bigramas y contexto de atención; la auditoría registra también excepciones de herramientas.
- [x] T7 — Verificar estructura, agenda, ejercicios, fallback y ejecución secuencial. Ruta: delegada. Evidencia: nbformat 4.5 válido; 52 celdas, 32 ejecutables; prueba de falla simulada confirma registro de error.

## Criterios de aceptación

- El notebook explica cada concepto brevemente, muestra un ejemplo y propone un ejercicio.
- Las secciones se conectan desde neurona, red, entrenamiento, NLP, atención y modelo de lenguaje hasta agente y seguridad.
- La ejecución completa termina sin excepciones.
- No requiere acceso a un modelo comercial.
- La recomendación de hosting se apoya en documentación oficial vigente.

## Verificación

- Ejecutar el notebook en un kernel limpio.
- Confirmar que no queden errores ni salidas con traceback.
- Validar que todas las dependencias sean comunes y declaradas.

## Estado

- Rediseño implementado y verificado estructuralmente y por ejecución secuencial; T1–T3 conservan su evidencia previa y T4–T7 cierran el rediseño.
- No se pudo ejecutar con kernel Jupyter porque `jupyter`, `nbclient` y `nbconvert` no están disponibles; se ejecutaron las 32 celdas de código, en orden y con namespace limpio, usando el Python 3.12/NumPy disponible. Matplotlib no está instalado y se verificó su fallback numérico.

## Entrega

- Estrategia resuelta: `exception-ok` para un único work-unit commit, autorizada por el usuario el 6 de octubre de 2026.
- Justificación: las 828 líneas del diff corresponden principalmente a la representación JSON de un único notebook pedagógico; separar el rediseño rompería su narrativa y su verificación acumulativa.
- Identidad del work unit: `HEAD` de `feat/workshop-notebook` con asunto `feat(workshop): simplify notebook learning flow`.
- Límite de rollback: `notebooks/de-neuronas-a-agentes-seguros.ipynb` y la actualización de seguimiento en este documento; no incluye `.atl/`.
- Nota histórica de Git (supersedida): la inspección previa afirmó que el directorio no era un repositorio. La inspección actual confirma `/Volumes/ProyectosYDocs/workshop-chiquimula-umg` como raíz Git; ambos archivos autorizados están versionados y sin cambios pendientes al iniciar este rediseño. `.atl/` aparece como contenido no versionado ajeno a este alcance y no debe modificarse.

## Evidencia de verificación

- Notebook válido: nbformat 4.5.
- 55 celdas totales; 33 de código.
- Sesiones: 120 + 120 = 240 minutos.
- Ejecución secuencial completa con Python 3.12.14 y NumPy 2.3.5: PASS.
- Matplotlib ausente: fallback opcional ejecutado correctamente.
- Auditoría: 9 intentos, incluidos rechazos y confirmaciones requeridas.
- SHA-256 final: verificado sobre el registro completo.
- RDD: la estrategia de entrega quedó resuelta como un único commit excepcional; la evaluación nativa se ejecutará sobre ese work unit después de crearlo. La afirmación histórica de que no había repositorio queda supersedida por la comprobación de raíz Git registrada arriba.
- Rediseño: se eliminaron las celdas del mapa introductorio; la primera sección docente visible es `¿Qué es una neurona?`; la preparación y las funciones de soporte usan `tags: [hide-input]` y `jupyter.source_hidden: true`.
- Ejercicios: 15 celdas de ejercicio contienen `# TODO:` visible y valores iniciales seguros; todos ejecutan sin cambios.
- Visuales: neurona/frontera, pérdida, similitud de embeddings, atención y resumen de auditoría ofrecen fallback numérico cuando Matplotlib no está disponible.
- Verificación del rediseño: `/Users/alvaro/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3` ejecutó un script de lectura JSON, comprobación de tiempos y metadatos, y `exec(compile(source, ...))` por cada celda de código en orden. Resultado: PASS; 32/32 celdas, 15 TODOs, 2 celdas ocultas, agenda 120 + 120, sin excepciones ni salidas de error almacenadas; 10 invocaciones y hash encadenado final verificados. Una llamada de herramienta con excepción simulada quedó registrada como `error`.
- Disponibilidad confirmada con `command -v jupyter` y `importlib.util.find_spec`: Jupyter, nbclient, nbconvert y Matplotlib no están instalados; se ejecutó y comprobó el fallback sin Matplotlib. No se afirma ejecución con kernel Jupyter.
- Comprobación de estado: `git rev-parse --show-toplevel` confirmó la raíz del repositorio; `git status --short` mostró los dos archivos autorizados modificados y un `.atl/` ajeno sin versionar, que se preservó sin cambios.

## Próximo paso

Crear y evaluar el work-unit commit autorizado, y probar `Restart Kernel and Run All` en el entorno Jupyter/SageMaker definitivo cuando esté disponible.
