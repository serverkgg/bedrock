import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { rawTextCommand, send } from "../shared";

export const announce: Bridge.Announce = {
	kind: BridgeKind.Announce,

	async announce(context, message) {
		await send(context, rawTextCommand(message));
	},
};
