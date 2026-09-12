import type { Bridge } from "@serverkgg/bridge";

export const parseJsonList = (text: string): unknown[] => {
	try {
		const parsed: unknown = JSON.parse(text);

		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

export const readJsonList = async (context: Bridge.Context, path: string): Promise<unknown[]> => {
	if (!(await context.files.exists(path))) {
		return [];
	}

	const entries = parseJsonList(await context.files.read(path));

	if (entries.length === 0) {
		context.log.warn("read an empty or unreadable json list", {
			path,
		});
	}

	return entries;
};

export const writeJsonList = async (context: Bridge.Context, path: string, entries: unknown[]) => {
	await context.files.write(path, `${JSON.stringify(entries, null, 2)}\n`);
};
