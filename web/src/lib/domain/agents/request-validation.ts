import type { BrainRequest, HarnessMessage } from './harness.ts';

export const REQUEST_LIMITS = { maxMessages: 16, maxTotalChars: 24_000 } as const;
export type AgentRequest = { code: string; studentId: string; request: BrainRequest };
type Rejection = 'body' | 'code' | 'student' | 'messages' | 'too-large';
export type ValidationResult = { ok: true; value: AgentRequest } | { ok: false; reason: Rejection };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isMessage = (value: unknown): value is HarnessMessage => isRecord(value) && (value.role === 'user' || value.role === 'model') && typeof value.text === 'string';

/** Checks the shape and size of a lab request before any budget is reserved. */
export function validateAgentRequest(body: unknown): ValidationResult {
	if (!isRecord(body) || !isRecord(body.request)) return { ok: false, reason: 'body' };
	if (typeof body.code !== 'string') return { ok: false, reason: 'code' };
	// Same rule as the registration form (carnet), with room for longer generated ids.
	if (typeof body.studentId !== 'string' || !/^[A-Za-z0-9-]{3,64}$/.test(body.studentId)) return { ok: false, reason: 'student' };
	const { system, messages, schema } = body.request;
	if (typeof system !== 'string' || !isRecord(schema)) return { ok: false, reason: 'body' };
	if (!Array.isArray(messages) || messages.length === 0 || messages.length > REQUEST_LIMITS.maxMessages || !messages.every(isMessage)) return { ok: false, reason: 'messages' };
	const size = system.length + JSON.stringify(schema).length + messages.reduce((total, message) => total + message.text.length, 0);
	if (size > REQUEST_LIMITS.maxTotalChars) return { ok: false, reason: 'too-large' };
	return { ok: true, value: { code: body.code, studentId: body.studentId, request: { system, messages, schema } } };
}

/** Constant-time comparison so response timing does not reveal how much of the code matched. */
export function codesMatch(given: string, expected: string | undefined) {
	if (!expected || given.length !== expected.length) return false;
	let difference = 0;
	for (let index = 0; index < expected.length; index += 1) difference |= given.charCodeAt(index) ^ expected.charCodeAt(index);
	return difference === 0;
}
