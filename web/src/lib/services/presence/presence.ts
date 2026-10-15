export type PresenceSnapshot = {
	activeUsers: number;
	simulation: true;
};

export interface PresenceProvider {
	getSnapshot(): PresenceSnapshot;
}

export function createPresenceService(provider: PresenceProvider) {
	return { getSnapshot: () => provider.getSnapshot() };
}
