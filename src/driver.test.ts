import { describe, expect, test } from "bun:test";
import type { BridgeSection, BridgeSectionAction } from "@serverkgg/bridge";
import { BRIDGE_EVENT_NAMES } from "@serverkgg/bridge/protocol";
import { driver } from "./driver";

const modules = driver.modules ?? {};

const sections = (driver.panel?.tabs ?? []).flatMap((tab) => tab.sections);

const actionsOf = (section: BridgeSection): BridgeSectionAction[] => {
	return "actions" in section ? (section.actions ?? []) : [];
};

const RESERVED_MODULE_IDS = [
	"announce",
	"backup",
	"events",
	"install",
	"lifecycle",
	"pending",
	"query",
	"setup",
];

const ROOT = new URL("..", import.meta.url).pathname;

describe("validating the driver the way the platform does", () => {
	test("passes the same validateDriver run that happens at publish and at boot", () => {
		const result = Bun.spawnSync(
			[
				`${ROOT}node_modules/.bin/serverk-bridge`,
				"validate",
			],
			{
				cwd: ROOT,
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		expect(`${result.stdout.toString()}${result.stderr.toString()}`).toContain("bedrock is valid");
		expect(result.exitCode).toBe(0);
	});
});

describe("assembling the bedrock driver", () => {
	test("declares the two capabilities the platform cannot boot without", () => {
		expect(driver.install).toBeDefined();
		expect(driver.lifecycle).toBeDefined();
	});

	test("keeps every panel section bound to a module the driver actually registers", () => {
		for (const section of sections) {
			const module = section.module;

			if (module === undefined) {
				continue;
			}

			expect(Object.keys(modules)).toContain(module);
		}
	});

	test("never registers a module id the runtime reserves for a top-level capability", () => {
		for (const id of RESERVED_MODULE_IDS) {
			expect(Object.keys(modules)).not.toContain(id);
		}
	});

	test("emits only event names the platform taxonomy carries", () => {
		const emitted = [
			...(driver.events?.patterns ?? []).map((pattern) => pattern.emit),
			...(driver.events?.emits ?? []),
		];

		for (const name of emitted) {
			expect(BRIDGE_EVENT_NAMES).toContain(name);
		}
	});
});

describe("refusing to promise what bedrock cannot do", () => {
	test("raises no ban, death or advancement event, because BDS reports none of them", () => {
		const emitted = [
			...(driver.events?.patterns ?? []).map((pattern) => pattern.emit),
			...(driver.events?.emits ?? []),
		];

		expect(emitted).not.toContain("player-banned");
		expect(emitted).not.toContain("player-died");
		expect(emitted).not.toContain("player-advanced");
	});

	test("offers no ban action and no per-dimension reset, because bedrock has neither", () => {
		const actionIds = sections.flatMap((section) => actionsOf(section).map((action) => action.id));

		expect(actionIds).not.toContain("ban");
		expect(actionIds).not.toContain("resetNether");
		expect(actionIds).not.toContain("resetEnd");
	});

	test("declares no pending module, because nothing about bedrock waits on a companion upload", () => {
		expect(driver.pending).toBeUndefined();
	});
});
