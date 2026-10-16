export type LabResult = { missionId: string; points: number; costUsd: number; blocks: string[] };
type Results = Record<string, LabResult>;

const key = (studentId: string | null) => `agents-lab-v1:${studentId?.trim() ? `student:${studentId.trim()}` : 'anonymous'}`;

export function loadLabResults(studentId: string | null): Results {
	try {
		const parsed: unknown = JSON.parse(window.localStorage.getItem(key(studentId)) ?? '{}');
		return typeof parsed === 'object' && parsed !== null ? (parsed as Results) : {};
	} catch {
		return {};
	}
}

/** Keeps the best run per mission: more points wins; on a tie, the cheaper run wins. */
export function recordLabResult(studentId: string | null, result: LabResult) {
	const results = loadLabResults(studentId);
	const best = results[result.missionId];
	if (best && (best.points > result.points || (best.points === result.points && best.costUsd <= result.costUsd))) return results;
	results[result.missionId] = result;
	try {
		window.localStorage.setItem(key(studentId), JSON.stringify(results));
	} catch {
		// The lab keeps working when storage is blocked.
	}
	return results;
}
