import { blocksById } from './blocks.ts';
import { TOOLS, executeTool, type ToolName, type ToolState } from './tools.ts';
import type { TokenUsage } from './budget.ts';
import { BUDGET_LIMITS } from './budget.ts';

export type HarnessMessage = { role: 'user' | 'model'; text: string };
export type BrainRequest = { system: string; messages: HarnessMessage[]; schema: Record<string, unknown> };
export type BrainReply = { text: string; usage: TokenUsage };
/** The model behind the harness: Gemini Nano in the browser or Gemini Flash through the server. */
export type Brain = (request: BrainRequest) => Promise<BrainReply>;
export type AgentAction = { pensamiento?: string; accion: 'usar_herramienta' | 'responder'; herramienta?: string; argumentos?: Record<string, unknown>; respuesta?: string };

export type AgentEvent =
	| { type: 'thought'; step: number; text: string }
	| { type: 'tool-call'; step: number; tool: string; args: Record<string, unknown> }
	| { type: 'tool-result'; step: number; tool: string; output: string; ok: boolean }
	| { type: 'blocked'; step: number; tool: string; reason: 'tool-not-available' | 'human-denied' }
	| { type: 'invalid'; step: number; raw: string }
	| { type: 'usage'; step: number; usage: TokenUsage }
	| { type: 'answer'; step: number; text: string }
	| { type: 'done'; steps: number; stopReason: 'answered' | 'step-limit'; usage: TokenUsage; toolCalls: string[]; sentEmails: ToolState['sentEmails']; answer: string };

const HARNESS_RULES = 'Trabajas en un ciclo: piensas, usas como máximo una herramienta por paso y observas su resultado. Responde SIEMPRE con un único objeto JSON que cumpla el esquema. Para usar una herramienta: {"accion":"usar_herramienta","herramienta":"...","argumentos":{...}}. Cuando ya tengas la respuesta final: {"accion":"responder","respuesta":"..."}. Usa solo las herramientas listadas.';

export function enabledTools(blockIds: string[]): ToolName[] {
	return [...new Set(blocksById(blockIds).flatMap((block) => block.tools ?? []))];
}

export function buildSystemPrompt(blockIds: string[]) {
	const blocks = blocksById(blockIds);
	const tools = enabledTools(blockIds);
	const parts = [HARNESS_RULES, ...blocks.filter((block) => block.prompt && block.kind === 'skill').map((block) => block.prompt as string)];
	parts.push(tools.length
		? `Herramientas disponibles:\n${tools.map((name) => `- ${name}: ${TOOLS[name].description} Argumentos: ${JSON.stringify(TOOLS[name].parameters)}`).join('\n')}`
		: 'No tienes herramientas: responde solo con lo que sabes.');
	parts.push(...blocks.filter((block) => block.prompt && block.kind === 'guardrail').map((block) => block.prompt as string));
	return parts.join('\n\n');
}

/** JSON Schema that constrains every model reply to a valid harness action. */
export function buildActionSchema(blockIds: string[]) {
	const tools = enabledTools(blockIds);
	const argumentNames = [...new Set(tools.flatMap((name) => Object.keys(TOOLS[name].parameters)))];
	return {
		type: 'object',
		properties: {
			pensamiento: { type: 'string' },
			accion: { type: 'string', enum: tools.length ? ['usar_herramienta', 'responder'] : ['responder'] },
			...(tools.length ? {
				herramienta: { type: 'string', enum: tools },
				argumentos: { type: 'object', properties: Object.fromEntries(argumentNames.map((name) => [name, { type: 'string' }])) }
			} : {}),
			respuesta: { type: 'string' }
		},
		required: ['accion']
	};
}

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

export async function* runAgent(options: { blocks: string[]; goal: string; brain: Brain; approve?: (call: { tool: string; args: Record<string, unknown> }) => Promise<boolean> }): AsyncGenerator<AgentEvent> {
	const { blocks, goal, brain, approve } = options;
	const has = (id: string) => blocks.includes(id);
	const allowed = new Set<string>(enabledTools(blocks));
	const maxSteps = has('step-limit') ? 4 : BUDGET_LIMITS.maxSteps;
	const system = buildSystemPrompt(blocks);
	const schema = buildActionSchema(blocks);
	const messages: HarnessMessage[] = [{ role: 'user', text: goal }];
	const state: ToolState = { sentEmails: [] };
	const usage: TokenUsage = { inputTokens: 0, outputTokens: 0, thinkingTokens: 0 };
	const toolCalls: string[] = [];

	for (let step = 1; step <= maxSteps; step += 1) {
		const reply = await brain({ system, messages: [...messages], schema });
		usage.inputTokens += reply.usage.inputTokens;
		usage.outputTokens += reply.usage.outputTokens;
		usage.thinkingTokens += reply.usage.thinkingTokens;
		yield { type: 'usage', step, usage: reply.usage };
		messages.push({ role: 'model', text: reply.text });

		let action: AgentAction | null = null;
		try {
			const parsed: unknown = JSON.parse(reply.text);
			if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) action = parsed as AgentAction;
		} catch {
			// Handled below as an invalid reply.
		}
		if (!action) {
			yield { type: 'invalid', step, raw: reply.text };
			messages.push({ role: 'user', text: 'Tu respuesta no fue un JSON válido. Responde solo con el objeto JSON del esquema.' });
			continue;
		}
		if (action.pensamiento) yield { type: 'thought', step, text: action.pensamiento };

		if (action.accion === 'responder' || !action.herramienta) {
			const answer = action.respuesta ?? '';
			yield { type: 'answer', step, text: answer };
			yield { type: 'done', steps: step, stopReason: 'answered', usage, toolCalls, sentEmails: state.sentEmails, answer };
			return;
		}

		const tool = action.herramienta;
		const args = action.argumentos ?? {};
		yield { type: 'tool-call', step, tool, args };
		if (!allowed.has(tool) || !(tool in TOOLS)) {
			yield { type: 'blocked', step, tool, reason: 'tool-not-available' };
			messages.push({ role: 'user', text: `Observación: la herramienta ${tool} no está disponible para este agente.` });
			continue;
		}
		if (TOOLS[tool as ToolName].sideEffect && has('human-approval') && !(await (approve?.({ tool, args }) ?? Promise.resolve(false)))) {
			yield { type: 'blocked', step, tool, reason: 'human-denied' };
			messages.push({ role: 'user', text: `Observación: la persona usuaria no aprobó usar ${tool}.` });
			continue;
		}

		const result = executeTool(tool as ToolName, args, state);
		toolCalls.push(tool);
		let observation = has('pii-filter') ? result.output.replace(EMAIL_PATTERN, '[correo oculto]') : result.output;
		if (has('untrusted-data')) observation = `<datos_no_confiables>${observation}</datos_no_confiables>`;
		yield { type: 'tool-result', step, tool, output: observation, ok: result.ok };
		messages.push({ role: 'user', text: `Observación de ${tool}: ${observation}` });
	}
	yield { type: 'done', steps: maxSteps, stopReason: 'step-limit', usage, toolCalls, sentEmails: state.sentEmails, answer: '' };
}
