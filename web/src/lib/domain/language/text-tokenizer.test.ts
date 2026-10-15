// @ts-nocheck

import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeText, UNKNOWN_TOKEN_ID } from './text-tokenizer.ts';

test('known subwords split Chiquimula into two tokens with stable ids', () => {
	const tokens = tokenizeText('Chiquimula');
	assert.deepEqual(tokens.map((token) => token.piece), ['chiqui', 'mula']);
	assert.deepEqual(tokens.map((token) => token.wordStart), [true, false]);
	assert.deepEqual(tokenizeText('chiquimula').map((token) => token.id), tokens.map((token) => token.id));
});

test('sentences keep word boundaries, punctuation, and fall back to characters or unknown', () => {
	const tokens = tokenizeText('Hoy en Chiquimula, aprendizaje 🙂');
	assert.deepEqual(tokens.map((token) => token.piece), ['hoy', 'en', 'chiqui', 'mula', ',', 'aprend', 'izaje', '<unk>']);
	assert.equal(tokens.at(-1).id, UNKNOWN_TOKEN_ID);
	assert.deepEqual(tokenizeText('xyz').map((token) => token.piece), ['x', 'y', 'z']);
	assert.deepEqual(tokenizeText('   '), []);
});
