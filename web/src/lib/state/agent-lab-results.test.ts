// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLabResults, recordLabResult } from './agent-lab-results.ts';

const withStorage = (records, run) => {
	const previous = globalThis.window;
	globalThis.window = { localStorage: { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: (key) => records.delete(key) } };
	try { run(); } finally { globalThis.window = previous; }
};

test('the best result per mission is kept per student: more points first, then lower cost', () => {
	withStorage(new Map(), () => {
		recordLabResult('carnet-1', { missionId: 'library', points: 80, costUsd: 0.002, blocks: ['a'] });
		recordLabResult('carnet-1', { missionId: 'library', points: 60, costUsd: 0.001, blocks: ['b'] });
		recordLabResult('carnet-1', { missionId: 'library', points: 80, costUsd: 0.001, blocks: ['c'] });
		assert.deepEqual(loadLabResults('carnet-1').library.blocks, ['c']);
		assert.deepEqual(loadLabResults('carnet-2'), {});
	});
});
