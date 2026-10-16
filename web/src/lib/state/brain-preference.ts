import type { BrainKind, NanoStatus } from '#lib/domain/agents/brain-selection.js';

export type BrainPreference = { brain: BrainKind; status: NanoStatus; checkedAt: number };
const KEY = 'agents-brain-v1';

/** Result of the home device check, remembered in this browser for the agents lab. */
export function loadBrainPreference(): BrainPreference | null {
	try {
		const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? 'null');
		if (typeof parsed !== 'object' || parsed === null) return null;
		const value = parsed as Partial<BrainPreference>;
		if ((value.brain !== 'nano' && value.brain !== 'flash') || typeof value.status !== 'string' || typeof value.checkedAt !== 'number') return null;
		return { brain: value.brain, status: value.status as NanoStatus, checkedAt: value.checkedAt };
	} catch {
		return null;
	}
}

export function saveBrainPreference(preference: BrainPreference) {
	try {
		window.localStorage.setItem(KEY, JSON.stringify(preference));
	} catch {
		// The check still works when storage is blocked; the lab will ask again.
	}
}
