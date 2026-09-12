import type { Bridge } from "@serverkgg/bridge";

export const COMMAND_TIMEOUT_MS = 15_000;

const CONTROL = /[\r\n]+/g;

export const sanitizeMessage = (input: string) => {
	return input.replace(CONTROL, " ").trim().slice(0, 200);
};

export const quoted = (input: string) => {
	const cleaned = input.replace(/["\\]/g, "").trim();

	return cleaned.includes(" ") ? `"${cleaned}"` : cleaned;
};

export const send = async (context: Bridge.Context, input: string, expect?: RegExp) => {
	return await context.command(input, {
		...(expect === undefined
			? {}
			: {
					expect,
				}),
		timeoutMs: COMMAND_TIMEOUT_MS,
	});
};

export const rawTextCommand = (message: string) => {
	return `tellraw @a ${JSON.stringify({
		rawtext: [
			{
				text: sanitizeMessage(message),
			},
		],
	})}`;
};

export const titleCommand = (message: string) => {
	return `title @a title ${JSON.stringify(sanitizeMessage(message))}`;
};

export const kickCommand = (player: string, reason: string) => {
	return `kick ${quoted(player)} ${sanitizeMessage(reason)}`.trim();
};

export const allowlistCommand = (action: "add" | "remove", player: string) => {
	return `allowlist ${action} ${quoted(player)}`;
};
