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
		);

		expect(values[PROPERTY_KEYS.serverPort]).toBe("19140");
	});

	test("binds the v6 port one above the game port, since it is never published on its own", () => {
		expect(seedValues({}, 19_140)[PROPERTY_KEYS.serverPortV6]).toBe("19141");
	});

	test("leaves a value the player already set, so their settings survive every boot", () => {
		const values = seedValues(
			{
				[PROPERTY_KEYS.maxPlayers]: "40",
				[PROPERTY_KEYS.difficulty]: "hard",
			},
			19_132,
		);

		expect(values[PROPERTY_KEYS.maxPlayers]).toBeUndefined();
		expect(values[PROPERTY_KEYS.difficulty]).toBeUndefined();
	});

	test("seeds a default only when the key is absent entirely", () => {
		const values = seedValues({}, 19_132);

		expect(values[PROPERTY_KEYS.maxPlayers]).toBe("10");
		expect(values[PROPERTY_KEYS.gamemode]).toBe("survival");
	});

	test("writes booleans the way bedrock reads them, never as 1 and 0", () => {
		const values = seedValues({}, 19_132);

		expect(values[PROPERTY_KEYS.onlineMode]).toBe("true");
		expect(values[PROPERTY_KEYS.allowList]).toBe("false");
	});

	test("turns the allowlist off when the key is absent, so an empty list cannot lock the owner out", () => {
		expect(seedValues({}, 19_132)[PROPERTY_KEYS.allowList]).toBe("false");
	});

	test("renames the shipped level so no path carries the space in 'Bedrock level'", () => {
		expect(seedValues({}, 19_132)[PROPERTY_KEYS.levelName]).toBe(DEFAULT_LEVEL_NAME);
	});

	test("never overrides an allowlist or a level name the player already chose", () => {
		const values = seedValues(
			{
				[PROPERTY_KEYS.allowList]: "true",
				[PROPERTY_KEYS.levelName]: "survival",
			},
			19_132,
		);

		expect(values[PROPERTY_KEYS.allowList]).toBeUndefined();
		expect(values[PROPERTY_KEYS.levelName]).toBeUndefined();
	});

	test("seeds them again after a reset, which wipes the config but keeps the install stamp", () => {
		const values = seedValues({}, 19_132);

		expect(values[PROPERTY_KEYS.allowList]).toBe("false");
		expect(values[PROPERTY_KEYS.levelName]).toBe(DEFAULT_LEVEL_NAME);
	});

	test("keeps the content log off, because it is enormous and the console is the log", () => {
		const values = seedValues(
			{
				[PROPERTY_KEYS.contentLogFileEnabled]: "true",
			},
			19_132,
		);

		expect(values[PROPERTY_KEYS.contentLogFileEnabled]).toBe("false");
	});
});
