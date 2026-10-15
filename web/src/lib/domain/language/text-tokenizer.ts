export type TextToken = { piece: string; id: number; wordStart: boolean };

export const UNKNOWN_TOKEN = '<unk>';
export const UNKNOWN_TOKEN_ID = 0;

const characters = [...'abcdefghijklmnopqrstuvwxyzáéíóúüñ0123456789.,;:¿?¡!'];
// A tiny hand-picked subword vocabulary. Real tokenizers learn tens of thousands of pieces (for example with BPE).
const subwords = [
	'hoy', 'en', 'chiqui', 'mula', 'voy', 'la', 'el', 'los', 'las', 'de', 'del', 'al', 'un', 'una', 'y', 'es', 'que', 'me', 'mi',
	'feria', 'aprend', 'izaje', 'inteligencia', 'artificial', 'modelo', 'lenguaje', 'token', 'red', 'neuron', 'al',
	'guate', 'mala', 'universidad', 'mariano', 'gálvez', 'estudi', 'com', 'trabaj', 'ar', 'er', 'ir', 'ción', 'mente',
	'banco', 'río', 'dinero', 'senté', 'deposité', 'junto', 'capital', 'hola', 'buen', 'os', 'as', 'días', 'pro', 'grama',
	'emos', 'amos', 'imos', 'agente', 'segur', 'idad', 'pregunt', 'respuesta', 'computa', 'dora', 'clase', 'taller', 'ia', 'llm', 'gpt', 'claude'
];
const vocabulary = [UNKNOWN_TOKEN, ...new Set([...characters, ...subwords])];
const idByPiece = new Map(vocabulary.map((piece, id) => [piece, id]));
const longestPiece = Math.max(...vocabulary.map((piece) => piece.length));

export const TOY_VOCABULARY_SIZE = vocabulary.length;

function tokenizeWord(word: string): TextToken[] {
	const tokens: TextToken[] = [];
	const letters = [...word];
	let position = 0;
	while (position < letters.length) {
		let match = '';
		for (let length = Math.min(longestPiece, letters.length - position); length > 0; length -= 1) {
			const candidate = letters.slice(position, position + length).join('');
			if (idByPiece.has(candidate)) { match = candidate; break; }
		}
		const piece = match || UNKNOWN_TOKEN;
		tokens.push({ piece, id: idByPiece.get(piece) ?? UNKNOWN_TOKEN_ID, wordStart: position === 0 });
		position += match ? [...match].length : 1;
	}
	return tokens;
}

/** Greedy longest-match tokenizer: each word is split into the longest known pieces, then characters. */
export function tokenizeText(text: string): TextToken[] {
	const words = text.toLowerCase().normalize('NFC').match(/[^\s.,;:¿?¡!]+|[.,;:¿?¡!]/gu) ?? [];
	return words.flatMap(tokenizeWord);
}
