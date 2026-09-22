import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

spawnSync("node", [join(root, "scripts/generate-migration-bundle.mjs")], { encoding: "utf8" });

const bundle = JSON.parse(readFileSync(join(root, "src/lib/migrations/bundle.json"), "utf8"));
const serviceSrc = readFileSync(join(root, "src/lib/migrations/service.ts"), "utf8");
const setupSrc = readFileSync(join(root, "src/lib/setup/migration.ts"), "utf8");

function migrationNames() {
	assert.ok(Array.isArray(bundle.migrations), "bundle.migrations array not found");
	return bundle.migrations.map((migration) => migration.name);
}

test("bootstrap records migrations represented in the current schema so later deploys do not re-apply them", () => {
	const names = migrationNames();
	for (const name of [
		"0013_add_license_settings.sql",
		"0021_add_mailbox_signature.sql",
		"0022_add_mailbox_auto_reply.sql",
		"0027_add_domain_sending_intent.sql",
		"0029_add_spam_protection.sql",
	]) {
		assert.ok(names.includes(name), `Migration bundle is missing ${name}`);
	}
	assert.match(setupSrc, /applyPendingMigrations/, "setup must apply migrations through the shared runner");
	assert.match(
		serviceSrc,
		/INSERT INTO d1_migrations/,
		"the shared runner must record applied migrations so later deploys do not re-apply them",
	);
});

test("fresh bootstrap schema accepts the current Drizzle mailbox and license inserts", () => {
	const statements = bundle.migrations.flatMap((migration) => migration.statements);
	assert.ok(statements.length > 0, "migration bundle contains no statements");

	const py = `
import sqlite3, sys, json
statements = json.load(sys.stdin)
db = sqlite3.connect(":memory:")
for stmt in statements:
    db.execute(stmt)

def columns(table):
    return {row[1] for row in db.execute("PRAGMA table_info(" + table + ")")}

mailbox_cols = columns("mailboxes")
for col in ("signature", "auto_reply_enabled", "auto_reply_subject", "auto_reply_body"):
    assert col in mailbox_cols, "mailboxes missing " + col
assert "sending_requested" in columns("domains"), "domains missing sending_requested"
assert "spam_protection_enabled" in columns("users"), "users missing spam_protection_enabled"

tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
for table in ("license_settings", "auto_reply_deliveries", "spam_token_stats", "spam_reputation", "spam_feedback"):
    assert table in tables, "missing table " + table

db.execute("INSERT INTO users (id,email,password_hash,name,created_at) VALUES ('u','a@b.c','x','n',1)")
db.execute("INSERT INTO domains (id,user_id,hostname,zone_id,created_at) VALUES ('d','u','ex.com','z',1)")
db.execute("""
INSERT INTO mailboxes (
  id, user_id, domain_id, local_part, display_name,
  signature, auto_reply_enabled, auto_reply_subject, auto_reply_body, created_at
) VALUES ('m','u','d','admin','admin','sig',0,'Out of office','',1)
""")
db.execute("INSERT INTO license_settings (id, instance_id, updated_at) VALUES ('default','inst',1)")
db.execute("INSERT INTO auto_reply_deliveries (id, mailbox_id, recipient, sent_at) VALUES ('ar','m','x@y.z',1)")
print("ok")
`;
	const result = spawnSync("python3", ["-c", py], {
		input: JSON.stringify(statements),
		encoding: "utf8",
	});
	assert.equal(result.status, 0, result.stderr + result.stdout);
	assert.match(result.stdout, /^ok$/m);
});
