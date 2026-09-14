import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { isUnder, nameOf, PACK_STAGING, relativeUploadPath, requireStopped, withoutExtension } from "../shared";
import { activeWorld, betaApisEnabled, readLevelExperiments } from "../worlds";
import { manifestFor, packWorlds } from "./packCompatibility";
import { inventoryPacks } from "./packDiscovery";
import { packLoadState } from "./packHealth";
import { installPackSource } from "./packInstall";
import { PackKind } from "./packManifest";
import { removePacks, setPacksEnabled } from "./packMutation";
import { movePackEntry, readWorldPacks, writeWorldPacks } from "./packRegistry";

export const packs: Bridge.Collection = {
	kind: BridgeKind.Collection,
	protectedActions: [
		"remove",
	],

	async list(context) {
		const sidecar = await inventoryPacks(context);
		const world = await activeWorld(context);
		const betaApis = betaApisEnabled(await readLevelExperiments(context, world));
		const active = new Map<PackKind, string[]>();

		for (const kind of [
			PackKind.Behavior,
			PackKind.Resource,
		]) {
			active.set(
				kind,
				(await readWorldPacks(context, world, kind)).map((entry) => entry.pack_id),
			);
		}

		return await Promise.all(
			Object.values(sidecar.packs).map(async (pack) => {
				const listed = active.get(pack.kind) ?? [];
				const manifest = await manifestFor(context, pack);

				return {
					id: pack.uuid,
					name: pack.title,
					kind:
						pack.kind === PackKind.Behavior
							? {
									ar: "سلوك",
									en: "Behavior",
								}
							: {
									ar: "مظهر",
									en: "Resource",
								},
					version: pack.versionText,
					enabled: listed.includes(pack.uuid) ? "✓" : "",
					order: String(listed.indexOf(pack.uuid) + 1),
					worlds: (await packWorlds(context, pack)).join(", "),
					requirements:
						manifest?.requirements
							.map((entry) => `${entry.uuid ?? entry.module} ${entry.version?.text ?? ""}`)
							.join(", ") ?? "—",
					load: packLoadState(manifest, betaApis),
				};
			}),
		);
	},

	async add(context, input) {
		const relative = relativeUploadPath(input);

		if (relative === null || !isUnder(relative, PACK_STAGING)) {
			throw new BridgeUserError({
				ar: "ما قدرنا نقرأ الملف اللي رفعته. جرّب ترفعه مرة ثانية.",
				en: "we could not read the file you uploaded — try uploading it again",
			});
		}

		await installPackSource(context, {
			archive: relative,
			bundle: withoutExtension(nameOf(relative)),
		});
	},

	actions: {
		async enable(context, row) {
			await setPacksEnabled(
				context,
				[
					String(row.id),
				],
				true,
			);
		},
		async disable(context, row) {
			await setPacksEnabled(
				context,
				[
					String(row.id),
				],
				false,
			);
		},

		async moveUp(context, row) {
			await reorder(context, String(row.id), -1);
		},

		async moveDown(context, row) {
			await reorder(context, String(row.id), 1);
		},

		async remove(context, row) {
			await removePacks(context, [
				String(row.id),
			]);
		},
	},
};

const reorder = async (context: Bridge.Context, uuid: string, delta: -1 | 1) => {
	requireStopped(context);
	const sidecar = await inventoryPacks(context);
	const pack = sidecar.packs[uuid];

	if (pack === undefined) {
		return;
	}

	const world = await activeWorld(context);
	const entries = await readWorldPacks(context, world, pack.kind);

	await writeWorldPacks(context, world, pack.kind, movePackEntry(entries, uuid, delta));
};
