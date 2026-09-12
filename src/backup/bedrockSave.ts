import type { Bridge } from "@serverkgg/bridge";
import { SAVE_HOLD_ACK, SAVE_PENDING, SAVE_RESUMED, send, WORLD_SAVED } from "../shared";

const READY_TIMEOUT_MS = 60_000;

const POLL_INTERVAL_MS = 500;

const RESUME_TIMEOUT_MS = 10_000;

export const STALE_HOLD_MS = 120_000;

let holdingSince: number | null = null;

export const holding = () => holdingSince !== null;

export const holdSave = async (context: Bridge.Context) => {
	await send(context, "save hold", SAVE_HOLD_ACK);

	holdingSince = Date.now();

	const deadline = Date.now() + READY_TIMEOUT_MS;

	for (;;) {
		await send(context, "save query");

		const printed = (await context.logs.tail(12)).join("\n");

		if (WORLD_SAVED.test(printed)) {
			return;
		}

		if (Date.now() >= deadline) {
			throw new Error("bedrock never reported the world ready to copy");
		}

		if (!SAVE_PENDING.test(printed)) {
			context.log("waiting for bedrock to finish preparing the world");
		}

		await Bun.sleep(POLL_INTERVAL_MS);
	}
};

export const resumeSave = async (context: Bridge.Context) => {
	try {
		await context.command("save resume", {
			expect: SAVE_RESUMED,
			timeoutMs: RESUME_TIMEOUT_MS,
		});
	} catch (error) {
		context.log.warn("could not confirm that saving resumed", {
			reason: error instanceof Error ? error.message : String(error),
		});
	} finally {
		holdingSince = null;
	}
};

export const resumeStaleHold = async (context: Bridge.Context) => {
	if (holdingSince === null || Date.now() - holdingSince < STALE_HOLD_MS) {
		return;
	}

	context.log.warn("a world hold outlived its backup, resuming saves so writes stop queueing in memory");

	await resumeSave(context);
};
