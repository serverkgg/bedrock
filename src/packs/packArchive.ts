import { type Bridge, BridgeUserError } from "@serverkgg/bridge";
import { execDetail } from "@serverkgg/bridge/utils";
import { type PackManifest, parsePackManifest } from "./packManifest";

const UNZIP_TIMEOUT_MS = 600_000;

const FIND_TIMEOUT_MS = 60_000;

const MANIFEST_FILE = "manifest.json";

export interface DiscoveredPack {
	directory: string;
	manifest: PackManifest;
}

export const packDirectories = (output: string): string[] => {
	const directories = new Set<string>();
	const suffix = `/${MANIFEST_FILE}`;

	for (const line of output.split("\n")) {
		const trimmed = line.trim();

		if (trimmed.endsWith(suffix) && trimmed.length > suffix.length) {
			directories.add(trimmed.slice(0, -suffix.length));
		}
	}

	const listed = [
		...directories,
	].sort();

	return listed.filter((directory) => {
		return !listed.some((other) => other !== directory && directory.startsWith(`${other}/`));
	});
};

export const unpackArchive = async (context: Bridge.Context, archive: string, destination: string) => {
	await context.files.remove(destination);
	await context.files.ensure(destination);

	const result = await context.exec(
		[
			"unzip",
			"-o",
			"-q",
			archive,
			"-d",
			destination,
			"-x",
			"__MACOSX/*",
		],
		{
			timeoutMs: UNZIP_TIMEOUT_MS,
		},
	);

	if (result.code !== 0) {
		context.log.error("could not unpack an uploaded add-on", {
			reason: execDetail(result),
		});

		throw new BridgeUserError({
			ar: "ما قدرنا نفك الملف. تأكد إنه ملف أدون سليم وجرّب مرة ثانية.",
			en: "we could not unpack the file — check it is a valid add-on and try again",
		});
	}
};

const unpackNested = async (context: Bridge.Context, root: string) => {
	const found = await context.exec(
		[
			"find",
			root,
			"-maxdepth",
			"3",
			"-name",
			"*.mcpack",
		],
		{
			timeoutMs: FIND_TIMEOUT_MS,
		},
	);

	for (const line of found.stdout.split("\n")) {
		const nested = line.trim();

		if (nested.length === 0) {
			continue;
		}

		const directory = nested.slice(0, nested.lastIndexOf("."));

		await unpackArchive(context, nested, directory);
		await context.files.remove(nested);
	}
};

export const discoverPacks = async (context: Bridge.Context, root: string): Promise<DiscoveredPack[]> => {
	await unpackNested(context, root);

	const found = await context.exec(
		[
			"find",
			root,
			"-maxdepth",
			"4",
			"-name",
			MANIFEST_FILE,
		],
		{
			timeoutMs: FIND_TIMEOUT_MS,
		},
	);

	const packs: DiscoveredPack[] = [];

	for (const directory of packDirectories(found.stdout)) {
		const manifest = parsePackManifest(await context.files.read(`${directory}/${MANIFEST_FILE}`));

		if (manifest !== null) {
			packs.push({
				directory,
				manifest,
			});
		}
	}

	return packs;
};
