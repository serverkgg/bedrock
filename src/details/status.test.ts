import { describe, expect, test } from "bun:test";
import { isContentError } from "./status";

describe("spotting add-on errors in the console", () => {
	test("catches the lines a real server prints when a pack or script fails to load", () => {
		for (const line of [
			"[2026-09-13 08:55:41:321 ERROR] [Scripting] Plugin [Repair Probe Beta - 1.0.0] - requesting dependency on beta APIs [@minecraft/server - 2.10.0-beta], but the Beta APIs experiment is not enabled.",
			"[2026-09-13 08:55:41:284 ERROR] The following issues were found when loading packs:",
			"\t\tUnable to find manifest in pack.",
			"[2026-09-13 08:55:41:300 WARN] [Scripting] Unhandled promise rejection: TypeError: not a function",
			"Missing dependency for pack",
		]) {
			expect(isContentError(line)).toBe(true);
		}
	});

	test("ignores what an add-on logs on purpose and the ordinary boot lines", () => {
		for (const line of [
			"[2026-09-13 08:55:41:336 WARN] [Scripting] serverk repair probe",
			"[2026-09-13 08:55:41:311 INFO] Pack Stack - [00] Repair Probe Beta (id: cccccccc, version: 1.0.0)",
			"[2026-09-13 08:55:42:269 INFO] Server started.",
		]) {
			expect(isContentError(line)).toBe(false);
		}
	});
});
