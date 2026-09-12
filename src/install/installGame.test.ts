import { describe, expect, test } from "bun:test";
import { isSymbolFile, PRESERVE_ON_UPDATE, topLevelOf, vanillaPacksOf } from "./installGame";

const ENTRIES = [
	"bedrock_server",
	"bedrock_server_symbols.debug",
	"server.properties",
	"behavior_packs/vanilla/manifest.json",
	"behavior_packs/vanilla_1.21.40/manifest.json",
	"resource_packs/vanilla/textures/blocks.json",
	"definitions/entity/zombie.json",
	"worlds/",
];

describe("reading the archive inventory before unpacking it", () => {
	test("collects the top-level names, which is what a later upgrade deletes", () => {
		expect(topLevelOf(ENTRIES)).toEqual([
			"bedrock_server",
			"bedrock_server_symbols.debug",
			"behavior_packs",
			"definitions",
			"resource_packs",
			"server.properties",
			"worlds",
		]);
	});

	test("collects the vanilla pack folders this build ships, so a later build can sweep the stale ones", () => {
		expect(vanillaPacksOf(ENTRIES)).toEqual([
			"behavior_packs/vanilla",
			"behavior_packs/vanilla_1.21.40",
			"resource_packs/vanilla",
		]);
	});

	test("recognises the debug symbols that make up most of the download", () => {
		expect(isSymbolFile("bedrock_server_symbols.debug")).toBe(true);
		expect(isSymbolFile("bedrock_server")).toBe(false);
	});
});

describe("protecting what the player owns", () => {
	test("never deletes the world, the config or the player lists on an upgrade", () => {
		for (const name of [
			"worlds",
			"server.properties",
			"allowlist.json",
			"permissions.json",
		]) {
			expect(PRESERVE_ON_UPDATE).toContain(name);
		}
	});

	test("never deletes an installed add-on on an upgrade", () => {
		expect(PRESERVE_ON_UPDATE).toContain("behavior_packs");
		expect(PRESERVE_ON_UPDATE).toContain("resource_packs");
	});
});
