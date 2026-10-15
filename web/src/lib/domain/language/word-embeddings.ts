import { addVectors, distance, subtractVectors, type Vector } from './vector-math.ts';

// Hand-made 2D vectors. Real embeddings have hundreds or thousands of dimensions learned during training.
export const WORD_VECTORS = {
	hombre: [1, 1],
	mujer: [1, 3],
	rey: [3, 1],
	reina: [3, 3],
	perro: [-3, -1],
	gato: [-3, -2],
	guatemala: [1, -3],
	chiquimula: [2, -3]
} satisfies Record<string, [number, number]>;

export type EmbeddedWord = keyof typeof WORD_VECTORS;
export const EMBEDDED_WORDS = Object.keys(WORD_VECTORS) as EmbeddedWord[];

export function nearestWord(vector: Vector, exclude: string[] = []): EmbeddedWord {
	const candidates = EMBEDDED_WORDS.filter((word) => !exclude.includes(word));
	return candidates.reduce((best, word) => (distance(WORD_VECTORS[word], vector) < distance(WORD_VECTORS[best], vector) ? word : best));
}

/** a − b + c, then the closest remaining word. */
export function solveAnalogy(a: EmbeddedWord, b: EmbeddedWord, c: EmbeddedWord) {
	const vector = addVectors(subtractVectors(WORD_VECTORS[a], WORD_VECTORS[b]), WORD_VECTORS[c]);
	return { vector, word: nearestWord(vector, [a, b, c]) };
}
