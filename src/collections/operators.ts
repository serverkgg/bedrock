import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import {
	knownPlayerOf,
	PERMISSIONS_FILE,
	quoted,
	readJsonList,
	readKnownPlayers,
	send,
	writeJsonList,
} from "../shared";

export enum PermissionLevel {
	Member = "member",
	Operator = "operator",
	Visitor = "visitor",
}

const LEVELS = new Set<string>(Object.values(PermissionLevel));

export interface PermissionEntry {
	permission: PermissionLevel;
	xuid: string;
}

interface RawEntry {
	permission?: unknown;
	xuid?: unknown;
}

export const normalizePermissions = (entries: unknown[]): PermissionEntry[] => {
	const listed: PermissionEntry[] = [];

	for (const entry of entries as RawEntry[]) {
		if (typeof entry?.xuid !== "string" || entry.xuid.length === 0) {
			continue;
		}

		const permission =
			typeof entry.permission === "string" && LEVELS.has(entry.permission)
				? (entry.permission as PermissionLevel)
				: PermissionLevel.Member;

		listed.push({
			permission,
			xuid: entry.xuid,
		});
	}

	return listed;
};

export const withPermission = (entries: PermissionEntry[], xuid: string, permission: PermissionLevel) => {
	const without = entries.filter((entry) => entry.xuid !== xuid);

	return [
		...without,
		{
			permission,
			xuid,
		},
	];
};

export const withoutPermission = (entries: PermissionEntry[], xuid: string) => {
	return entries.filter((entry) => entry.xuid !== xuid);
};

const readPermissions = async (context: Bridge.Context) => {
	return normalizePermissions(await readJsonList(context, PERMISSIONS_FILE));
};

const levelOf = (args: Bridge.Values) => {
	const value = args.level;

	return typeof value === "string" && LEVELS.has(value) ? (value as PermissionLevel) : PermissionLevel.Operator;
};

export const operators: Bridge.Collection = {
	kind: BridgeKind.Collection,

	async list(context) {
		const players = await readKnownPlayers(context);

		return (await readPermissions(context)).map((entry) => ({
			id: entry.xuid,
			name: players.get(entry.xuid)?.name ?? "",
			xuid: entry.xuid,
			permission: entry.permission,
		}));
	},

	async add(context, input) {
		const needle = input.trim();

		if (needle.length === 0) {
			throw new BridgeUserError({
				ar: "اكتب اسم اللاعب (الـ Gamertag) الأول.",
				en: "type the player's gamertag first",
			});
		}

		if (context.server.running) {
			await send(context, `op ${quoted(needle)}`);

			return;
		}

		const known = knownPlayerOf(await readKnownPlayers(context), needle);

		if (known === null) {
			throw new BridgeUserError({
				ar: "ما نقدر نعطيه أوبريتر والسيرفر مطفي، لأننا ما نعرف رقم حسابه (XUID) إلا إذا دخل السيرفر قبل. شغّل السيرفر، خله يدخل مرة وحدة، وبعدها تقدر تعطيه أوبريتر وقت ما تبي.",
				en: "we cannot make them an operator while the server is off, because we only learn a player's xuid after they have joined once. start the server, let them join once, and after that you can op them any time.",
			});
		}

		await writeJsonList(
			context,
			PERMISSIONS_FILE,
			withPermission(await readPermissions(context), known.xuid, PermissionLevel.Operator),
		);
	},

	actions: {
		async setPermission(context, row, args) {
			const level = levelOf(args);

			await writeJsonList(
				context,
				PERMISSIONS_FILE,
				withPermission(await readPermissions(context), String(row.xuid), level),
			);

			if (context.server.running) {
				await send(context, "permission reload");
			}
		},

		async remove(context, row) {
			const name = String(row.name);

			if (context.server.running && name.length > 0) {
				await send(context, `deop ${quoted(name)}`);

				return;
			}

			await writeJsonList(
				context,
				PERMISSIONS_FILE,
				withoutPermission(await readPermissions(context), String(row.xuid)),
			);

			if (context.server.running) {
				await send(context, "permission reload");
			}
		},
	},
};
