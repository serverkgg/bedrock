import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { send } from "../shared";

const DIFFICULTIES = [
	"peaceful",
	"easy",
	"normal",
	"hard",
];

const choiceOf = (args: Bridge.Values, key: string, allowed: string[]) => {
	const value = args[key];

	if (typeof value !== "string" || !allowed.includes(value)) {
		throw new BridgeUserError({
			ar: "الخيار اللي اخترته مو مدعوم.",
			en: "that choice is not one the server accepts",
		});
	}

	return value;
};

export const gameplay: Bridge.Actions = {
	kind: BridgeKind.Actions,
	requiresRunning: true,

	actions: {
		async timeDay(context) {
			await send(context, "time set day");
		},

		async timeNight(context) {
			await send(context, "time set night");
		},

		async weatherClear(context) {
			await send(context, "weather clear");
		},

		async weatherRain(context) {
			await send(context, "weather rain");
		},

		async weatherThunder(context) {
			await send(context, "weather thunder");
		},

		async difficulty(context, args) {
			await send(context, `changesetting difficulty ${choiceOf(args, "difficulty", DIFFICULTIES)}`);
		},

		async allowlistOn(context) {
			await send(context, "allowlist on");
		},

		async allowlistOff(context) {
			await send(context, "allowlist off");
		},

		async reloadPermissions(context) {
			await send(context, "permission reload");
		},
	},
};
