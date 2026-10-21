type KeyedStorage = Pick<Storage, 'length' | 'key' | 'removeItem'>;

/** Every record the workshop keeps in this browser: registration, lab progress for any student, agent results and choices. */
const LOCAL_PREFIXES = ['workshop-introduction-session-', 'deep-learning-lab-', 'attention-lab-', 'agents-lab-', 'agents-brain-'];
const SESSION_PREFIXES = ['agents-lab-code'];

function removeByPrefix(storage: KeyedStorage | undefined, prefixes: string[]) {
	if (!storage) return 0;
	try {
		const keys: string[] = [];
		for (let index = 0; index < storage.length; index += 1) {
			const key = storage.key(index);
			if (key && prefixes.some((prefix) => key.startsWith(prefix))) keys.push(key);
		}
		keys.forEach((key) => storage.removeItem(key));
		return keys.length;
	} catch {
		// Blocked storage has nothing we can remove.
		return 0;
	}
}

/** Removes the workshop data from this browser and returns how many records were deleted. */
export function clearWorkshopData(local: KeyedStorage | undefined, session: KeyedStorage | undefined) {
	return removeByPrefix(local, LOCAL_PREFIXES) + removeByPrefix(session, SESSION_PREFIXES);
}
