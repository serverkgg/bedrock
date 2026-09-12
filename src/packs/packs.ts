import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { isUnder, nameOf, PACK_STAGING, relativeUploadPath, withoutExtension } from "../shared";
import { activeWorld } from "../worlds";
import { installPackSource } from "./packInstall";
import { PackKind } from "./packManifest";
import { movePackEntry, readWorldPacks, withPackActivated, withPackDeactivated, writeWorldPacks } from "./packRegistry";
import { readPackSidecar, writePackSidecar } from "./packSidecar";

export const packs: Bridge.Collection = {
	kind: BridgeKind.Collection,

	async list(context) {
		const sidecar = await readPackSidecar(context);
		const world = await activeWorld(context);
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

		return Object.values(sidecar.packs).map((pack) => {
			const listed = active.get(pack.kind) ?? [];

			return {
				id: pack.uuid,
				name: pack.title,
				kind: pack.kind === PackKind.Behavior ? "سلوك / Behavior" : "مظهر / Resource",
				version: pack.versionText,
				enabled: listed.includes(pack.uuid) ? "✓" : "",
				order: String(listed.indexOf(pack.uuid) + 1),
			};
		});
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
			const sidecar = await readPackSidecar(context);
			const pack = sidecar.packs[String(row.id)];

			if (pack === undefined) {
				return;
			}

			const world = await activeWorld(context);
			const entries = await readWorldPacks(context, world, pack.kind);

			await writeWorldPacks(
				context,
				world,
				pack.kind,
				withPackActivated(
					entries,
					{
						pack_id: pack.uuid,
						version: pack.version,
					},
					pack.order,
				),
			);
		},

		async disable(context, row) {
			const sidecar = await readPackSidecar(context);
			const pack = sidecar.packs[String(row.id)];

			if (pack === undefined) {
				return;
			}

			const world = await activeWorld(context);
			const entries = await readWorldPacks(context, world, pack.kind);

			sidecar.packs[pack.uuid] = {
				...pack,
				order: Math.max(
					0,
					entries.findIndex((entry) => entry.pack_id === pack.uuid),
				),
			};

			await writePackSidecar(context, sidecar);
			await writeWorldPacks(context, world, pack.kind, withPackDeactivated(entries, pack.uuid));
		},

		async moveUp(context, row) {
			await reorder(context, String(row.id), -1);
		},

		async moveDown(context, row) {
			await reorder(context, String(row.id), 1);
		},

		async remove(context, row) {
			const sidecar = await readPackSidecar(context);
			const pack = sidecar.packs[String(row.id)];

			if (pack === undefined) {
				return;
			}

			const world = await activeWorld(context);
			const entries = await readWorldPacks(context, world, pack.kind);

			await writeWorldPacks(context, world, pack.kind, withPackDeactivated(entries, pack.uuid));
			await context.files.remove(pack.folder);

			delete sidecar.packs[pack.uuid];

			await writePackSidecar(context, sidecar);

			context.log("removed an add-on", {
				title: pack.title,
			});
		},
	},
};

const reorder = async (context: Bridge.Context, uuid: string, delta: -1 | 1) => {
	const sidecar = await readPackSidecar(context);
	const pack = sidecar.packs[uuid];

	if (pack === undefined) {
		return;
	}

	const world = await activeWorld(context);
	const entries = await readWorldPacks(context, world, pack.kind);

	await writeWorldPacks(context, world, pack.kind, movePackEntry(entries, uuid, delta));
};
