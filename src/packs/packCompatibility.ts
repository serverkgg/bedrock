import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { readInstallStamp } from "../install";
import { activeWorld, discoverWorlds } from "../worlds";
import { type PackManifest, type PackVersion, parsePackManifest } from "./packManifest";
import { readWorldPacks } from "./packRegistry";
import type { PackRecord } from "./packSidecar";

export const compareVersion = (a: number[], b: number[]) => {
	for (let index = 0; index < Math.max(a.length, b.length); index++) {
		const difference = (a[index] ?? 0) - (b[index] ?? 0);
		if (difference !== 0) {
			return Math.sign(difference);
		}
	}
	return 0;
};

export const packProblems = (
	manifest: PackManifest,
	installed: Map<string, PackVersion>,
	engine: string | null,
): string[] => {
	const problems: string[] = [];
	if (
		manifest.minEngineVersion !== null
		&& engine !== null
		&& compareVersion(engine.split(".").map(Number), manifest.minEngineVersion.parts) < 0
	) {
		problems.push(`Minecraft ${manifest.minEngineVersion.text}`);
	}
	for (const dependency of manifest.requirements) {
		if (dependency.uuid === null) {
			continue;
		}
		const version = installed.get(dependency.uuid);
		if (
			version === undefined
			|| (dependency.version !== null && compareVersion(version.parts, dependency.version.parts) !== 0)
		) {
			problems.push(`${dependency.uuid} ${dependency.version?.text ?? ""}`.trim());
		}
	}
	return problems;
};

export const safePackFolder = (folder: string) =>
	/^(?:(?:behavior_packs|resource_packs)\/[^/]+|worlds\/[^/]+\/(?:behavior_packs|resource_packs)\/[^/]+)$/.test(folder)
	&& !/[\\\r\n\0]/.test(folder)
	&& folder.split("/").every((part) => part !== ".." && part !== ".");

export const manifestFor = async (context: Bridge.Context, record: PackRecord) => {
	if (!safePackFolder(record.folder)) {
		throw new Error("invalid pack folder");
	}
	if (!(await context.files.exists(`${record.folder}/manifest.json`))) {
		return null;
	}
	return parsePackManifest(await context.files.read(`${record.folder}/manifest.json`));
};

export const assertCompatible = async (
	context: Bridge.Context,
	candidates: PackManifest[],
	packs: Record<string, PackRecord>,
) => {
	const versions = new Map<string, PackVersion>();
	for (const pack of Object.values(packs)) {
		const manifest = await manifestFor(context, pack);
		if (manifest !== null) {
			versions.set(manifest.uuid, manifest.version);
		}
	}
	for (const manifest of candidates) {
		versions.set(manifest.uuid, manifest.version);
	}
	const engine = (await readInstallStamp(context))?.version ?? null;
	const problems = candidates.flatMap((manifest) => packProblems(manifest, versions, engine));
	if (problems.length > 0) {
		throw new BridgeUserError({
			ar: `الأدون يحتاج ملفات أو نسخة مختلفة: ${problems.join(", ")}. ركّب المتطلبات أول.`,
			en: `This add-on needs different files or an engine version: ${problems.join(", ")}. Install the requirements first.`,
		});
	}
};

export const packWorlds = async (context: Bridge.Context, pack: PackRecord) => {
	const worlds = await discoverWorlds(context);
	const active = await activeWorld(context);
	if (!worlds.includes(active)) {
		worlds.push(active);
	}
	const used: string[] = [];
	for (const world of worlds) {
		if ((await readWorldPacks(context, world, pack.kind)).some((entry) => entry.pack_id === pack.uuid)) {
			used.push(world);
		}
	}
	return used;
};

export const assertRemovable = async (
	context: Bridge.Context,
	selected: PackRecord[],
	packs: Record<string, PackRecord>,
) => {
	const active = await activeWorld(context);
	const ids = new Set(selected.map((pack) => pack.uuid));
	for (const pack of selected) {
		if (!safePackFolder(pack.folder)) {
			throw new Error("invalid pack folder");
		}
		const otherWorlds = (await packWorlds(context, pack)).filter((world) => world !== active);
		const dependents = Object.values(packs).filter(
			(entry) => !ids.has(entry.uuid) && entry.dependencies.includes(pack.uuid),
		);
		if (otherWorlds.length > 0 || dependents.length > 0) {
			throw new BridgeUserError({
				ar: `الأدون مستخدم في مابات أو أدونات ثانية: ${[
					...otherWorlds,
					...dependents.map((entry) => entry.title),
				].join(", ")}. فك ارتباطه أول.`,
				en: `This pack is used by other worlds or add-ons: ${[
					...otherWorlds,
					...dependents.map((entry) => entry.title),
				].join(", ")}. Remove those references first.`,
			});
		}
	}
};

export const activationOrder = (ids: string[], packs: Record<string, PackRecord>): PackRecord[] => {
	const complete = new Set<string>();
	const visiting = new Set<string>();
	const ordered: PackRecord[] = [];
	const visit = (id: string) => {
		if (complete.has(id)) {
			return;
		}
		const pack = packs[id];
		if (pack === undefined || visiting.has(id)) {
			throw new BridgeUserError({
				ar: `الأدون يحتاج ملف مفقود أو متطلباته متداخلة: ${id}`,
				en: `Missing add-on dependency or dependency cycle: ${id}`,
			});
		}
		visiting.add(id);
		for (const dependency of pack.dependencies) {
			visit(dependency);
		}
		visiting.delete(id);
		complete.add(id);
		ordered.push(pack);
	};
	for (const id of ids) {
		visit(id);
	}
	return ordered;
};

export const assertCanDisable = async (
	context: Bridge.Context,
	pack: PackRecord,
	packs: Record<string, PackRecord>,
) => {
	const world = await activeWorld(context);
	for (const candidate of Object.values(packs)) {
		if (!candidate.dependencies.includes(pack.uuid)) {
			continue;
		}
		if ((await readWorldPacks(context, world, candidate.kind)).some((entry) => entry.pack_id === candidate.uuid)) {
			throw new BridgeUserError({
				ar: `عطّل "${candidate.title}" أول، لأنه يحتاج هذا الأدون.`,
				en: `Disable "${candidate.title}" first; it needs this pack.`,
			});
		}
	}
};
