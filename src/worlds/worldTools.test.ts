import { describe, expect, test } from "bun:test";
import type { Bridge } from "@serverkgg/bridge";
import { existingWorld, validateWorldFolder, worldTools } from "./worldTools";

describe("safe world tools", () => {
	test("rejects separators and traversal while keeping existing world names with spaces", () => {
		for (const name of [
			"..",
			"../world",
			"world/../../config",
			"world\nstop",
			"",
		]) {
			expect(() => validateWorldFolder(name)).toThrow();
		}
		expect(validateWorldFolder("My World")).toBe("My World");
	});
	test("resolves rows against real worlds rather than trusting a submitted folder", async () => {
		const context = {
			exec: async () => ({
				code: 0,
				stdout: "worlds/real/level.dat",
				stderr: "",
			}),
		} as unknown as Bridge.Context;
		await expect(existingWorld(context, "forged")).rejects.toThrow();
		expect(await existingWorld(context, "real")).toBe("real");
	});
	test("creates a world with one property update, preserving the old worlds", async () => {
		const writes: Record<string, string>[] = [];
		const context = {
			server: {
				running: false,
			},
			files: {
				exists: async () => false,
			},
			codec: {
				properties: {
					merge: async (_path: string, values: Record<string, string>) => {
						writes.push(values);
					},
				},
			},
			log: () => {},
		} as unknown as Bridge.Context;
		await worldTools.actions.create?.(context, {
			name: "New World",
			seed: "123",
		});
		expect(writes).toEqual([
			{
				"level-name": "New-World",
				"level-seed": "123",
			},
		]);
	});
	test("blocks a world change while the old world is still running", async () => {
		const context = {
			server: {
				running: true,
			},
		} as unknown as Bridge.Context;
		await expect(
			worldTools.actions.create?.(context, {
				name: "new",
			}),
		).rejects.toThrow();
	});
});
