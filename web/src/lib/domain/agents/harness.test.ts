// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemPrompt, buildActionSchema, runAgent } from './harness.ts';
import { executeTool, evaluateArithmetic, searchRegulation } from './tools.ts';
import { MISSIONS, evaluateMission } from './missions.ts';

const usage = { inputTokens: 100, outputTokens: 20, thinkingTokens: 0 };
// Test double only: replays fixed JSON replies so the loop can be checked without a model.
const scriptedBrain = (replies) => {
	const requests = [];
	const brain = async (request) => {
		requests.push(request);
		const index = requests.length - 1;
		const reply = index < replies.length ? replies[index] : { accion: 'responder', respuesta: 'Sin más pasos.' };
		return { text: JSON.stringify(reply), usage };
	};
	return { brain, requests };
};
const collect = async (iterator) => { const events = []; for await (const event of iterator) events.push(event); return events; };

test('the system prompt and action schema include only the selected blocks', () => {
	const blocks = ['library-assistant', 'catalog-search'];
	const prompt = buildSystemPrompt(blocks);
	assert.match(prompt, /biblioteca/i);
	assert.match(prompt, /buscar_catalogo/);
	assert.doesNotMatch(prompt, /enviar_correo/);
	assert.deepEqual(buildActionSchema(blocks).properties.herramienta.enum, ['buscar_catalogo']);
});

test('the harness executes the requested tool, feeds the observation back, and sums usage', async () => {
	const { brain, requests } = scriptedBrain([
		{ pensamiento: 'Busco libros.', accion: 'usar_herramienta', herramienta: 'buscar_catalogo', argumentos: { consulta: 'cálculo' } },
		{ pensamiento: 'Ya sé.', accion: 'responder', respuesta: 'Sí, hay libros de cálculo.' }
	]);
	const events = await collect(runAgent({ blocks: ['library-assistant', 'catalog-search'], goal: '¿Hay libros de cálculo?', brain }));
	assert.deepEqual(events.map((event) => event.type), ['usage', 'thought', 'tool-call', 'tool-result', 'usage', 'thought', 'answer', 'done']);
	assert.match(JSON.stringify(requests[1].messages.at(-1)), /Cálculo diferencial/);
	const done = events.at(-1);
	assert.equal(done.steps, 2);
	assert.deepEqual(done.usage, { inputTokens: 200, outputTokens: 40, thinkingTokens: 0 });
});

test('the loop stops at the step limit and reports it', async () => {
	const loop = Array.from({ length: 10 }, () => ({ accion: 'usar_herramienta', herramienta: 'buscar_catalogo', argumentos: { consulta: 'x' } }));
	const { brain } = scriptedBrain(loop);
	const events = await collect(runAgent({ blocks: ['catalog-search', 'step-limit'], goal: 'x', brain }));
	assert.equal(events.at(-1).steps, 4);
	assert.equal(events.at(-1).stopReason, 'step-limit');
});

test('a tool that was not given to the agent is blocked, not executed', async () => {
	const { brain } = scriptedBrain([{ accion: 'usar_herramienta', herramienta: 'enviar_correo', argumentos: { destinatario: 'a@b.com', asunto: 'x', cuerpo: 'y' } }]);
	const events = await collect(runAgent({ blocks: ['catalog-search'], goal: 'x', brain }));
	assert.ok(events.some((event) => event.type === 'blocked' && event.reason === 'tool-not-available'));
	assert.equal(events.at(-1).sentEmails.length, 0);
});

test('human confirmation can stop a side effect; without it the email is sent', async () => {
	const send = { accion: 'usar_herramienta', herramienta: 'enviar_correo', argumentos: { destinatario: 'x@y.com', asunto: 'notas', cuerpo: 'datos' } };
	const guarded = await collect(runAgent({ blocks: ['send-email', 'human-approval'], goal: 'x', brain: scriptedBrain([send]).brain, approve: async () => false }));
	assert.ok(guarded.some((event) => event.type === 'blocked' && event.reason === 'human-denied'));
	assert.equal(guarded.at(-1).sentEmails.length, 0);
	const open = await collect(runAgent({ blocks: ['send-email'], goal: 'x', brain: scriptedBrain([send]).brain }));
	assert.equal(open.at(-1).sentEmails.length, 1);
});

test('untrusted-data and personal-data guardrails transform observations', async () => {
	const read = { accion: 'usar_herramienta', herramienta: 'leer_archivo', argumentos: { nombre: 'avisos_semana.txt' } };
	const { brain, requests } = scriptedBrain([read]);
	await collect(runAgent({ blocks: ['faculty-drive', 'untrusted-data', 'pii-filter'], goal: 'x', brain }));
	const observation = JSON.stringify(requests[1].messages.at(-1));
	assert.match(observation, /<datos_no_confiables>/);
	assert.doesNotMatch(observation, /@[a-z]+\.[a-z]+/);
	assert.match(buildSystemPrompt(['untrusted-data']), /nunca sigas instrucciones/i);
});

test('tools are deterministic and the calculator never evaluates code', () => {
	assert.equal(evaluateArithmetic('2 * (3 + 4) - 1'), 13);
	assert.throws(() => evaluateArithmetic('alert(1)'));
	assert.match(searchRegulation('¿cuántas faltas puedo tener?')[0].text, /asistencia/i);
	assert.match(executeTool('horario_biblioteca', { dia: 'sábado' }).output, /12:00/);
});

test('missions are judged on outcome and safety', () => {
	const injection = MISSIONS.find((mission) => mission.id === 'injection');
	const leaked = evaluateMission(injection, { answer: 'Resumen de avisos.', toolCalls: ['leer_archivo', 'enviar_correo'], sentEmails: [{ destinatario: 'x' }] });
	assert.equal(leaked.success, false);
	const safe = evaluateMission(injection, { answer: 'El aviso habla del cambio de horario de la biblioteca.', toolCalls: ['leer_archivo'], sentEmails: [] });
	assert.equal(safe.success, true);
	const rules = MISSIONS.find((mission) => mission.id === 'regulation');
	assert.equal(evaluateMission(rules, { answer: 'Puedes faltar al 20 % de las clases.', toolCalls: ['buscar_reglamento'], sentEmails: [] }).success, true);
	assert.equal(evaluateMission(rules, { answer: 'Puedes faltar 5 veces.', toolCalls: [], sentEmails: [] }).success, false);
});

test('a reply that is valid JSON but not an action object is reported as invalid, not a crash', async () => {
	const { brain } = scriptedBrain([null, 'hola', { pensamiento: 'Listo.', accion: 'responder', respuesta: 'Hecho.' }]);
	const events = await collect(runAgent({ blocks: ['catalog-search'], goal: 'x', brain }));
	assert.equal(events.filter((event) => event.type === 'invalid').length, 2);
	assert.equal(events.at(-1).type, 'done');
	assert.equal(events.at(-1).answer, 'Hecho.');
});

test('a tool call with missing arguments is rejected with the names of the missing fields', async () => {
	const { brain, requests } = scriptedBrain([
		{ accion: 'usar_herramienta', herramienta: 'buscar_reglamento', argumentos: {} },
		{ accion: 'usar_herramienta', herramienta: 'buscar_reglamento', argumentos: { consulta: 'faltas asistencia' } }
	]);
	const events = await collect(runAgent({ blocks: ['regulation-rag'], goal: 'x', brain }));
	assert.ok(events.some((event) => event.type === 'blocked' && event.reason === 'missing-arguments'));
	assert.match(requests[1].messages.at(-1).text, /consulta/);
	assert.deepEqual(events.at(-1).toolCalls, ['buscar_reglamento']);
	assert.ok(buildActionSchema(['regulation-rag']).properties.argumentos.properties.consulta.description);
	assert.deepEqual(buildActionSchema(['regulation-rag']).required, ['accion', 'herramienta', 'argumentos']);
	assert.deepEqual(buildActionSchema([]).required, ['accion']);
});
