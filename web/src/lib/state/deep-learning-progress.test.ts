// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadDeepLearningProgress, saveDeepLearningProgress, clearDeepLearningProgress } from './deep-learning-progress.ts';

test('the revised lab saves separately without deleting the older browser progress', () => {
	const records = new Map([['deep-learning-lab-v1:student:123', JSON.stringify({ answers: { firstPrediction: '6' }, completed: true })]]);
	const previousWindow = globalThis.window;
	globalThis.window = { localStorage: {
		getItem: (key) => records.get(key) ?? null,
		setItem: (key, value) => records.set(key, value),
		removeItem: (key) => records.delete(key)
	} };
	try {
		assert.deepEqual(loadDeepLearningProgress('123'), { answers: {}, completed: false });
		saveDeepLearningProgress('123', { answers: { mlp2_zH1: '3' }, completed: false });
		assert.deepEqual(loadDeepLearningProgress('123').answers, { mlp2_zH1: '3' });
		assert.ok(records.has('deep-learning-lab-v1:student:123'));
		clearDeepLearningProgress('123');
		assert.ok(records.has('deep-learning-lab-v1:student:123'));
		assert.equal(records.has('deep-learning-lab-v2:student:123'), false);
	} finally {
		globalThis.window = previousWindow;
	}
});
