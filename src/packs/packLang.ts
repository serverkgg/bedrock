import type { Bridge } from "@serverkgg/bridge";

const LANG_FILES = [
	"texts/en_US.lang",
	"texts/en_GB.lang",
];

export const parseLang = (text: string) => {
	const entries = new Map<string, string>();

	for (const line of text.split("\n")) {
		const trimmed = line.trim();

		if (trimmed.length === 0 || trimmed.startsWith("#")) {
			continue;
		}

		const split = trimmed.indexOf("=");

		if (split <= 0) {
			continue;
		}

		const key = trimmed.slice(0, split).trim();
		const value =
			trimmed
				.slice(split + 1)
				.split("##")
				.at(0)
				?.trim() ?? "";

		if (key.length > 0) {
			entries.set(key, value);
		}
	}

	return entries;
};

export const looksLocalized = (key: string) => {
	return key.includes(".") && !key.includes(" ") && key.length > 0;
};

export const resolvePackText = async (
	context: Bridge.Context,
	folder: string,
	key: string,
	fallback: string,
): Promise<string> => {
	if (key.length === 0) {
		return fallback;
	}

	if (!looksLocalized(key)) {
		return key;
	}

	for (const file of LANG_FILES) {
		const path = `${folder}/${file}`;

		if (!(await context.files.exists(path))) {
			continue;
		}

		const resolved = parseLang(await context.files.read(path)).get(key);

		if (resolved !== undefined && resolved.length > 0) {
			return resolved;
		}
	}

	return fallback;
};
