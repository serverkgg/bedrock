export const SERVER_STARTED = /Server started\./;

export const SERVER_STOPPING = /Stopping server/i;

export const WORLD_SAVED = /Data saved\. Files are now ready to be copied\./;

export const SAVE_PENDING = /A previous save has not been completed\./;

export const SAVE_RESUMED = /Changes to the (?:level|world) are resumed\./;

export const SAVE_HOLD_ACK = /Saving\.\.\./;

export const SERVER_CRASHED = /terminate called after throwing|Segmentation fault|SIGSEGV|SIGABRT|std::bad_alloc/;

export const PLAYER_CONNECTED = /Player connected:\s*(?<player>.+?),\s*xuid:\s*(?<xuid>\d+)/;

export const PLAYER_SPAWNED = /Player Spawned:\s*(?<player>.+?)\s+xuid:\s*(?<xuid>\d+)/;

export const PLAYER_DISCONNECTED = /Player disconnected:\s*(?<player>.+?),\s*xuid:\s*(?<xuid>\d+)/;

export const LIST_HEADER = /There are (?<online>\d+)\/(?<max>\d+) players online:/;

const LOG_PREFIX = /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d{3}\s+\w+\]\s*/;

export const withoutLogPrefix = (line: string) => line.replace(LOG_PREFIX, "").trim();

export interface LoggedPlayer {
	player: string;
	xuid: string;
}

const playerOf = (line: string, pattern: RegExp): LoggedPlayer | null => {
	const groups = line.match(pattern)?.groups;

	if (groups?.player === undefined || groups.xuid === undefined) {
		return null;
	}

	const player = groups.player.trim();

	return player.length === 0
		? null
		: {
				player,
				xuid: groups.xuid,
			};
};

export const connectedPlayer = (line: string) => playerOf(line, PLAYER_CONNECTED);

export const spawnedPlayer = (line: string) => playerOf(line, PLAYER_SPAWNED);

export const disconnectedPlayer = (line: string) => playerOf(line, PLAYER_DISCONNECTED);

export const parseListNames = (text: string, expected: number): string[] => {
	const lines = text.split("\n");
	const names: string[] = [];

	for (let index = lines.length - 1; index >= 0; index -= 1) {
		const header = lines[index]?.match(LIST_HEADER);

		if (!header) {
			continue;
		}

		const tail = (lines[index] ?? "").slice((header.index ?? 0) + header[0].length);
		const rest = [
			tail,
			...lines.slice(index + 1),
		]
			.map((line) => withoutLogPrefix(line))
			.join(",");

		for (const name of rest.split(",")) {
			const trimmed = name.trim();

			if (trimmed.length > 0 && names.length < expected) {
				names.push(trimmed);
			}
		}

		return names;
	}

	return names;
};
