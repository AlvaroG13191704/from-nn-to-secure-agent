export type LabAnswers = Record<string, string>;
export type LabProgress = { answers: LabAnswers; completed: boolean };

const emptyProgress = (): LabProgress => ({ answers: {}, completed: false });

/** Browser-local lab progress, scoped by lab namespace and registered student. */
export function createLabProgressStore(namespace: string) {
	function storageKey(studentId: string | null) {
		const scope = studentId?.trim() ? `student:${studentId.trim()}` : 'anonymous';
		return `${namespace}:${scope}`;
	}

	function load(studentId: string | null): LabProgress {
		try {
			const raw = window.localStorage.getItem(storageKey(studentId));
			if (!raw) return emptyProgress();
			const parsed: unknown = JSON.parse(raw);
			if (typeof parsed !== 'object' || parsed === null) return emptyProgress();
			const value = parsed as Partial<LabProgress>;
			const answers = typeof value.answers === 'object' && value.answers !== null
				? Object.fromEntries(Object.entries(value.answers).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
				: {};
			return { answers, completed: value.completed === true };
		} catch {
			return emptyProgress();
		}
	}

	function save(studentId: string | null, progress: LabProgress) {
		try {
			window.localStorage.setItem(storageKey(studentId), JSON.stringify(progress));
		} catch {
			// Keep the lab usable when browser storage is unavailable.
		}
	}

	function clear(studentId: string | null): boolean {
		try {
			window.localStorage.removeItem(storageKey(studentId));
			return true;
		} catch {
			return false;
		}
	}

	return { load, save, clear };
}
