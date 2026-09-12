import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { BEHAVIOR_PACKS_DIRECTORY, PACK_STAGING, RESOURCE_PACKS_DIRECTORY } from "../shared";
import { activeWorld } from "../worlds";
import { discoverPacks, unpackArchive } from "./packArchive";
import { resolvePackText } from "./packLang";
import { PackKind } from "./packManifest";
import { readWorldPacks, withPackActivated, writeWorldPacks } from "./packRegistry";
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

export const worldTemplateRejected = new BridgeUserError({
	ar: "هذا ملف ماب مو أدون. ارفعه من تبويب المابات.",
	en: "this is a world, not an add-on — upload it from the Worlds tab",
});

export const noManifest = new BridgeUserError({
	ar: "ما لقينا ملف manifest.json داخل الملف. تأكد إنك ترفع أدون أصلي بصيغة .mcaddon أو .mcpack",
	en: "the archive holds no manifest.json — make sure you are uploading a real .mcaddon or .mcpack",
});

export interface PackSource {
	archive: string;
	bundle: string;
	provider?: string | null;
	project?: string | null;
	file?: string | null;
	icon?: string | null;
	pageUrl?: string | null;
}

export const installPackSource = async (context: Bridge.Context, source: PackSource): Promise<PackRecord[]> => {
	const unpacked = `${PACK_STAGING}/unpacked`;

	await unpackArchive(context, source.archive, unpacked);

	const found = await discoverPacks(context, unpacked);

	if (found.length === 0) {
		throw noManifest;
	}

	if (found.every((pack) => pack.manifest.kind === PackKind.WorldTemplate)) {
		throw worldTemplateRejected;
	}

	const sidecar = await readPackSidecar(context);
	const world = await activeWorld(context);
	const installed: PackRecord[] = [];

	for (const pack of found) {
		if (pack.manifest.kind !== PackKind.Behavior && pack.manifest.kind !== PackKind.Resource) {
			context.log.warn("skipped a pack we cannot install", {
				uuid: pack.manifest.uuid,
				kind: pack.manifest.kind,
			});

			continue;
		}

		const title = await resolvePackText(context, pack.directory, pack.manifest.nameKey, source.bundle);
		const previous = sidecar.packs[pack.manifest.uuid];
		const folder = `${packDirectory(pack.manifest.kind)}/${packFolderName(title, pack.manifest.uuid)}`;

		if (previous !== undefined && previous.folder !== folder && (await context.files.exists(previous.folder))) {
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
			bundle: source.bundle,
			order: previous?.order ?? 0,
			dependencies: pack.manifest.dependencies,
			provider: source.provider ?? null,
			project: source.project ?? null,
			file: source.file ?? null,
			icon: source.icon ?? null,
			pageUrl: source.pageUrl ?? null,
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
		bundle: source.bundle,
		provider: source.provider ?? "upload",
	});

	return installed;
};
