import type { Bridge } from "@serverkgg/bridge";
import { PACK_SIDECAR_FILE } from "../shared";
import { PackKind } from "./packManifest";

export interface PackRecord {
	uuid: string;
	kind: PackKind;
	folder: string;
	title: string;
	version: [
		number,
		number,
		number,
	];
	versionText: string;
	bundle: string | null;
	order: number;
	dependencies: string[];
	provider: string | null;
	project: string | null;
	file: string | null;
	icon: string | null;
	pageUrl: string | null;
	installedAt: string;
}

export interface PackSidecar {
	world: string;
	packs: Record<string, PackRecord>;
}

const KINDS = new Set<string>(Object.values(PackKind));

const emptySidecar = (): PackSidecar => ({
	world: "",
	packs: {},
});

export const parsePackSidecar = (text: string): PackSidecar => {
	try {
		const raw: unknown = JSON.parse(text);

		if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
			return emptySidecar();
		}

		const source = raw as {
			world?: unknown;
			packs?: unknown;
		};
		const packs: Record<string, PackRecord> = {};
		const entries = source.packs;

		if (entries !== null && typeof entries === "object" && !Array.isArray(entries)) {
			for (const [uuid, value] of Object.entries(entries as Record<string, unknown>)) {
				const record = value as Partial<PackRecord>;

				if (typeof record?.folder !== "string" || typeof record.kind !== "string" || !KINDS.has(record.kind)) {
					continue;
				}

				packs[uuid] = {
					uuid,
					kind: record.kind as PackKind,
					folder: record.folder,
					title: typeof record.title === "string" ? record.title : uuid,
					version: Array.isArray(record.version)
						? record.version
						: [
								0,
								0,
								0,
							],
					versionText: typeof record.versionText === "string" ? record.versionText : "0.0.0",
					bundle: typeof record.bundle === "string" ? record.bundle : null,
					order: typeof record.order === "number" ? record.order : 0,
					dependencies: Array.isArray(record.dependencies)
						? record.dependencies.filter((entry): entry is string => typeof entry === "string")
						: [],
					provider: typeof record.provider === "string" ? record.provider : null,
					project: typeof record.project === "string" ? record.project : null,
					file: typeof record.file === "string" ? record.file : null,
					icon: typeof record.icon === "string" ? record.icon : null,
					pageUrl: typeof record.pageUrl === "string" ? record.pageUrl : null,
					installedAt: typeof record.installedAt === "string" ? record.installedAt : "",
				};
			}
		}

		return {
			world: typeof source.world === "string" ? source.world : "",
			packs,
		};
	} catch {
		return emptySidecar();
	}
};

export const readPackSidecar = async (context: Bridge.Context): Promise<PackSidecar> => {
	if (!(await context.files.exists(PACK_SIDECAR_FILE))) {
		return emptySidecar();
	}

	return parsePackSidecar(await context.files.read(PACK_SIDECAR_FILE));
};

export const writePackSidecar = async (context: Bridge.Context, sidecar: PackSidecar) => {
	await context.files.write(PACK_SIDECAR_FILE, `${JSON.stringify(sidecar, null, 2)}\n`);
};
