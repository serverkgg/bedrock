import { describe, expect, test } from "bun:test";
import { levelDirectories, safeWorldFolder, worldFolders } from "./world";

describe("discovering bedrock worlds", () => {
	test("reads the folder out of each worlds/<name>/level.dat hit", () => {
		const output = [
			"worlds/world/level.dat",
			"worlds/Survival with the kids/level.dat",
		].join("\n");

		expect(worldFolders(output)).toEqual([
			"Survival with the kids",
			"world",
		]);
	});

	test("ignores a level.dat nested deeper than a world folder", () => {
		expect(worldFolders("worlds/world/backup/level.dat")).toEqual([]);
	});

	test("takes an uploaded .mcworld at the root of the archive, where bedrock puts it", () => {
		expect(levelDirectories("level.dat")).toEqual([
			".",
		]);
	});

	test("also takes a world someone zipped as a folder instead of exporting it", () => {
		expect(levelDirectories(".serverk-worlds/upload/My World/level.dat")).toEqual([
			".serverk-worlds/upload/My World",
		]);
	});
});

describe("naming an imported world folder", () => {
	test("keeps a plain name as it is", () => {
		expect(safeWorldFolder("survival")).toBe("survival");
	});

	test("replaces what a path cannot carry, including the spaces a phone export brings", () => {
		expect(safeWorldFolder("Survival with the kids")).toBe("Survival-with-the-kids");
	});

	test("never leaves a folder name that starts or ends with punctuation", () => {
		expect(safeWorldFolder("...world...")).toBe("world");
	});

	test("refuses to build a path out of a traversal attempt", () => {
		expect(safeWorldFolder("../../etc")).toBe("etc");
	});
});
