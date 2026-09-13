import { describe, expect, test } from "bun:test";
import { packDirectory, packFolderName } from "./packInstall";
import { PackKind } from "./packManifest";
import { parsePackSidecar } from "./packSidecar";

describe("placing an installed pack on disk", () => {
	test("puts behavior and resource packs where bedrock looks for them", () => {
		expect(packDirectory(PackKind.Behavior)).toBe("behavior_packs");
		expect(packDirectory(PackKind.Resource)).toBe("resource_packs");
	});

	test("suffixes the folder with the uuid, so reinstalling the same pack lands in the same place", () => {
		const uuid = "8f3a1b2c-0000-0000-0000-000000000001";

		expect(packFolderName("Cool Addon", uuid)).toBe(`Cool-Addon-${uuid}`);
		expect(packFolderName("Cool Addon", uuid)).toBe(packFolderName("Cool Addon", uuid));
	});

	test("keeps two packs that share a display name apart, because the uuid differs", () => {
		expect(packFolderName("Addon", "aaaaaaaa-0000")).not.toBe(packFolderName("Addon", "bbbbbbbb-0000"));
	});

	test("keeps an arabic title in the folder name, because arabic is the source language here", () => {
		expect(packFolderName("!!! أدون !!!", "8f3a1b2c-0000")).toBe("أدون-8f3a1b2c-0000");
	});

	test("still refuses anything that could climb out of the packs directory", () => {
		expect(packFolderName("../../etc", "8f3a1b2c-0000")).toBe("etc-8f3a1b2c-0000");
	});
});

describe("reading the pack ledger back", () => {
	test("keeps a record written by a previous install", () => {
		const text = JSON.stringify({
			world: "world",
			packs: {
				a: {
					kind: "behavior",
					folder: "behavior_packs/cool-a1b2c3d4",
					title: "Cool",
					version: [
						1,
						0,
						0,
					],
					versionText: "1.0.0",
					order: 2,
				},
			},
		});

		const sidecar = parsePackSidecar(text);

		expect(sidecar.world).toBe("world");
		expect(sidecar.packs.a?.title).toBe("Cool");
		expect(sidecar.packs.a?.order).toBe(2);
	});

	test("answers an empty ledger for a corrupt file rather than throwing", () => {
		expect(parsePackSidecar("{not json").packs).toEqual({});
		expect(parsePackSidecar("[]").packs).toEqual({});
	});

	test("drops a record whose kind is not one bedrock has", () => {
		const text = JSON.stringify({
			world: "world",
			packs: {
				a: {
					kind: "nonsense",
					folder: "x",
				},
			},
		});

		expect(parsePackSidecar(text).packs).toEqual({});
	});
});
