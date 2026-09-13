import { type Bridge, BridgeDetailFormat, BridgeDetailTone, BridgeKind } from "@serverkgg/bridge";
import { CHANNEL_LABELS, channelOf, pinnedVersionOf, ReleaseChannel, readInstallStamp } from "../install";
import { booleanOf, PROPERTY_KEYS, readProperties } from "../shared";
import { activeWorld, worldSize } from "../worlds";

const REFRESH_SECONDS = 15;

interface BedrockHealth {
	online: number | null;
	max: number | null;
	version: string | null;
	protocol: number | null;
	gamemode: string | null;
	motd: string | null;
	latencyMs: number | null;
	world: string;
	worldBytes: number;
	allowList: boolean;
	channel: ReleaseChannel;
	build: string | null;
	selected: string;
	installedChannel: ReleaseChannel | null;
	reachable: boolean;
	contentErrors: string;
}

const sample = async (context: Bridge.Context): Promise<BedrockHealth> => {
	let pong: Awaited<ReturnType<Bridge.Context["probe"]["raknetPing"]>> | null = null;
	if (context.server.running) {
		try {
			pong = await context.probe.raknetPing(context.port("game"));
		} catch {
			pong = null;
		}
	}
	const properties = await readProperties(context);
	const world = await activeWorld(context);
	const stamp = await readInstallStamp(context);
	const lines = await context.logs.tail(100);
	const errors = lines.filter((line) =>
		/\[(?:Scripting|ContentLog)\].*(?:error|warning)|\b(?:Missing dependency|Failed to load pack)\b/i.test(line),
	);
	return {
		online: pong?.players.online ?? null,
		max: pong?.players.max ?? null,
		version: pong?.version ?? null,
		protocol: pong?.protocol ?? null,
		gamemode: pong?.gamemode ?? null,
		motd: pong?.motd ?? null,
		latencyMs: pong?.latencyMs ?? null,
		world,
		worldBytes: await worldSize(context, world),
		allowList: booleanOf(properties[PROPERTY_KEYS.allowList]),
		channel: channelOf(context),
		build: stamp?.label ?? null,
		installedChannel: stamp?.channel ?? null,
		selected: pinnedVersionOf(context) ?? "Keep installed",
		reachable: pong !== null,
		contentErrors: errors.slice(-3).join("\n") || "—",
	};
};

const badges = (health: BedrockHealth): Bridge.DetailBadge[] => {
	return [
		{
			label: health.reachable
				? {
						ar: "السيرفر يرد على اتصال بيدروك",
						en: "Bedrock connection responds",
					}
				: {
						ar: "ما وصلنا رد من بيدروك",
						en: "No Bedrock connection response",
					},
			tone: health.reachable ? BridgeDetailTone.Success : BridgeDetailTone.Warning,
		},
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
			value: health.online === null ? "—" : `${health.online}/${health.max}`,
			format: BridgeDetailFormat.Text,
		},
		{
			key: "version",
			label: {
				ar: "النسخة اللي ترد على الاتصال",
				en: "Responding game version",
			},
			value: health.version ?? "—",
			format: BridgeDetailFormat.Text,
		},
		{
			key: "selected",
			label: {
				ar: "النسخة المختارة",
				en: "Selected version",
			},
			value: `${CHANNEL_LABELS[health.channel]} · ${health.selected}`,
			format: BridgeDetailFormat.Text,
		},
		{
			key: "installed",
			label: {
				ar: "النسخة المركّبة",
				en: "Installed version",
			},
			value: `${health.installedChannel === null ? "—" : CHANNEL_LABELS[health.installedChannel]} · ${health.build ?? "—"}`,
			format: BridgeDetailFormat.Text,
		},
		{
			key: "contentErrors",
			label: {
				ar: "أخطاء الأدونات الأخيرة في الكونسول",
				en: "Recent content errors in console",
			},
			value: health.contentErrors,
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
	requiresRunning: false,
	refreshSeconds: REFRESH_SECONDS,

	async read(context) {
		const current = await sample(context);

		return {
			id: "status",
			title: {
				ar: "حالة السيرفر",
				en: "Server status",
			},
			subtitle: {
				ar: "حالة الاتصال والنسخة المختارة والمركّبة. الأرقام الفارغة ما وصلنا لها رد.",
				en: "Connection status and selected versus installed builds. Blank live values mean no response.",
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
			stale: context.server.running && !current.reachable,
			actions: [],
		};
	},
};
