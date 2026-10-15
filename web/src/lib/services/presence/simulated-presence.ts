import type { PresenceProvider } from './presence.js';

export const simulatedPresenceProvider: PresenceProvider = {
	getSnapshot: () => ({ activeUsers: 18, simulation: true })
};
