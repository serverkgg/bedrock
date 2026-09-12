import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import {
	ALLOWLIST_FILE,
	allowlistCommand,
	knownPlayerOf,
	readJsonList,
	readKnownPlayers,
	send,
	writeJsonList,
} from "../shared";

export interface AllowlistEntry {
	ignoresPlayerLimit: boolean;
	name: string;
	xuid?: string;
}

interface RawEntry {
	ignoresPlayerLimit?: unknown;
	name?: unknown;
	xuid?: unknown;
}

export const normalizeAllowlist = (entries: unknown[]): AllowlistEntry[] => {
	const listed: AllowlistEntry[] = [];

	for (const entry of entries as RawEntry[]) {
		if (typeof entry?.name !== "string" || entry.name.length === 0) {
			continue;
		}

		listed.push({
			ignoresPlayerLimit: entry.ignoresPlayerLimit === true,
			name: entry.name,
			...(typeof entry.xuid === "string" && entry.xuid.length > 0
				? {
						xuid: entry.xuid,
					}
				: {}),
		});
	}

	return listed;
};

export const withAllowed = (entries: AllowlistEntry[], entry: AllowlistEntry) => {
	const lowered = entry.name.toLowerCase();

	return entries.some((listed) => listed.name.toLowerCase() === lowered)
		? entries
		: [
				...entries,
				entry,
			];
};

export const withoutAllowed = (entries: AllowlistEntry[], name: string) => {
	const lowered = name.toLowerCase();

	return entries.filter((listed) => listed.name.toLowerCase() !== lowered);
};

const readAllowlist = async (context: Bridge.Context) => {
	return normalizeAllowlist(await readJsonList(context, ALLOWLIST_FILE));
};

export const allowlist: Bridge.Collection = {
	kind: BridgeKind.Collection,

	async list(context) {
		const players = await readKnownPlayers(context);

		return (await readAllowlist(context)).map((entry) => {
			const known = entry.xuid === undefined ? knownPlayerOf(players, entry.name) : players.get(entry.xuid);

			return {
				id: entry.xuid ?? `name:${entry.name}`,
				name: entry.name,
				xuid: entry.xuid ?? known?.xuid ?? "",
				seen: known?.lastSeen ?? "",
			};
		});
	},

	async add(context, input) {
		const name = input.trim();

		if (name.length === 0) {
			throw new BridgeUserError({
				ar: "اكتب اسم اللاعب (الـ Gamertag) الأول.",
				en: "type the player's gamertag first",
			});
		}

		if (context.server.running) {
			await send(context, allowlistCommand("add", name));

			return;
		}

		const players = await readKnownPlayers(context);
		const known = knownPlayerOf(players, name);

		await writeJsonList(
			context,
			ALLOWLIST_FILE,
			withAllowed(await readAllowlist(context), {
				ignoresPlayerLimit: false,
				name,
				...(known === null
					? {}
					: {
							xuid: known.xuid,
						}),
			}),
		);
	},

	actions: {
		async remove(context, row) {
			const name = String(row.name);

			if (context.server.running) {
				await send(context, allowlistCommand("remove", name));

				return;
			}

			await writeJsonList(context, ALLOWLIST_FILE, withoutAllowed(await readAllowlist(context), name));
		},
	},
};
