-- Budget ledger for the agents lab. All amounts are USD.
CREATE TABLE IF NOT EXISTS budget (
	id TEXT PRIMARY KEY,           -- 'global' or 'student:<id>'
	cap_usd REAL NOT NULL,
	spent_usd REAL NOT NULL DEFAULT 0,
	reserved_usd REAL NOT NULL DEFAULT 0,
	updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS request_log (
	student_id TEXT NOT NULL,
	created_at INTEGER NOT NULL      -- milliseconds since epoch
);
CREATE INDEX IF NOT EXISTS request_log_student_time ON request_log (student_id, created_at);

INSERT OR IGNORE INTO budget (id, cap_usd) VALUES ('global', 9.5);
