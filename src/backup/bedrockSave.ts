import type { Bridge } from "@serverkgg/bridge";
import { SAVE_HOLD_ACK, SAVE_PENDING, SAVE_RESUMED, send, WORLD_SAVED, withoutLogPrefix, worldPath } from "../shared";
import { activeWorld } from "../worlds";

const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;
const RESUME_TIMEOUT_MS = 10_000;
let held = false;
export const holding = () => held;

export const parseSaveFiles = (
	line: string,
	world: string,
): {
	path: string;
	size: number;
}[] => {
	const root = worldPath(world);
	return withoutLogPrefix(line)
		.split(",")
		.map((entry) => {
			const match = entry.trim().match(/^(.+):(\d+)$/);
			if (!match) {
				throw new Error("Bedrock returned an invalid backup file list");
			}
			const source = match[1] ?? "";
			const path = source.startsWith("worlds/") ? source : `worlds/${source}`;
			const size = Number(match[2]);
			if (
				!path.startsWith(`${root}/`)
				|| path.includes("\\")
				|| path.split("/").some((part) => part === ".." || part === "." || part.length === 0)
				|| !Number.isSafeInteger(size)
			) {
				throw new Error("Bedrock returned an unsafe backup file boundary");
			}
			return {
				path,
				size,
			};
		});
};

export const holdSave = async (context: Bridge.Context) => {
	if (held) {
		throw new Error("a backup already owns the world save hold");
	}
	held = true;
	await send(context, "save hold", SAVE_HOLD_ACK);
	const world = await activeWorld(context);
	const deadline = Date.now() + READY_TIMEOUT_MS;
	let ready = false;
	const files = new Map<
		string,
		{
			path: string;
			size: number;
		}
	>();
	let invalid: Error | null = null;
	const unsubscribe = context.logs.follow(/.+/, (match) => {
		const line = match[0];
		if (WORLD_SAVED.test(line)) {
			ready = true;
			return;
		}
		if (!ready || !/:\d+(?:,|$)/.test(line.trim())) {
			return;
		}
		try {
			for (const file of parseSaveFiles(line, world)) {
				files.set(file.path, file);
			}
		} catch (error) {
			invalid = error instanceof Error ? error : new Error(String(error));
		}
	});
	try {
		while (Date.now() < deadline) {
			await send(context, "save query", new RegExp(`${WORLD_SAVED.source}|${SAVE_PENDING.source}`));
			await Bun.sleep(POLL_INTERVAL_MS);
			if (invalid !== null) {
				throw invalid;
			}
			if (ready && files.size > 0) {
				const root = worldPath(world);
				for (const entry of await context.files.list("**/*", {
					directory: root,
				})) {
					if (
						!entry.directory
						&& entry.path.startsWith(`${root}/`)
						&& !entry.path.startsWith(`${root}/db/`)
						&& !files.has(entry.path)
					) {
						files.set(entry.path, {
							path: entry.path,
							size: entry.sizeBytes,
						});
					}
				}
				return {
					roots: [
						worldPath(world),
					],
					files: [
						...files.values(),
					],
				};
			}
		}
		throw new Error("Bedrock did not return a fresh backup file list");
	} finally {
		unsubscribe();
	}
};

export const resumeSave = async (context: Bridge.Context) => {
	await context.command("save resume", {
		expect: SAVE_RESUMED,
		timeoutMs: RESUME_TIMEOUT_MS,
	});
	held = false;
};
