export type DeepLearningAnswers = Record<string, string>;
export type DeepLearningProgress = { answers: DeepLearningAnswers; completed: boolean };

function storageKey(studentId: string | null) {
	const scope = studentId?.trim() ? `student:${studentId.trim()}` : 'anonymous';
	return `deep-learning-lab-v2:${scope}`;
}

export function loadDeepLearningProgress(studentId: string | null): DeepLearningProgress {
	try {
		const raw = window.localStorage.getItem(storageKey(studentId));
		if (!raw) return { answers: {}, completed: false };
		const parsed: unknown = JSON.parse(raw);
		if (typeof parsed !== 'object' || parsed === null) return { answers: {}, completed: false };
		const value = parsed as Partial<DeepLearningProgress>;
		const answers = typeof value.answers === 'object' && value.answers !== null
			? Object.fromEntries(Object.entries(value.answers).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
			: {};
		return { answers, completed: value.completed === true };
	} catch {
		return { answers: {}, completed: false };
	}
}

export function saveDeepLearningProgress(studentId: string | null, progress: DeepLearningProgress) {
	try {
		window.localStorage.setItem(storageKey(studentId), JSON.stringify(progress));
	} catch {
		// Keep the lab usable when browser storage is unavailable.
	}
}

export function clearDeepLearningProgress(studentId: string | null): boolean {
	try {
		window.localStorage.removeItem(storageKey(studentId));
		return true;
	} catch {
		return false;
	}
}
