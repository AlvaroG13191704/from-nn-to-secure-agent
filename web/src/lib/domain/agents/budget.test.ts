// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import {
	BUDGET_LIMITS,
	costUsd,
	estimateTokens,
	reservationUsd,
	settleUsage,
	isRateLimited,
	formatUsd
} from './budget.ts';

const pricing = { inputPerMillion: 0.75, outputPerMillion: 3.75 };
const close = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t, `${a} ≉ ${b}`);

test('agreed limits: $10 cap with a stop margin, $0.25 per student, short calls and loops', () => {
	assert.equal(BUDGET_LIMITS.globalCapUsd, 10);
	assert.equal(BUDGET_LIMITS.globalStopUsd, 9.5);
	assert.equal(BUDGET_LIMITS.studentCapUsd, 0.25);
	assert.equal(BUDGET_LIMITS.maxOutputTokens, 1024);
	assert.equal(BUDGET_LIMITS.maxSteps, 6);
	assert.equal(BUDGET_LIMITS.requestsPerMinute, 10);
});

test('cost counts thinking tokens as output and uses per-million prices', () => {
	close(costUsd({ inputTokens: 1_000_000, outputTokens: 0, thinkingTokens: 0 }, pricing), 0.75);
	close(costUsd({ inputTokens: 2000, outputTokens: 300, thinkingTokens: 100 }, pricing), 2000 * 0.75e-6 + 400 * 3.75e-6);
});

test('the reservation covers the worst case before calling the model', () => {
	const text = 'a'.repeat(3000);
	// One token per character is a true upper bound, even for CJK text or emoji.
	assert.equal(estimateTokens(text), 3000);
	assert.equal(estimateTokens('猫🙂'), 3);
	const reserved = reservationUsd(text, pricing);
	close(reserved, estimateTokens(text) * 0.75e-6 + BUDGET_LIMITS.maxOutputTokens * 3.75e-6);
	const actual = costUsd({ inputTokens: 800, outputTokens: 120, thinkingTokens: 0 }, pricing);
	assert.ok(actual <= reserved);
});

test('settling replaces the reservation with the real cost', () => {
	const settled = settleUsage({ spentUsd: 0.1, reservedUsd: 0.004 }, 0.001);
	close(settled.spentUsd, 0.101);
	assert.equal(settled.reservedUsd, 0);
});

test('rate limit counts requests in the last minute only', () => {
	const now = 100_000;
	const recent = Array.from({ length: 10 }, (_, index) => now - index * 1000);
	assert.equal(isRateLimited(recent, now), true);
	assert.equal(isRateLimited(recent.slice(1), now), false);
	assert.equal(isRateLimited([now - 61_000, ...recent.slice(1)], now), false);
});

test('costs format as small dollar amounts', () => {
	assert.equal(formatUsd(0.25), '$0.25');
	assert.equal(formatUsd(0.00412), '$0.0041');
});
