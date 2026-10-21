// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { clearWorkshopData } from './clear-workshop-data.ts';

function fakeStorage(entries) {
	const data = new Map(Object.entries(entries));
	return {
		get length() { return data.size; },
		key: (index) => [...data.keys()][index] ?? null,
		getItem: (key) => data.get(key) ?? null,
		removeItem: (key) => data.delete(key),
		keys: () => [...data.keys()].sort()
	};
}

test('removes the registration and every lab record for any student, and keeps unrelated keys', () => {
	const local = fakeStorage({
		'workshop-introduction-session-v1': '{}',
		'deep-learning-lab-v2:student:201901': '{}',
		'deep-learning-lab-v1:anonymous': '{}',
		'attention-lab-v1:student:201901': '{}',
		'agents-lab-v1:student:other': '{}',
		'agents-brain-v1': '{}',
		'unrelated-site-setting': 'keep'
	});
	const session = fakeStorage({ 'agents-lab-code': 'secret', 'other-session': 'keep' });
	const removed = clearWorkshopData(local, session);
	assert.equal(removed, 7);
	assert.deepEqual(local.keys(), ['unrelated-site-setting']);
	assert.deepEqual(session.keys(), ['other-session']);
});

test('works when there is nothing to clear', () => {
	assert.equal(clearWorkshopData(fakeStorage({}), fakeStorage({})), 0);
});

test('tolerates a missing or blocked storage', () => {
	const blocked = { get length() { throw new Error('blocked'); } };
	assert.equal(clearWorkshopData(blocked, undefined), 0);
});
