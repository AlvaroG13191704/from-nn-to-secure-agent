// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBrainPreference, saveBrainPreference } from './brain-preference.ts';

const withStorage = (records, run) => {
	const previous = globalThis.window;
	globalThis.window = { localStorage: { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: (key) => records.delete(key) } };
	try { run(); } finally { globalThis.window = previous; }
};

test('the device check result is saved and restored for the lab', () => {
	withStorage(new Map(), () => {
		assert.equal(loadBrainPreference(), null);
		saveBrainPreference({ brain: 'nano', status: 'ready', checkedAt: 123 });
		assert.deepEqual(loadBrainPreference(), { brain: 'nano', status: 'ready', checkedAt: 123 });
	});
});

test('corrupt or foreign values are ignored', () => {
	withStorage(new Map([['agents-brain-v1', '{"brain":"gpt","status":"ready","checkedAt":1}']]), () => assert.equal(loadBrainPreference(), null));
	withStorage(new Map([['agents-brain-v1', 'not json']]), () => assert.equal(loadBrainPreference(), null));
});
