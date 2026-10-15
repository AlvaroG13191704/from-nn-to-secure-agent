import { getContext } from 'svelte';
import type { LocalSessionController } from './local-session.js';

export const sessionContextKey = Symbol('local-session');

export function getLocalSession() {
	return getContext<LocalSessionController>(sessionContextKey);
}
