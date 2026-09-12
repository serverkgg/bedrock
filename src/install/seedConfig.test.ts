import { describe, expect, test } from "bun:test";
import { PROPERTY_KEYS } from "../shared";
import { DEFAULT_LEVEL_NAME, seedValues } from "./seedConfig";

describe("seeding server.properties", () => {
	test("forces the port onto whatever the platform allocated, overwriting what is already there", () => {
		const values = seedValues(
			{
				[PROPERTY_KEYS.serverPort]: "19999",
			},
			19_140,
			false,
		);

		expect(values[PROPERTY_KEYS.serverPort]).toBe("19140");
	});

	test("binds the v6 port one above the game port, since it is never published on its own", () => {
		expect(seedValues({}, 19_140, false)[PROPERTY_KEYS.serverPortV6]).toBe("19141");
	});

	test("leaves a value the player already set, so their settings survive every boot", () => {
		const values = seedValues(
			{
				[PROPERTY_KEYS.maxPlayers]: "40",
				[PROPERTY_KEYS.difficulty]: "hard",
			},
			19_132,
			false,
		);

		expect(values[PROPERTY_KEYS.maxPlayers]).toBeUndefined();
		expect(values[PROPERTY_KEYS.difficulty]).toBeUndefined();
	});

	test("seeds a default only when the key is absent entirely", () => {
		const values = seedValues({}, 19_132, false);

		expect(values[PROPERTY_KEYS.maxPlayers]).toBe("10");
		expect(values[PROPERTY_KEYS.gamemode]).toBe("survival");
	});

	test("writes booleans as true and false, never as 1 and 0, which bedrock does not read", () => {
		const values = seedValues({}, 19_132, true);

		expect(values[PROPERTY_KEYS.onlineMode]).toBe("true");
		expect(values[PROPERTY_KEYS.allowList]).toBe("false");
	});

	test("turns the allowlist off on a first install, so an empty list cannot lock the owner out", () => {
		expect(
			seedValues(
				{
					[PROPERTY_KEYS.allowList]: "true",
				},
				19_132,
				true,
			)[PROPERTY_KEYS.allowList],
		).toBe("false");
	});

	test("never touches the allowlist or the level name on a later boot", () => {
		const values = seedValues(
			{
				[PROPERTY_KEYS.allowList]: "true",
			},
			19_132,
			false,
		);

		expect(values[PROPERTY_KEYS.allowList]).toBeUndefined();
		expect(values[PROPERTY_KEYS.levelName]).toBeUndefined();
	});

	test("renames the shipped level so no path carries the space in 'Bedrock level'", () => {
		expect(seedValues({}, 19_132, true)[PROPERTY_KEYS.levelName]).toBe(DEFAULT_LEVEL_NAME);
	});

	test("keeps the content log off, because it is enormous and the console is the log", () => {
		expect(
			seedValues(
				{
					[PROPERTY_KEYS.contentLogFileEnabled]: "true",
				},
				19_132,
				false,
			)[PROPERTY_KEYS.contentLogFileEnabled],
		).toBe("false");
	});
});
