import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { execDetail } from "@serverkgg/bridge/utils";
import {
	formatByteSize,
	isUnder,
	nameOf,
	relativeUploadPath,
	WORLD_STAGING,
	withoutExtension,
	worldPath,
} from "../shared";
import {
	activeWorld,
	discoverWorlds,
	findLevelDirectories,
	isBedrockWorld,
	safeWorldFolder,
	setActiveWorld,
	worldDisplayName,
	worldSize,
} from "./world";

const UNZIP_TIMEOUT_MS = 600_000;

const notAWorld = new BridgeUserError({
	ar: "ما لقينا ملف level.dat جوّا الملف. تأكد إنك رافع ملف ماب بصيغة .mcworld طالع من اللعبة نفسها.",
	en: "the archive holds no level.dat — make sure you are uploading a .mcworld exported from the game itself",
});

const notABedrockWorld = new BridgeUserError({
	ar: "هذي ماب جافا مو بيدروك. ما نقدر نحوّلها — لازم ماب طالعة من ماينكرافت بيدروك.",
	en: "this is a Java world, not a Bedrock one — we cannot convert it, you need a world exported from Minecraft Bedrock",
});

const multipleWorlds = new BridgeUserError({
	ar: "الملف فيه أكثر من ماب، ارفع كل ماب لحالها.",
	en: "the archive holds more than one world, upload them one at a time",
});

const unpack = async (context: Bridge.Context, archive: string, destination: string) => {
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
		],
		{
			timeoutMs: UNZIP_TIMEOUT_MS,
		},
	);

	if (result.code !== 0) {
		context.log.error("could not unpack an uploaded world", {
			reason: execDetail(result),
		});

		throw new BridgeUserError({
			ar: "ما قدرنا نفك الملف. تأكد إنه ملف .mcworld سليم وجرّب مرة ثانية.",
			en: "we could not unpack the file — check it is a valid .mcworld and try again",
		});
	}
};

export const worlds: Bridge.Collection = {
	kind: BridgeKind.Collection,

	async list(context) {
		const active = await activeWorld(context);
		const folders = await discoverWorlds(context);
		const rows = [];

		for (const folder of folders) {
			rows.push({
				id: folder,
				name: await worldDisplayName(context, folder),
				folder,
				size: formatByteSize(await worldSize(context, folder)),
				active: folder === active ? "✓" : "",
			});
		}

		return rows;
	},

	async add(context, input) {
		const relative = relativeUploadPath(input);

		if (relative === null || !isUnder(relative, WORLD_STAGING)) {
			throw new BridgeUserError({
				ar: "ما قدرنا نقرأ الملف اللي رفعته. جرّب ترفعه مرة ثانية.",
				en: "we could not read the file you uploaded — try uploading it again",
			});
		}

		const unpacked = `${WORLD_STAGING}/unpacked`;

		await unpack(context, relative, unpacked);

		const found = await findLevelDirectories(context, unpacked);

		if (found.length === 0) {
			throw notAWorld;
		}

		if (found.length > 1) {
			throw multipleWorlds;
		}

		const directory = found.at(0) ?? unpacked;

		if (!(await isBedrockWorld(context, directory))) {
			throw notABedrockWorld;
		}

		const folder = safeWorldFolder(withoutExtension(nameOf(relative)));
		const destination = worldPath(folder.length === 0 ? "imported-world" : folder);

		if (await context.files.exists(destination)) {
			throw new BridgeUserError({
				ar: `عندك ماب بنفس الاسم "${folder}"، غيّر اسم الملف وارفعه.`,
				en: `a world named "${folder}" is already here — rename the file and upload it again`,
			});
		}

		await context.files.move(directory, destination);
		await context.files.remove(WORLD_STAGING);

		context.log("imported a world", {
			folder,
		});
	},

	actions: {
		async activate(context, row) {
			const folder = String(row.folder);

			if (folder === (await activeWorld(context))) {
				throw new BridgeUserError({
					ar: "هذي الماب مفعّلة أصلًا.",
					en: "this world is already the active one",
				});
			}

			await setActiveWorld(context, folder);

			context.log("changed the active world", {
				folder,
			});
		},

		async delete(context, row) {
			const folder = String(row.folder);

			if (folder === (await activeWorld(context))) {
				throw new BridgeUserError({
					ar: "ما تقدر تحذف الماب المفعّلة. فعّل ماب ثانية الأول.",
					en: "you cannot delete the active world — activate another one first",
				});
			}

			await context.files.remove(worldPath(folder));

			context.log("deleted a world", {
				folder,
			});
		},
	},
};
