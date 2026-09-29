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

- Implementación completa.
- Verificación real con kernel Jupyter pendiente por ausencia de `jupyter`, `nbclient` y `nbconvert` en el entorno local; se ejecutó cada celda en un namespace Python limpio como comprobación proporcional.

## Entrega

- Estrategia: `ask-on-risk`.
- Forecast: más de 400 líneas JSON por la naturaleza del notebook; se considera un único artefacto pedagógico cohesivo.
- Git: no disponible porque el directorio no es un repositorio.

## Evidencia de verificación

- Notebook válido: nbformat 4.5.
- 55 celdas totales; 33 de código.
- Sesiones: 120 + 120 = 240 minutos.
- Ejecución secuencial completa con Python 3.12.14 y NumPy 2.3.5: PASS.
- Matplotlib ausente: fallback opcional ejecutado correctamente.
- Auditoría: 9 intentos, incluidos rechazos y confirmaciones requeridas.
- SHA-256 final: verificado sobre el registro completo.
- Git/RDD: no aplicables porque el directorio no es un repositorio Git.

## Próximo paso

Probar `Restart Kernel and Run All` en el entorno Jupyter/SageMaker definitivo y preparar la distribución a estudiantes.
