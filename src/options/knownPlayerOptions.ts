import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { readKnownPlayers } from "../shared";

const TTL_SECONDS = 30;

const OPTIONS_LIMIT = 64;

export const knownPlayerOptions: Bridge.Options = {
	kind: BridgeKind.Options,
	ttlSeconds: TTL_SECONDS,

	async list(context) {
		const players = [
			...(await readKnownPlayers(context)).values(),
		]
			.sort((left, right) => right.lastSeen.localeCompare(left.lastSeen))
			.slice(0, OPTIONS_LIMIT);

		return players.map((player) => ({
			value: player.xuid,
			label: {
				ar: player.name,
				en: player.name,
			},
		}));
	},
};
