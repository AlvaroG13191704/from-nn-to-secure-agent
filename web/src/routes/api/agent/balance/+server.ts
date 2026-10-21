import { json } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import type { RequestHandler } from './$types';
import { codesMatch } from '#lib/domain/agents/request-validation.js';
import { readBalance } from '#lib/server/budget-ledger.js';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as { code?: unknown; studentId?: unknown } | null;
	if (typeof body?.code !== 'string' || typeof body.studentId !== 'string' || !/^[A-Za-z0-9-]{3,64}$/.test(body.studentId)) return json({ error: 'invalid-request' }, { status: 400 });
	if (!codesMatch(body.code, env.WORKSHOP_CODE)) return json({ error: 'lab-closed' }, { status: 403 });
	return json(await readBalance(env.DB, body.studentId));
};
