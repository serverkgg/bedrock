import { type Bridge, BridgeKind } from "@serverkgg/bridge";
import { BridgeEventName } from "@serverkgg/bridge/protocol";
import { CHANNEL_LABELS, channelOf, pinnedVersionOf } from "./channel";
import { gameInstalled, installGame } from "./installGame";
import { type InstallStamp, readInstallStamp, writeInstallStamp } from "./installStamp";
import { type Release, resolveRelease } from "./releases";
import { seedConfig } from "./seedConfig";

const reasonOf = (error: unknown) => {
	return error instanceof Error ? error.message : String(error);
};

const prunePacks = async (context: Bridge.Context, previous: string[], current: string[]) => {
	for (const pack of previous) {
		if (current.includes(pack) || !(await context.files.exists(pack))) {
			continue;
		}

		await context.files.remove(pack);
		context.log("removed a vanilla pack this build no longer ships", {
			pack,
		});
	}
};

const install: Bridge.Install = {
	kind: BridgeKind.Install,
	async run(context) {
		const stamp = await readInstallStamp(context);
		const channel = channelOf(context);
		const pinned = pinnedVersionOf(context);
		const installed = await gameInstalled(context);

		if (stamp !== null && stamp.channel === channel && pinned === stamp.version && installed) {
			await seedConfig(context);

			return;
		}

		let release: Release;

		try {
			release = await resolveRelease(context, channel, pinned);
		} catch (error) {
			if (stamp !== null && stamp.channel === channel && installed) {
				context.log.warn("could not reach the download service, keeping the installed build", {
					reason: reasonOf(error),
					version: stamp.version,
				});

				await seedConfig(context);

				return;
			}

			throw error;
		}

		if (stamp !== null && stamp.version === release.version && stamp.channel === channel && installed) {
			await seedConfig(context);

			return;
		}

		const unpacked = await installGame(context, release, stamp?.files ?? []);

		await prunePacks(context, stamp?.packs ?? [], unpacked.packs);

		const next: InstallStamp = {
			channel: release.channel,
			version: release.version,
			label: release.label,
			files: unpacked.files,
			packs: unpacked.packs,
		};

		await writeInstallStamp(context, next);
		await seedConfig(context);

		if (stamp !== null && stamp.channel === release.channel && stamp.version !== release.version) {
			context.emit(BridgeEventName.ServerUpdated, {
				from: stamp.label,
				to: release.label,
			});
		}

		return;
	},
	async describe(context) {
		const stamp = await readInstallStamp(context);

		return {
			version: stamp?.label ?? null,
			variant: CHANNEL_LABELS[channelOf(context)],
			build: null,
		};
	},
};

export { install };
