import type { Bridge } from "@serverkgg/bridge";
import { broadcast, gameplay } from "./actions";
import { announce } from "./announce";
import { backup } from "./backup";
import { allowlist, operators, players } from "./collections";
import { status } from "./details";
import { events } from "./events";
import { install } from "./install";
import { lifecycle } from "./lifecycle";
import { gameVersion, knownPlayerOptions } from "./options";
import { packCatalog, packs } from "./packs";
import { panel } from "./panel";
import { query } from "./query";
import { settings } from "./settings";
import { setup } from "./setup";
import { terminal } from "./terminal";
import { worlds, worldTools } from "./worlds";

export const driver: Bridge.Driver = {
	install,
	lifecycle,
	events,
	query,
	backup,
	announce,
	setup,
	terminal,
	panel,
	modules: {
		allowlist,
		broadcast,
		gameVersion,
		gameplay,
		knownPlayerOptions,
		operators,
		packCatalog,
		packs,
		players,
		settings,
		status,
		worlds,
		worldTools,
	},
};
