import { describe, expect, test } from "bun:test";
import { normalizeAllowlist, withAllowed, withoutAllowed } from "./allowlist";

describe("reading allowlist.json, which is a top-level array the json codec cannot read", () => {
	test("keeps the entries bedrock writes, including the xuid it fills in on first connect", () => {
		expect(
			normalizeAllowlist([
				{
					ignoresPlayerLimit: false,
					name: "Meslzy",
					xuid: "2535",
				},
			]),
		).toEqual([
			{
				ignoresPlayerLimit: false,
				name: "Meslzy",
				xuid: "2535",
			},
		]);
	});

	test("keeps an entry that has no xuid yet, because that is how a new one starts", () => {
		expect(
			normalizeAllowlist([
				{
					name: "Meslzy",
				},
			]),
		).toEqual([
			{
				ignoresPlayerLimit: false,
				name: "Meslzy",
			},
		]);
	});

	test("drops an entry with no name, which bedrock would refuse anyway", () => {
		expect(
			normalizeAllowlist([
				{
					xuid: "2535",
				},
				{
					name: "Meslzy",
				},
			]),
		).toHaveLength(1);
	});
});

describe("changing the allowlist", () => {
	const listed = [
		{
			ignoresPlayerLimit: false,
			name: "Meslzy",
		},
	];

	test("adds a player", () => {
		expect(
			withAllowed(listed, {
				ignoresPlayerLimit: false,
				name: "Noura",
			}),
		).toHaveLength(2);
	});

	test("never adds the same gamertag twice, whatever the case", () => {
		expect(
			withAllowed(listed, {
				ignoresPlayerLimit: false,
				name: "meslzy",
			}),
		).toHaveLength(1);
	});

	test("removes by gamertag, whatever the case", () => {
		expect(withoutAllowed(listed, "MESLZY")).toHaveLength(0);
	});
});
