export enum PackKind {
	Behavior = "behavior",
	Resource = "resource",
	Skin = "skin",
	WorldTemplate = "world_template",
}

export interface PackVersion {
	parts: [
		number,
		number,
		number,
	];
	text: string;
}

export interface PackManifest {
	uuid: string;
	nameKey: string;
	descriptionKey: string;
	version: PackVersion;
	kind: PackKind;
	dependencies: string[];
}

const BEHAVIOR_MODULES = [
	"data",
	"script",
	"client_data",
];

const RESOURCE_MODULES = [
	"resources",
];

const numbersOf = (value: unknown): PackVersion["parts"] | null => {
	if (!Array.isArray(value)) {
		return null;
	}

	const major = value.at(0);
	const minor = value.at(1);
	const patch = value.at(2);

	if (typeof major !== "number" || typeof minor !== "number" || typeof patch !== "number") {
		return null;
	}

	if (!Number.isFinite(major) || !Number.isFinite(minor) || !Number.isFinite(patch)) {
		return null;
	}

	return [
		major,
		minor,
		patch,
	];
};

export const parsePackVersion = (value: unknown): PackVersion | null => {
	const parts = numbersOf(value);

	if (parts !== null) {
		return {
			parts,
			text: parts.join("."),
		};
	}

	if (typeof value !== "string" || value.trim().length === 0) {
		return null;
	}

	const text = value.trim();
	const numbers = text
		.split("-")
		.at(0)
		?.split(".")
		.map((entry) => Number.parseInt(entry, 10));

	if (numbers === undefined || numbers.some((entry) => !Number.isFinite(entry))) {
		return null;
	}

	return {
		parts: [
			numbers[0] ?? 0,
			numbers[1] ?? 0,
			numbers[2] ?? 0,
		],
		text,
	};
};

export const packKindOf = (moduleTypes: string[]): PackKind | null => {
	if (moduleTypes.includes(PackKind.WorldTemplate)) {
		return PackKind.WorldTemplate;
	}

	if (moduleTypes.some((type) => BEHAVIOR_MODULES.includes(type))) {
		return PackKind.Behavior;
	}

	if (moduleTypes.some((type) => RESOURCE_MODULES.includes(type))) {
		return PackKind.Resource;
	}

	if (moduleTypes.includes("skin_pack")) {
		return PackKind.Skin;
	}

	return null;
};

interface RawManifest {
	header?: {
		uuid?: unknown;
		name?: unknown;
		description?: unknown;
		version?: unknown;
	};
	modules?: {
		type?: unknown;
	}[];
	dependencies?: {
		uuid?: unknown;
	}[];
}

export const parsePackManifest = (text: string): PackManifest | null => {
	let raw: RawManifest;

	try {
		raw = JSON.parse(text) as RawManifest;
	} catch {
		return null;
	}

	const uuid = raw.header?.uuid;
	const version = parsePackVersion(raw.header?.version);

	if (typeof uuid !== "string" || uuid.length === 0 || version === null) {
		return null;
	}

	const moduleTypes = (Array.isArray(raw.modules) ? raw.modules : [])
		.map((entry) => entry?.type)
		.filter((type): type is string => typeof type === "string");

	const kind = packKindOf(moduleTypes);

	if (kind === null) {
		return null;
	}

	return {
		uuid,
		nameKey: typeof raw.header?.name === "string" ? raw.header.name : "",
		descriptionKey: typeof raw.header?.description === "string" ? raw.header.description : "",
		version,
		kind,
		dependencies: (Array.isArray(raw.dependencies) ? raw.dependencies : [])
			.map((entry) => entry?.uuid)
			.filter((uuid): uuid is string => typeof uuid === "string" && uuid.length > 0),
	};
};
