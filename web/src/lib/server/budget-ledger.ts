import { BUDGET_LIMITS } from '#lib/domain/agents/budget.js';

const GLOBAL_ID = 'global';
const studentKey = (studentId: string) => `student:${studentId.toLowerCase()}`;

/**
 * Reserves a worst-case amount on the global and the student budgets before calling the model.
 * Each conditional UPDATE is atomic in D1, so concurrent requests cannot both spend the last cents.
 */
export async function reserveBudget(db: D1Database, studentId: string, amountUsd: number): Promise<'ok' | 'global' | 'student'> {
	// A Worker cancelled mid-call never settles; holds untouched for 5 minutes are released (calls time out after 30 s).
	await db.prepare('UPDATE budget SET reserved_usd = 0 WHERE reserved_usd > 0 AND updated_at < unixepoch() - 300').run();
	await db.prepare('INSERT OR IGNORE INTO budget (id, cap_usd) VALUES (?1, ?2)').bind(GLOBAL_ID, BUDGET_LIMITS.globalStopUsd).run();
	await db.prepare('INSERT OR IGNORE INTO budget (id, cap_usd) VALUES (?1, ?2)').bind(studentKey(studentId), BUDGET_LIMITS.studentCapUsd).run();
	const reserve = (id: string) => db
		.prepare('UPDATE budget SET reserved_usd = reserved_usd + ?1, updated_at = unixepoch() WHERE id = ?2 AND spent_usd + reserved_usd + ?1 <= cap_usd')
		.bind(amountUsd, id)
		.run();
	if ((await reserve(GLOBAL_ID)).meta.changes !== 1) return 'global';
	if ((await reserve(studentKey(studentId))).meta.changes !== 1) {
		await releaseBudget(db, GLOBAL_ID, amountUsd);
		return 'student';
	}
	return 'ok';
}

async function releaseBudget(db: D1Database, id: string, amountUsd: number) {
	await db.prepare('UPDATE budget SET reserved_usd = MAX(0, reserved_usd - ?1), updated_at = unixepoch() WHERE id = ?2').bind(amountUsd, id).run();
}

/** Replaces the reservation with the real cost (or zero when the model call failed). */
export async function settleBudget(db: D1Database, studentId: string, reservedUsd: number, actualUsd: number) {
	const settle = db.prepare('UPDATE budget SET reserved_usd = MAX(0, reserved_usd - ?1), spent_usd = spent_usd + ?2, updated_at = unixepoch() WHERE id = ?3');
	await db.batch([settle.bind(reservedUsd, actualUsd, GLOBAL_ID), settle.bind(reservedUsd, actualUsd, studentKey(studentId))]);
}

export async function readBalance(db: D1Database, studentId: string) {
	const rows = await db
		.prepare('SELECT id, cap_usd, spent_usd, reserved_usd FROM budget WHERE id IN (?1, ?2)')
		.bind(GLOBAL_ID, studentKey(studentId))
		.all<{ id: string; cap_usd: number; spent_usd: number; reserved_usd: number }>();
	const find = (id: string) => rows.results.find((row) => row.id === id);
	const global = find(GLOBAL_ID);
	const student = find(studentKey(studentId));
	return {
		studentSpentUsd: student?.spent_usd ?? 0,
		studentCapUsd: student?.cap_usd ?? BUDGET_LIMITS.studentCapUsd,
		workshopRemainingUsd: Math.max(0, (global?.cap_usd ?? BUDGET_LIMITS.globalStopUsd) - (global?.spent_usd ?? 0) - (global?.reserved_usd ?? 0))
	};
}

/** Sliding one-minute window per student, stored in D1 so it holds across Worker instances. */
export async function isOverRateLimit(db: D1Database, studentId: string, now = Date.now()) {
	const windowStart = now - 60_000;
	const row = await db
		.prepare('SELECT COUNT(*) AS count FROM request_log WHERE student_id = ?1 AND created_at > ?2')
		.bind(studentId.toLowerCase(), windowStart)
		.first<{ count: number }>();
	if ((row?.count ?? 0) >= BUDGET_LIMITS.requestsPerMinute) return true;
	await db.batch([
		db.prepare('INSERT INTO request_log (student_id, created_at) VALUES (?1, ?2)').bind(studentId.toLowerCase(), now),
		db.prepare('DELETE FROM request_log WHERE created_at < ?1').bind(now - 3_600_000)
	]);
	return false;
}
