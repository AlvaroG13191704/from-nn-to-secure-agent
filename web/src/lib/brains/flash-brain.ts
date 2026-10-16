import type { Brain } from '#lib/domain/agents/harness.js';

export type FlashBalance = { studentSpentUsd: number; studentCapUsd: number; workshopRemainingUsd: number };
export type FlashErrorCode = 'invalid-request' | 'lab-closed' | 'not-configured' | 'rate-limited' | 'budget-exhausted' | 'model-error' | 'network';

const MESSAGES: Record<FlashErrorCode, string> = {
	'invalid-request': 'La petición no es válida. Revisa tu carnet en la inscripción.',
	'lab-closed': 'El código del taller no es correcto o el laboratorio está cerrado.',
	'not-configured': 'El servidor del taller todavía no está configurado.',
	'rate-limited': 'Hiciste muchas peticiones en un minuto. Espera un momento y vuelve a intentarlo.',
	'budget-exhausted': 'Se agotó el presupuesto. Revisa tu saldo.',
	'model-error': 'Gemini no pudo responder esta vez. Vuelve a intentarlo.',
	network: 'No hay conexión con el servidor del taller.'
};

export class FlashBrainError extends Error {
	constructor(readonly code: FlashErrorCode, readonly balance?: FlashBalance, readonly scope?: 'global' | 'student') {
		super(code === 'budget-exhausted' && scope === 'student' ? 'Usaste todo tu presupuesto de Gemini Flash para el laboratorio.' : code === 'budget-exhausted' ? 'Se agotó el presupuesto de todo el taller.' : MESSAGES[code]);
	}
}

async function post(path: string, body: unknown) {
	try {
		const response = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
		type ServerReply = { error?: string; scope?: 'global' | 'student'; balance?: FlashBalance; costUsd?: number; text?: string; usage?: { inputTokens: number; outputTokens: number; thinkingTokens: number } } & Partial<FlashBalance>;
		const data = (await response.json().catch(() => ({}))) as ServerReply;
		return { response, data };
	} catch {
		throw new FlashBrainError('network');
	}
}

/** Gemini Flash through the workshop server: every call is budgeted and reports the new balance. */
export function createFlashBrain(options: { code: string; studentId: string; onBalance?: (balance: FlashBalance, costUsd: number) => void }): Brain {
	return async (request) => {
		const { response, data } = await post('/api/agent', { code: options.code, studentId: options.studentId, request });
		if (!response.ok) throw new FlashBrainError((data.error as FlashErrorCode) ?? 'model-error', data.balance, data.scope);
		if (data.balance) options.onBalance?.(data.balance, data.costUsd ?? 0);
		return { text: data.text ?? '', usage: data.usage ?? { inputTokens: 0, outputTokens: 0, thinkingTokens: 0 } };
	};
}

export async function fetchFlashBalance(code: string, studentId: string): Promise<FlashBalance> {
	const { response, data } = await post('/api/agent/balance', { code, studentId });
	if (!response.ok) throw new FlashBrainError((data.error as FlashErrorCode) ?? 'network');
	return { studentSpentUsd: data.studentSpentUsd ?? 0, studentCapUsd: data.studentCapUsd ?? 0, workshopRemainingUsd: data.workshopRemainingUsd ?? 0 };
}
