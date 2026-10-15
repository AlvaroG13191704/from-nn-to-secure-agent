import { get, writable } from 'svelte/store';

const storageKey = 'workshop-introduction-session-v1';

export type Registration = {
	name: string;
	studentId: string;
};

export type LocalSession = {
	registration: Registration | null;
	progress: number;
};

const initialSession: LocalSession = { registration: null, progress: 0 };

export function createLocalSession() {
	const session = writable<LocalSession>(initialSession);
	let hydrated = false;

	function persist(next: LocalSession) {
		session.set(next);
		try {
			window.localStorage.setItem(storageKey, JSON.stringify(next));
		} catch {
			// Persistence is best-effort when browser storage is unavailable.
		}
	}

	return {
		session,
		getSnapshot: () => get(session),
		hydrate() {
			if (hydrated) return;
			hydrated = true;
			try {
				const saved = window.localStorage.getItem(storageKey);
				if (!saved) return;
				const parsed: unknown = JSON.parse(saved);
				if (typeof parsed !== 'object' || parsed === null) return;
				const value = parsed as Partial<LocalSession>;
				const registration = value.registration;
				const validRegistration =
					typeof registration === 'object' &&
					registration !== null &&
					typeof registration.name === 'string' &&
					typeof registration.studentId === 'string'
						? { name: registration.name, studentId: registration.studentId }
						: null;
				const progress = Number.isInteger(value.progress)
					? Math.max(0, Math.min(2, value.progress as number))
					: 0;
				session.set({ registration: validRegistration, progress });
			} catch {
				// Keep the safe in-memory defaults for malformed or unavailable storage.
			}
		},
		setProgress(progress: number) {
			const boundedProgress = Math.max(0, Math.min(2, Math.round(progress)));
			persist({ ...get(session), progress: boundedProgress });
		},
		setRegistration(registration: Registration | null) {
			persist({ ...get(session), registration });
		}
	};
}

export type LocalSessionController = ReturnType<typeof createLocalSession>;
