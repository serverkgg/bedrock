import { describe, expect, test } from "bun:test";
import { ReleaseChannel } from "./channel";
import { normalizeStamp } from "./installStamp";

describe("reading the install stamp back", () => {
	test("keeps what a previous install recorded", () => {
		const stamp = normalizeStamp({
			channel: "preview",
			version: "1.26.60.23",
			label: "1.26.60.23",
			files: [
				"bedrock_server",
				"behavior_packs",
			],
			packs: [
				"vanilla",
			],
		});

		expect(stamp).toEqual({
			channel: ReleaseChannel.Preview,
			version: "1.26.60.23",
			label: "1.26.60.23",
			files: [
				"bedrock_server",
				"behavior_packs",
			],
			packs: [
				"vanilla",
			],
		});
	});

	test("answers null for a stamp with no version, so a garbage file reinstalls instead of throwing", () => {
		expect(normalizeStamp(null)).toBeNull();
		expect(normalizeStamp({})).toBeNull();
		expect(
			normalizeStamp({
				version: "",
			}),
		).toBeNull();
		expect(
			normalizeStamp({
				version: 1126,
			}),
		).toBeNull();
	});

	test("falls back to the release channel when the stamp names one that no longer exists", () => {
		expect(
			normalizeStamp({
				version: "1.26.45.1",
				channel: "beta",
			})?.channel,
		).toBe(ReleaseChannel.Release);
	});

	test("falls back to the version when no label was recorded", () => {
		expect(
			normalizeStamp({
				version: "1.26.45.1",
			})?.label,
		).toBe("1.26.45.1");
	});

	test("drops non-strings out of the file list, because that list drives what an upgrade deletes", () => {
		expect(
			normalizeStamp({
				version: "1.26.45.1",
				files: [
					"bedrock_server",
					7,
					null,
				],
			})?.files,
		).toEqual([
			"bedrock_server",
		]);
	});
});
