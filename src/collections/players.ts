import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { kickCommand, quoted, roster, sampleRoster, send } from "../shared";

const REFRESH_SECONDS = 20;

const DEFAULT_KICK_REASON = "Kicked by an operator";

const textOf = (args: Bridge.Values, key: string, fallback: string) => {
	const value = args[key];

	return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
};

export const players: Bridge.Collection = {
	kind: BridgeKind.Collection,
	requiresRunning: true,
	refreshSeconds: REFRESH_SECONDS,

	async list(context) {
		await sampleRoster(context);

		return roster.all().map((player) => ({
			id: player.id,
			name: player.name,
			xuid: player.xuid,
		}));
	},

	actions: {
		async kick(context, row, args) {
			const reason = textOf(args, "reason", DEFAULT_KICK_REASON);

			await send(context, kickCommand(row.xuid === "" ? String(row.name) : String(row.xuid), reason));

			context.emit(BridgeEventName.PlayerKicked, {
				player: String(row.name),
				reason,
			});
		},

		async op(context, row) {
			await send(context, `op ${quoted(String(row.name))}`);
		},

		async deop(context, row) {
			await send(context, `deop ${quoted(String(row.name))}`);
		},

		async gamemode(context, row, args) {
			const mode = textOf(args, "mode", "survival");

			await send(context, `gamemode ${mode} ${quoted(String(row.name))}`);

			context.emit(BridgeEventName.GameModeChanged, {
				player: String(row.name),
				mode,
			});
		},

		async kill(context, row) {
			await send(context, `kill ${quoted(String(row.name))}`);
		},
	},
};
