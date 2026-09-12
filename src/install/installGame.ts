import type { Bridge } from "@serverkgg/bridge";
import { execDetail } from "@serverkgg/bridge/utils";
import {
	ALLOWLIST_FILE,
	BEHAVIOR_PACKS_DIRECTORY,
	CONFIG_FILE,
	DOWNLOAD_STAGING,
	PERMISSIONS_FILE,
	RESOURCE_PACKS_DIRECTORY,
	SERVER_BINARY,
	WORLDS_DIRECTORY,
} from "../shared";
import type { Release } from "./releases";

const DOWNLOAD_TIMEOUT_MS = 1_800_000;

const UNZIP_TIMEOUT_MS = 900_000;

const INVENTORY_TIMEOUT_MS = 120_000;

const SYMBOL_SUFFIXES = [
	".debug",
	".pdb",
	".sym",
];

export const PRESERVE_ON_UPDATE = [
	WORLDS_DIRECTORY,
	CONFIG_FILE,
	ALLOWLIST_FILE,
	PERMISSIONS_FILE,
	BEHAVIOR_PACKS_DIRECTORY,
	RESOURCE_PACKS_DIRECTORY,
	"development_behavior_packs",
	"development_resource_packs",
	"development_skin_packs",
	"world_templates",
];

const EXTRACT_EXCLUDES = [
	CONFIG_FILE,
	ALLOWLIST_FILE,
	PERMISSIONS_FILE,
	"whitelist.json",
];

export const topLevelOf = (entries: string[]) => {
	const names = new Set<string>();

	for (const entry of entries) {
		const name = entry.split("/").at(0) ?? "";

		if (name.length > 0) {
			names.add(name);
		}
	}

	return [
		...names,
	].sort();
};

export const vanillaPacksOf = (entries: string[]) => {
	const packs = new Set<string>();

	for (const entry of entries) {
		const parts = entry.split("/");
		const root = parts.at(0) ?? "";
		const folder = parts.at(1) ?? "";

		if ((root === BEHAVIOR_PACKS_DIRECTORY || root === RESOURCE_PACKS_DIRECTORY) && folder.length > 0) {
			packs.add(`${root}/${folder}`);
		}
	}

	return [
		...packs,
	].sort();
};

export const isSymbolFile = (name: string) => {
	return SYMBOL_SUFFIXES.some((suffix) => name.endsWith(suffix));
};

export interface UnpackedArchive {
	files: string[];
	packs: string[];
}

const inventory = async (context: Bridge.Context, archive: string) => {
	const listed = await context.exec(
		[
			"unzip",
			"-Z1",
			archive,
		],
		{
			timeoutMs: INVENTORY_TIMEOUT_MS,
		},
	);

	if (listed.code !== 0) {
		throw new Error(`the bedrock archive could not be read — ${execDetail(listed)}`);
	}

	return listed.stdout
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
};

const pruneSymbols = async (context: Bridge.Context, entries: string[]) => {
	let reclaimed = 0;

	for (const entry of entries) {
		if (!isSymbolFile(entry) || entry.includes("/")) {
			continue;
		}

		if (await context.files.exists(entry)) {
			reclaimed += await context.files.size(entry);
			await context.files.remove(entry);
		}
	}

	return reclaimed;
};

export const installGame = async (
	context: Bridge.Context,
	release: Release,
	stale: string[],
): Promise<UnpackedArchive> => {
	const archive = `${DOWNLOAD_STAGING}/bedrock-server-${release.version}.zip`;

	await context.files.remove(DOWNLOAD_STAGING);
	await context.files.ensure(DOWNLOAD_STAGING);

	context.log("downloading the bedrock dedicated server", {
		channel: release.channel,
		version: release.version,
	});

	await context.files.download(archive, release.url, {
		timeoutMs: DOWNLOAD_TIMEOUT_MS,
	});

	const entries = await inventory(context, archive);
	const files = topLevelOf(entries);
	const packs = vanillaPacksOf(entries);

	context.log("unpacking the bedrock dedicated server", {
		version: release.version,
		entries: entries.length,
		top: files.join(", "),
	});

	for (const name of stale) {
		if (!PRESERVE_ON_UPDATE.includes(name) && (await context.files.exists(name))) {
			await context.files.remove(name);
		}
	}

	const unpacked = await context.exec(
		[
			"unzip",
			"-o",
			"-q",
			archive,
			"-d",
			".",
			"-x",
			...EXTRACT_EXCLUDES,
		],
		{
			timeoutMs: UNZIP_TIMEOUT_MS,
		},
	);

	if (unpacked.code !== 0) {
		throw new Error(`the bedrock archive could not be unpacked — ${execDetail(unpacked)}`);
	}

	const reclaimed = await pruneSymbols(context, entries);

	if (reclaimed > 0) {
		context.log("dropped the debug symbols the archive ships", {
			bytes: reclaimed,
		});
	}

	const marked = await context.exec([
		"chmod",
		"+x",
		SERVER_BINARY,
	]);

	if (marked.code !== 0) {
		throw new Error(`the bedrock server binary could not be marked executable — ${execDetail(marked)}`);
	}

	await context.files.remove(DOWNLOAD_STAGING);

	if (!(await gameInstalled(context))) {
		throw new Error("the bedrock archive carried no server binary");
	}

	return {
		files,
		packs,
	};
};

export const gameInstalled = async (context: Bridge.Context) => {
	return await context.files.exists(SERVER_BINARY);
};
