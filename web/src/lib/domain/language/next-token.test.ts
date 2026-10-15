// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { NEXT_TOKEN_EXAMPLE, nextTokenDistribution, sampleTokenIndex } from './next-token.ts';

test('temperature zero is greedy and higher temperature spreads probability', () => {
	const greedy = nextTokenDistribution(NEXT_TOKEN_EXAMPLE.candidates, 0);
	assert.equal(greedy[0], 1);
	const normal = nextTokenDistribution(NEXT_TOKEN_EXAMPLE.candidates, 1);
	const hot = nextTokenDistribution(NEXT_TOKEN_EXAMPLE.candidates, 2);
	assert.ok(normal[0] > hot[0]);
	assert.ok(hot.at(-1) > normal.at(-1));
});

test('sampling walks the cumulative distribution with an injected random number', () => {
	assert.equal(sampleTokenIndex([0.5, 0.3, 0.2], 0.1), 0);
	assert.equal(sampleTokenIndex([0.5, 0.3, 0.2], 0.79), 1);
	assert.equal(sampleTokenIndex([0.5, 0.3, 0.2], 0.999), 2);
});
