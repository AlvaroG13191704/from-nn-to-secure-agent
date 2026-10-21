// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAgentRequest, codesMatch, REQUEST_LIMITS } from './request-validation.ts';

const valid = {
	code: 'UMG-2026',
	studentId: 'b3f1c2d4-1111-4222-8333-944455556666',
	request: { system: 'Eres un asistente.', messages: [{ role: 'user', text: 'Hola' }], schema: { type: 'object' } }
};

test('a well-formed request passes and is returned as a typed value', () => {
	const result = validateAgentRequest(valid);
	assert.equal(result.ok, true);
	assert.equal(result.value.studentId, valid.studentId);
});

test('malformed or oversized requests are rejected with a reason', () => {
	assert.equal(validateAgentRequest(null).ok, false);
	assert.equal(validateAgentRequest({ ...valid, studentId: '' }).reason, 'student');
	assert.equal(validateAgentRequest({ ...valid, studentId: 'x'.repeat(100) }).reason, 'student');
	assert.equal(validateAgentRequest({ ...valid, request: { ...valid.request, messages: [{ role: 'system', text: 'x' }] } }).reason, 'messages');
	const huge = { ...valid, request: { ...valid.request, system: 'x'.repeat(REQUEST_LIMITS.maxTotalChars + 1) } };
	assert.equal(validateAgentRequest(huge).reason, 'too-large');
	const many = { ...valid, request: { ...valid.request, messages: Array.from({ length: REQUEST_LIMITS.maxMessages + 1 }, () => ({ role: 'user', text: 'x' })) } };
	assert.equal(validateAgentRequest(many).reason, 'messages');
});

test('workshop codes compare exactly, and a missing configured code always fails', () => {
	assert.equal(codesMatch('UMG-2026', 'UMG-2026'), true);
	assert.equal(codesMatch('UMG-2025', 'UMG-2026'), false);
	assert.equal(codesMatch('UMG', 'UMG-2026'), false);
	assert.equal(codesMatch('', undefined), false);
});
