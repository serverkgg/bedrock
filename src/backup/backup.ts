import { type Bridge, BridgeKind, BridgeUserError } from "@serverkgg/bridge";
import { holdSave, resumeSave } from "./bedrockSave";

export const backup: Bridge.Backup = {
	kind: BridgeKind.Backup,
	settleSeconds: 0,

	async quiesce(context) {
		try {
			await holdSave(context);
		} catch (error) {
			await resumeSave(context);

			context.log.error("could not freeze the world for a backup", {
				reason: error instanceof Error ? error.message : String(error),
			});

			throw new BridgeUserError({
				ar: "السيرفر ما ردّ علينا وهو يحضّر الماب للنسخ. جرّب مرة ثانية، ولو تكرر أوقف السيرفر وخذ النسخة وهو مطفي.",
				en: "the server did not answer while it was preparing the world for copying. try again, and if it keeps happening stop the server and take the backup with it off.",
			});
		}

		context.log("froze the world, it is consistent on disk for the archiver");
	},

	async release(context) {
		await resumeSave(context);
	},
};
