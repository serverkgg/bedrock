import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { createRosterSync } from "@serverkgg/bridge/presence";
import { type BedrockPlayer, presenceOf, roster, sampleRoster, watchRoster } from "../shared";

const REFRESH_SECONDS = 20;

const sync = createRosterSync<BedrockPlayer>({
	id: (player) => player.id,
	presenceOf,
});

export const query: Bridge.Query = {
	kind: BridgeKind.Query,
	refreshSeconds: REFRESH_SECONDS,

	async sample(context) {
		watchRoster(context);

		try {
			const pong = await context.probe.raknetPing(context.port("game"));

			if (roster.all().length !== pong.players.online) {
				await sampleRoster(context);
			}

			sync.sync(context, roster.all());

			return {
				online: pong.players.online,
				max: pong.players.max,
			};
		} catch (error) {
			context.log.warn("bedrock did not answer the raknet ping, counting the roster off the log instead", {
				reason: error instanceof Error ? error.message : String(error),
			});

			sync.sync(context, roster.all());

			return {
				online: roster.all().length,
				max: null,
			};
		}
	},
};
