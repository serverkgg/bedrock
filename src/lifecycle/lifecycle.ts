import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { resumeStaleHold } from "../backup";
import { SERVER_BINARY, SERVER_STARTED, stopWatchingRoster, watchRoster } from "../shared";

const STOP_TIMEOUT_SECONDS = 120;

const STOP_TIMEOUT_MS = 60_000;

const STOP_REPLY = /Quit correctly|Stopping server/i;

export const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	ready: SERVER_STARTED,
	stopTimeoutSeconds: STOP_TIMEOUT_SECONDS,

	async command() {
		return [
			`./${SERVER_BINARY}`,
		];
	},

	async onReady(context) {
		stopWatchingRoster();
		watchRoster(context);

		await resumeStaleHold(context);
	},

	async stop(context) {
		context.emit(BridgeEventName.ServerStopping);

		await context.command("stop", {
			expect: STOP_REPLY,
			timeoutMs: STOP_TIMEOUT_MS,
		});

		stopWatchingRoster();
	},
};
