import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { rawTextCommand, send, titleCommand } from "../shared";

const messageOf = (args: Bridge.Values) => {
	const value = args.message;

	if (typeof value !== "string" || value.trim().length === 0) {
		throw new BridgeUserError({
			ar: "اكتب الرسالة الأول.",
			en: "type the message first",
		});
	}

	return value;
};

export const broadcast: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,

	actions: {
		async say(context, args) {
			await send(context, rawTextCommand(messageOf(args)));
		},

		async title(context, args) {
			await send(context, titleCommand(messageOf(args)));
		},
	},
};
