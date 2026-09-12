import type { Bridge } from "@serverkgg/bridge";
import {
	ALLOWLIST_FILE,
	BEHAVIOR_PACKS_DIRECTORY,
	mergeProperties,
	PERMISSIONS_FILE,
	PROPERTY_KEYS,
	RESOURCE_PACKS_DIRECTORY,
	readProperties,
	WORLDS_DIRECTORY,
} from "../shared";

export const DEFAULT_LEVEL_NAME = "world";

const DEFAULTS: Record<string, string> = {
	[PROPERTY_KEYS.allowCheats]: "false",
	[PROPERTY_KEYS.allowList]: "false",
	[PROPERTY_KEYS.chatRestriction]: "None",
	[PROPERTY_KEYS.clientSideChunkGeneration]: "true",
	[PROPERTY_KEYS.defaultPlayerPermissionLevel]: "member",
	[PROPERTY_KEYS.difficulty]: "easy",
	[PROPERTY_KEYS.disablePlayerInteraction]: "false",
	[PROPERTY_KEYS.enableLanVisibility]: "true",
	[PROPERTY_KEYS.forceGamemode]: "false",
	[PROPERTY_KEYS.gamemode]: "survival",
	[PROPERTY_KEYS.levelName]: DEFAULT_LEVEL_NAME,
	[PROPERTY_KEYS.levelSeed]: "",
	[PROPERTY_KEYS.maxPlayers]: "10",
	[PROPERTY_KEYS.maxThreads]: "8",
	[PROPERTY_KEYS.onlineMode]: "true",
	[PROPERTY_KEYS.playerIdleTimeout]: "30",
	[PROPERTY_KEYS.serverName]: "Serverk",
	[PROPERTY_KEYS.texturepackRequired]: "false",
	[PROPERTY_KEYS.tickDistance]: "4",
	[PROPERTY_KEYS.viewDistance]: "32",
};

export const seedValues = (current: Record<string, string>, port: number) => {
	const values: Record<string, string> = {
		[PROPERTY_KEYS.contentLogFileEnabled]: "false",
		[PROPERTY_KEYS.serverPort]: String(port),
		[PROPERTY_KEYS.serverPortV6]: String(port + 1),
	};

	for (const [key, value] of Object.entries(DEFAULTS)) {
		if (!Object.hasOwn(current, key)) {
			values[key] = value;
		}
	}

	return values;
};

export const seedConfig = async (context: Bridge.Context) => {
	await context.files.ensure(WORLDS_DIRECTORY, BEHAVIOR_PACKS_DIRECTORY, RESOURCE_PACKS_DIRECTORY);

	for (const file of [
		ALLOWLIST_FILE,
		PERMISSIONS_FILE,
	]) {
		if (!(await context.files.exists(file))) {
			await context.files.write(file, "[]\n");
		}
	}

	await mergeProperties(context, seedValues(await readProperties(context), context.port("game")));
};
