import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import { CHANNEL_LABELS, channelOf, ReleaseChannel, readInstallStamp } from "../install";
import { booleanOf, PROPERTY_KEYS, readProperties } from "../shared";
import { activeWorld, worldSize } from "../worlds";

const REFRESH_SECONDS = 15;

interface BedrockHealth {
	online: number;
	max: number;
	version: string | null;
	protocol: number | null;
	gamemode: string | null;
	motd: string | null;
	latencyMs: number;
	world: string;
	worldBytes: number;
	allowList: boolean;
	channel: ReleaseChannel;
	build: string | null;
}

let stored: BedrockHealth | null = null;

const sample = async (context: Bridge.Context): Promise<BedrockHealth | null> => {
	try {
		const pong = await context.probe.raknetPing(context.port("game"));
		const properties = await readProperties(context);
		const world = await activeWorld(context);
		const stamp = await readInstallStamp(context);

		return {
			online: pong.players.online,
			max: pong.players.max,
			version: pong.version,
			protocol: pong.protocol,
			gamemode: pong.gamemode,
			motd: pong.motd,
			latencyMs: pong.latencyMs,
			world,
			worldBytes: await worldSize(context, world),
			allowList: booleanOf(properties[PROPERTY_KEYS.allowList]),
			channel: channelOf(context),
			build: stamp?.label ?? null,
		};
	} catch {
		return null;
	}
};

const badges = (health: BedrockHealth): Bridge.DetailBadge[] => {
	return [
		{
			label: {
				ar: CHANNEL_LABELS[health.channel],
				en: CHANNEL_LABELS[health.channel],
			},
			tone: health.channel === ReleaseChannel.Preview ? BridgeDetailTone.Warning : BridgeDetailTone.Neutral,
		},
		{
			label: health.allowList
				? {
						ar: "القائمة البيضاء مفعّلة",
						en: "Allowlist on",
					}
				: {
						ar: "القائمة البيضاء مقفلة",
						en: "Allowlist off",
					},
			tone: health.allowList ? BridgeDetailTone.Success : BridgeDetailTone.Neutral,
		},
		...(health.gamemode === null
			? []
			: [
					{
						label: {
							ar: health.gamemode,
							en: health.gamemode,
						},
						tone: BridgeDetailTone.Neutral,
					},
				]),
	];
};

const stats = (context: Bridge.Context, health: BedrockHealth): Bridge.DetailStat[] => {
	return [
		{
			key: "players",
			label: {
				ar: "اللاعبين",
				en: "Players",
			},
			value: `${health.online}/${health.max}`,
			format: BridgeDetailFormat.Text,
		},
		{
			key: "version",
			label: {
				ar: "نسخة اللعبة",
				en: "Game version",
			},
			value: health.version ?? health.build ?? "—",
			format: BridgeDetailFormat.Text,
		},
		{
			key: "protocol",
			label: {
				ar: "بروتوكول",
				en: "Protocol",
			},
			value: health.protocol,
			format: BridgeDetailFormat.Number,
		},
		{
			key: "latency",
			label: {
				ar: "زمن الرد",
				en: "Response time",
			},
			value: health.latencyMs,
			format: BridgeDetailFormat.Number,
		},
		{
			key: "memory",
			label: {
				ar: "الرام",
				en: "Memory",
			},
			value: context.server.memoryMb * 1_048_576,
			format: BridgeDetailFormat.Bytes,
		},
		{
			key: "cpu",
			label: {
				ar: "المعالج",
				en: "CPU",
			},
			value: context.server.cpuPercent,
			format: BridgeDetailFormat.Number,
		},
		{
			key: "world",
			label: {
				ar: "الماب",
				en: "World",
			},
			value: health.world,
			format: BridgeDetailFormat.Text,
		},
		{
			key: "worldSize",
			label: {
				ar: "حجم الماب",
				en: "World size",
			},
			value: health.worldBytes,
			format: BridgeDetailFormat.Bytes,
		},
	];
};

export const status: Bridge.Detail = {
	kind: BridgeKind.Detail,
	requiresRunning: true,
	refreshSeconds: REFRESH_SECONDS,

	async read(context) {
		const live = await sample(context);
		const current = live ?? stored;

		if (current === null) {
			return null;
		}

		stored = current;

		return {
			id: "status",
			title: {
				ar: "حالة السيرفر",
				en: "Server status",
			},
			subtitle: {
				ar: "هذي أرقام سيرفرك نفسه، مو تقدير.",
				en: "these numbers come from your own server, not an estimate",
			},
			description:
				current.motd === null
					? null
					: {
							ar: current.motd,
							en: current.motd,
						},
			image: null,
			badges: badges(current),
			stats: stats(context, current),
			links: [],
			stale: live === null,
			actions: [],
		};
	},
};
