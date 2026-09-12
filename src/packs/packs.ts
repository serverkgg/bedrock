import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import {
	BEHAVIOR_PACKS_DIRECTORY,
	isUnder,
	nameOf,
	PACK_STAGING,
	RESOURCE_PACKS_DIRECTORY,
	relativeUploadPath,
	withoutExtension,
} from "../shared";
import { activeWorld } from "../worlds";
import { discoverPacks, unpackArchive } from "./packArchive";
import { resolvePackText } from "./packLang";
import { PackKind } from "./packManifest";
import { movePackEntry, readWorldPacks, withPackActivated, withPackDeactivated, writeWorldPacks } from "./packRegistry";
import { type PackRecord, readPackSidecar, writePackSidecar } from "./packSidecar";

const UNSAFE_CHARACTERS = /[^\p{L}\p{N}._-]+/gu;

const EDGE_CHARACTERS = /^[-._]+|[-._]+$/gu;

const TITLE_LIMIT = 40;

export const packDirectory = (kind: PackKind) => {
	return kind === PackKind.Behavior ? BEHAVIOR_PACKS_DIRECTORY : RESOURCE_PACKS_DIRECTORY;
};

export const packFolderName = (title: string, uuid: string) => {
	const slug = title.replace(UNSAFE_CHARACTERS, "-").slice(0, TITLE_LIMIT).replace(EDGE_CHARACTERS, "");

	return `${slug.length === 0 ? "pack" : slug}-${uuid.slice(0, 8)}`;
};

const worldTemplateRejected = new BridgeUserError({
	ar: "هذا ملف ماب مو أدون. ارفعه من تبويب المابات.",
	en: "this is a world, not an add-on — upload it from the Worlds tab",
});

const noManifest = new BridgeUserError({
	ar: "ما لقينا ملف manifest.json داخل الملف. تأكد إنك ترفع أدون أصلي بصيغة .mcaddon أو .mcpack",
	en: "the archive holds no manifest.json — make sure you are uploading a real .mcaddon or .mcpack",
});

export const packs: Bridge.Collection = {
	kind: BridgeKind.Collection,

	async list(context) {
		const sidecar = await readPackSidecar(context);
		const world = await activeWorld(context);
		const active = new Map<PackKind, string[]>();

		for (const kind of [
			PackKind.Behavior,
			PackKind.Resource,
		]) {
			active.set(
				kind,
				(await readWorldPacks(context, world, kind)).map((entry) => entry.pack_id),
			);
		}

		return Object.values(sidecar.packs).map((pack) => {
			const listed = active.get(pack.kind) ?? [];

			return {
				id: pack.uuid,
				name: pack.title,
				kind: pack.kind === PackKind.Behavior ? "سلوك / Behavior" : "مظهر / Resource",
				version: pack.versionText,
				enabled: listed.includes(pack.uuid) ? "✓" : "",
				order: String(listed.indexOf(pack.uuid) + 1),
			};
		});
	},

	async add(context, input) {
		const relative = relativeUploadPath(input);

		if (relative === null || !isUnder(relative, PACK_STAGING)) {
			throw new BridgeUserError({
				ar: "ما قدرنا نقرأ الملف اللي رفعته. جرّب ترفعه مرة ثانية.",
				en: "we could not read the file you uploaded — try uploading it again",
			});
		}

		const unpacked = `${PACK_STAGING}/unpacked`;

		await unpackArchive(context, relative, unpacked);

		const found = await discoverPacks(context, unpacked);

		if (found.length === 0) {
			throw noManifest;
		}

		if (found.every((pack) => pack.manifest.kind === PackKind.WorldTemplate)) {
			throw worldTemplateRejected;
		}

		const sidecar = await readPackSidecar(context);
		const world = await activeWorld(context);
		const bundle = withoutExtension(nameOf(relative));
		const installed: PackRecord[] = [];

		for (const pack of found) {
			if (pack.manifest.kind !== PackKind.Behavior && pack.manifest.kind !== PackKind.Resource) {
				context.log.warn("skipped a pack we cannot install", {
					uuid: pack.manifest.uuid,
					kind: pack.manifest.kind,
				});

				continue;
			}

			const title = await resolvePackText(context, pack.directory, pack.manifest.nameKey, bundle);
			const previous = sidecar.packs[pack.manifest.uuid];
			const folder = `${packDirectory(pack.manifest.kind)}/${packFolderName(title, pack.manifest.uuid)}`;

			if (previous !== undefined && (await context.files.exists(previous.folder))) {
				await context.files.remove(previous.folder);
			}

			await context.files.remove(folder);
			await context.files.move(pack.directory, folder);

			const record: PackRecord = {
				uuid: pack.manifest.uuid,
				kind: pack.manifest.kind,
				folder,
				title,
				version: pack.manifest.version.parts,
				versionText: pack.manifest.version.text,
				bundle,
				order: previous?.order ?? 0,
				dependencies: pack.manifest.dependencies,
				installedAt: new Date().toISOString(),
			};

			sidecar.packs[record.uuid] = record;
			installed.push(record);
		}

		sidecar.world = world;

		await writePackSidecar(context, sidecar);

		for (const record of installed) {
			const entries = await readWorldPacks(context, world, record.kind);

			await writeWorldPacks(
				context,
				world,
				record.kind,
				withPackActivated(entries, {
					pack_id: record.uuid,
					version: record.version,
				}),
			);

			context.emit(BridgeEventName.ModLoaded, {
				mod: record.title,
				version: record.versionText,
			});
		}

		await context.files.remove(PACK_STAGING);

		context.log("installed an add-on", {
			packs: installed.length,
			bundle,
		});
	},

	actions: {
		async enable(context, row) {
			const sidecar = await readPackSidecar(context);
			const pack = sidecar.packs[String(row.id)];

			if (pack === undefined) {
				return;
			}

			const world = await activeWorld(context);
			const entries = await readWorldPacks(context, world, pack.kind);

			await writeWorldPacks(
				context,
				world,
				pack.kind,
				withPackActivated(
					entries,
					{
						pack_id: pack.uuid,
						version: pack.version,
					},
					pack.order,
				),
			);
		},

		async disable(context, row) {
			const sidecar = await readPackSidecar(context);
			const pack = sidecar.packs[String(row.id)];

			if (pack === undefined) {
				return;
			}

			const world = await activeWorld(context);
			const entries = await readWorldPacks(context, world, pack.kind);

			sidecar.packs[pack.uuid] = {
				...pack,
				order: Math.max(
					0,
					entries.findIndex((entry) => entry.pack_id === pack.uuid),
				),
			};

			await writePackSidecar(context, sidecar);
			await writeWorldPacks(context, world, pack.kind, withPackDeactivated(entries, pack.uuid));
		},

		async moveUp(context, row) {
			await reorder(context, String(row.id), -1);
		},

		async moveDown(context, row) {
			await reorder(context, String(row.id), 1);
		},

		async remove(context, row) {
			const sidecar = await readPackSidecar(context);
			const pack = sidecar.packs[String(row.id)];

			if (pack === undefined) {
				return;
			}

			const world = await activeWorld(context);
			const entries = await readWorldPacks(context, world, pack.kind);

			await writeWorldPacks(context, world, pack.kind, withPackDeactivated(entries, pack.uuid));
			await context.files.remove(pack.folder);

			delete sidecar.packs[pack.uuid];

			await writePackSidecar(context, sidecar);

			context.log("removed an add-on", {
				title: pack.title,
			});
		},
	},
};

const reorder = async (context: Bridge.Context, uuid: string, delta: -1 | 1) => {
	const sidecar = await readPackSidecar(context);
	const pack = sidecar.packs[uuid];

	if (pack === undefined) {
		return;
	}

	const world = await activeWorld(context);
	const entries = await readWorldPacks(context, world, pack.kind);

	await writeWorldPacks(context, world, pack.kind, movePackEntry(entries, uuid, delta));
};
