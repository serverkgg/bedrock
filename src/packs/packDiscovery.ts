import type { Bridge } from "@serverkgg/bridge";
import { readInstallStamp } from "../install";
import { BEHAVIOR_PACKS_DIRECTORY, RESOURCE_PACKS_DIRECTORY, worldPath } from "../shared";
import { activeWorld } from "../worlds";
import { safePackFolder } from "./packCompatibility";
import { resolvePackText } from "./packLang";
import { PackKind, parsePackManifest } from "./packManifest";
import { type PackSidecar, readPackSidecar } from "./packSidecar";

const PACK_MANIFEST_GLOB = "**/manifest.json";

const PACK_DIRECTORIES = [
	BEHAVIOR_PACKS_DIRECTORY,
	RESOURCE_PACKS_DIRECTORY,
];

const listableWorld = (folder: string) => folder !== "." && folder !== ".." && !/[\\/]/.test(folder);

export const listPackManifests = async (context: Bridge.Context, directories: string[]) => {
	const listed = await Promise.all(
		directories.map((directory) =>
			context.files.list(PACK_MANIFEST_GLOB, {
				directory,
			}),
		),
	);
	return listed.flat();
};

export const inventoryPacks = async (context: Bridge.Context): Promise<PackSidecar> => {
	const sidecar = await readPackSidecar(context);
	const active = await activeWorld(context);
	for (const [uuid, pack] of Object.entries(sidecar.packs)) {
		if (pack.folder.startsWith("worlds/") && !pack.folder.startsWith(`worlds/${active}/`)) {
			delete sidecar.packs[uuid];
		}
	}
	const vanilla = new Set((await readInstallStamp(context))?.packs ?? []);
	const entries = await listPackManifests(context, [
		...PACK_DIRECTORIES,
		...(listableWorld(active) ? PACK_DIRECTORIES.map((directory) => `${worldPath(active)}/${directory}`) : []),
	]);
	for (const entry of entries) {
		const folder = entry.path.slice(0, -"/manifest.json".length);
		if (
			!safePackFolder(folder)
			|| vanilla.has(folder)
			|| /^(?:behavior_packs|resource_packs)\/(?:vanilla|chemistry|education)/.test(folder)
		) {
			continue;
		}
		const manifest = parsePackManifest(await context.files.read(entry.path));
		if (manifest === null || (manifest.kind !== PackKind.Behavior && manifest.kind !== PackKind.Resource)) {
			continue;
		}
		const previous = sidecar.packs[manifest.uuid];
		if (previous !== undefined && previous.folder !== folder && !folder.startsWith("worlds/")) {
			continue;
		}
		sidecar.packs[manifest.uuid] = {
			uuid: manifest.uuid,
			kind: manifest.kind,
			folder,
			title: await resolvePackText(context, folder, manifest.nameKey, manifest.uuid),
			version: manifest.version.parts,
			versionText: manifest.version.text,
			dependencies: manifest.dependencies,
			bundle: previous?.bundle ?? null,
			order: previous?.order ?? 0,
			provider: previous?.provider ?? null,
			project: previous?.project ?? null,
			file: previous?.file ?? null,
			icon: previous?.icon ?? null,
			pageUrl: previous?.pageUrl ?? null,
			installedAt: previous?.installedAt ?? "",
		};
	}
	return sidecar;
};
