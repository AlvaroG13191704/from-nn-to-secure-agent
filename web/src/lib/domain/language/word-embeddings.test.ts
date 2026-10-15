// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { WORD_VECTORS, solveAnalogy, nearestWord } from './word-embeddings.ts';
import { dot } from './vector-math.ts';

test('the toy plane keeps related words close and supports the king-queen analogy', () => {
	assert.equal(dot(WORD_VECTORS.perro, WORD_VECTORS.gato), 11);
	const result = solveAnalogy('rey', 'hombre', 'mujer');
	assert.deepEqual(result.vector, [3, 3]);
	assert.equal(result.word, 'reina');
	assert.equal(nearestWord(WORD_VECTORS.chiquimula, ['chiquimula']), 'guatemala');
});
