// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { createLabProgressStore } from './lab-progress.ts';

function withFakeStorage(records, run, { failing = false } = {}) {
	const previousWindow = globalThis.window;
	const fail = () => { throw new Error('storage unavailable'); };
	globalThis.window = { localStorage: failing
		? { getItem: fail, setItem: fail, removeItem: fail }
		: {
			getItem: (key) => records.get(key) ?? null,
			setItem: (key, value) => records.set(key, value),
			removeItem: (key) => records.delete(key)
		} };
	try {
		run();
	} finally {
		globalThis.window = previousWindow;
	}
}

test('a namespaced store saves, loads and clears progress per student', () => {
	const records = new Map();
	withFakeStorage(records, () => {
		const store = createLabProgressStore('attention-lab-v1');
		assert.deepEqual(store.load('42'), { answers: {}, completed: false });
		store.save('42', { answers: { attn1_scoreRiver: '3' }, completed: false });
		assert.ok(records.has('attention-lab-v1:student:42'));
		assert.deepEqual(store.load(' 42 ').answers, { attn1_scoreRiver: '3' });
		assert.equal(store.clear('42'), true);
		assert.equal(records.has('attention-lab-v1:student:42'), false);
	});
});

test('anonymous learners use their own key and other namespaces are untouched', () => {
	const records = new Map([['deep-learning-lab-v2:student:42', JSON.stringify({ answers: { a: '1' }, completed: true })]]);
	withFakeStorage(records, () => {
		const store = createLabProgressStore('attention-lab-v1');
		store.save(null, { answers: { attn1_sumExp: '30.19' }, completed: true });
		assert.ok(records.has('attention-lab-v1:anonymous'));
		assert.deepEqual(store.load(''), { answers: { attn1_sumExp: '30.19' }, completed: true });
		assert.deepEqual(store.load('42'), { answers: {}, completed: false });
		store.clear('42');
		assert.ok(records.has('deep-learning-lab-v2:student:42'));
	});
});

test('corrupted records ignore non-string answers and invalid JSON', () => {
	const records = new Map([
		['attention-lab-v1:student:1', JSON.stringify({ answers: { ok: '3', bad: 3, other: null }, completed: 'yes' })],
		['attention-lab-v1:student:2', '{not json'],
		['attention-lab-v1:student:3', 'null']
	]);
	withFakeStorage(records, () => {
		const store = createLabProgressStore('attention-lab-v1');
		assert.deepEqual(store.load('1'), { answers: { ok: '3' }, completed: false });
		assert.deepEqual(store.load('2'), { answers: {}, completed: false });
		assert.deepEqual(store.load('3'), { answers: {}, completed: false });
	});
});

test('storage errors are swallowed and clear reports failure', () => {
	withFakeStorage(new Map(), () => {
		const store = createLabProgressStore('attention-lab-v1');
		assert.deepEqual(store.load('1'), { answers: {}, completed: false });
		assert.doesNotThrow(() => store.save('1', { answers: {}, completed: false }));
		assert.equal(store.clear('1'), false);
	}, { failing: true });
});
