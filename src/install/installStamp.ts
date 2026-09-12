import type { Bridge } from "@serverkgg/bridge";
import { readStamp, writeStamp } from "@serverkgg/bridge/install";
import { channelFrom, type ReleaseChannel } from "./channel";

export interface InstallStamp {
	channel: ReleaseChannel;
	version: string;
	label: string;
	files: string[];
	packs: string[];
}

interface RawStamp {
	channel?: unknown;
	version?: unknown;
	label?: unknown;
	files?: unknown;
	packs?: unknown;
}

const stringsOf = (value: unknown): string[] => {
	return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
};

export const normalizeStamp = (raw: RawStamp | null): InstallStamp | null => {
	if (raw === null || typeof raw.version !== "string" || raw.version.length === 0) {
		return null;
	}

	return {
		channel: channelFrom(typeof raw.channel === "string" ? raw.channel : null),
		version: raw.version,
		label: typeof raw.label === "string" && raw.label.length > 0 ? raw.label : raw.version,
		files: stringsOf(raw.files),
		packs: stringsOf(raw.packs),
	};
};

export const readInstallStamp = async (context: Bridge.Context) => {
	return normalizeStamp(await readStamp<RawStamp>(context));
};

export const writeInstallStamp = async (context: Bridge.Context, stamp: InstallStamp) => {
	await writeStamp(context, stamp);
};
