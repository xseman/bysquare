import {
	expect,
	test,
} from "bun:test";
import { join } from "node:path";

const CLI_PATH = join(import.meta.dir, "cli.ts");
const EXAMPLE_JSON = join(import.meta.dir, "../../examples/cli/example.json");
const EXAMPLE_JSONL = join(import.meta.dir, "../../examples/cli/example.jsonl");

async function runCli(args: string[], stdin?: string): Promise<{
	stdout: string;
	stderr: string;
	exitCode: number;
}> {
	const proc = Bun.spawn(["bun", CLI_PATH, ...args], {
		stdin: stdin ? "pipe" : "inherit",
		stdout: "pipe",
		stderr: "pipe",
	});

	if (stdin && proc.stdin) {
		proc.stdin.write(stdin);
		proc.stdin.end();
	}

	const [stdout, stderr] = await Promise.all([
		new Response(proc.stdout).text(),
		new Response(proc.stderr).text(),
	]);

	await proc.exited;

	return {
		stdout: stdout.trim(),
		stderr: stderr.trim(),
		exitCode: proc.exitCode ?? 0,
	};
}

test("version command", async () => {
	const result = await runCli(["version"]);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toContain("bysquare version");
});

test("help command", async () => {
	const result = await runCli(["help"]);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toContain("USAGE:");
	expect(result.stdout).toContain("bysquare encode");
	expect(result.stdout).toContain("bysquare decode");
});

test("no arguments shows usage", async () => {
	const result = await runCli([]);

	expect(result.exitCode).toBe(1);
	expect(result.stderr).toContain("USAGE:");
});

test("unknown command shows error", async () => {
	const result = await runCli(["invalid"]);

	expect(result.exitCode).toBe(1);
	expect(result.stderr).toContain("Unknown command: invalid");
});

test("encode with JSON file", async () => {
	const result = await runCli(["encode", EXAMPLE_JSON]);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toMatch(/^[0-9A-V]+$/);
	expect(result.stdout.length).toBeGreaterThan(50);
});

test("encode with JSONL file", async () => {
	const result = await runCli(["encode", EXAMPLE_JSONL]);

	expect(result.exitCode).toBe(0);
	const lines = result.stdout.split("\n");
	expect(lines.length).toBe(2);
	expect(lines[0]).toMatch(/^[0-9A-V]+$/);
	expect(lines[1]).toMatch(/^[0-9A-V]+$/);
});

test("encode from stdin", async () => {
	const input = JSON.stringify({
		invoiceId: "test",
		payments: [{
			type: 1,
			amount: 100,
			bankAccounts: [{ iban: "SK9611000000002918599669" }],
			currencyCode: "EUR",
			beneficiary: { name: "Test" },
		}],
	});

	const result = await runCli(["encode", "-"], input);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toMatch(/^[0-9A-V]+$/);
});

test("encode with --no-deburr flag", async () => {
	const result = await runCli(["encode", "--no-deburr", EXAMPLE_JSON]);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toMatch(/^[0-9A-V]+$/);
});

test("encode with --no-validate flag", async () => {
	const result = await runCli(["encode", "--no-validate", EXAMPLE_JSON]);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toMatch(/^[0-9A-V]+$/);
});

test("encode with --spec-version 1.0.0", async () => {
	const result = await runCli(["encode", "-s", "1.0.0", EXAMPLE_JSON]);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toMatch(/^00/);
});

test("encode with --spec-version 1.1.0", async () => {
	const result = await runCli(["encode", "-s", "1.1.0", EXAMPLE_JSON]);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toMatch(/^04/);
});

test("encode with --spec-version 1.2.0", async () => {
	const result = await runCli(["encode", "-s", "1.2.0", EXAMPLE_JSON]);

	expect(result.exitCode).toBe(0);
	expect(result.stdout).toMatch(/^08/);
});

test("encode with invalid spec version", async () => {
	const result = await runCli(["encode", "-s", "9.9.9", EXAMPLE_JSON]);

	expect(result.exitCode).toBe(1);
	expect(result.stderr).toContain("unsupported spec version");
});

test("encode with missing file", async () => {
	const result = await runCli(["encode", "nonexistent.json"]);

	expect(result.exitCode).toBe(1);
	expect(result.stderr).toContain("doesn't exist");
});

test("encode with no file argument", async () => {
	const result = await runCli(["encode"]);

	expect(result.exitCode).toBe(1);
	expect(result.stderr).toContain("missing input file argument");
});

test("decode QR string", async () => {
	const qrString =
		"0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5KCH0BB12EJI6C2NFLCHS43I7E8NVVNCAMCF3GSRUMS4EK680FG7L2H6H9UDVLMR955998RVVVBUV000";
	const result = await runCli(["decode", qrString]);

	expect(result.exitCode).toBe(0);

	const parsed = JSON.parse(result.stdout);
	expect(parsed.invoiceId).toBe("random-id");
	expect(parsed.payments).toHaveLength(1);
	expect(parsed.payments[0].amount).toBe(100);
});

test("decode from stdin", async () => {
	const qrString =
		"0804Q000AEM958SPQK31JJFA00H0OBFGMH6PKV0OQSNQPQK5KCH0BB12EJI6C2NFLCHS43I7E8NVVNCAMCF3GSRUMS4EK680FG7L2H6H9UDVLMR955998RVVVBUV000";
	const result = await runCli(["decode", "-"], qrString);

	expect(result.exitCode).toBe(0);

	const parsed = JSON.parse(result.stdout);
	expect(parsed.invoiceId).toBe("random-id");
});

test("decode with no argument", async () => {
	const result = await runCli(["decode"]);

	expect(result.exitCode).toBe(1);
	expect(result.stderr).toContain("missing QR string argument");
});

test("encode and decode round trip", async () => {
	const encodeResult = await runCli(["encode", EXAMPLE_JSON]);
	expect(encodeResult.exitCode).toBe(0);

	const qrString = encodeResult.stdout;
	const decodeResult = await runCli(["decode", qrString]);
	expect(decodeResult.exitCode).toBe(0);

	const decoded = JSON.parse(decodeResult.stdout);
	expect(decoded.invoiceId).toBe("random-id");
	expect(decoded.payments[0].variableSymbol).toBe("123");
});
