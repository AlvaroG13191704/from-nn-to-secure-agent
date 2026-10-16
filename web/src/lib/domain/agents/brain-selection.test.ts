// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyNanoAvailability, NANO_REQUIREMENTS } from './brain-selection.ts';

test('a ready Gemini Nano becomes the free local brain', () => {
	const result = classifyNanoAvailability({ supported: true, availability: 'available' });
	assert.equal(result.brain, 'nano');
	assert.equal(result.status, 'ready');
});

test('a downloadable or downloading model asks the student to finish the download at home', () => {
	assert.deepEqual(
		[classifyNanoAvailability({ supported: true, availability: 'downloadable' }).status, classifyNanoAvailability({ supported: true, availability: 'downloading' }).status],
		['needs-download', 'downloading']
	);
	assert.equal(classifyNanoAvailability({ supported: true, availability: 'downloadable' }).brain, 'nano');
});

test('a browser without the API or a device that cannot run it falls back to the budgeted Flash brain', () => {
	for (const input of [{ supported: false }, { supported: true, availability: 'unavailable' }, { supported: true, availability: 'something-new' }, { supported: true, error: 'NotSupportedError' }]) {
		const result = classifyNanoAvailability(input);
		assert.equal(result.brain, 'flash');
		assert.ok(result.message.length > 20);
	}
	assert.equal(classifyNanoAvailability({ supported: false }).status, 'unsupported');
	assert.equal(classifyNanoAvailability({ supported: true, availability: 'unavailable' }).status, 'unavailable');
});

test('the requirements shown to students match the official Chrome documentation', () => {
	assert.equal(NANO_REQUIREMENTS.minChromeVersion, 148);
	assert.equal(NANO_REQUIREMENTS.freeDiskGb, 22);
	assert.equal(NANO_REQUIREMENTS.minRamGb, 16);
	assert.equal(NANO_REQUIREMENTS.minVramGb, 4);
});
