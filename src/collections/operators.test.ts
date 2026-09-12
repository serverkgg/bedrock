import { describe, expect, test } from "bun:test";
import { normalizePermissions, PermissionLevel, withoutPermission, withPermission } from "./operators";

describe("reading permissions.json, which bedrock keys by xuid and never by name", () => {
	test("keeps each level bedrock understands", () => {
		expect(
			normalizePermissions([
				{
					permission: "operator",
					xuid: "1",
				},
				{
					permission: "visitor",
					xuid: "2",
				},
			]),
		).toEqual([
			{
				permission: PermissionLevel.Operator,
				xuid: "1",
			},
			{
				permission: PermissionLevel.Visitor,
				xuid: "2",
			},
		]);
	});

	test("falls back to member for a level bedrock does not know", () => {
		expect(
			normalizePermissions([
				{
					permission: "admin",
					xuid: "1",
				},
			])[0]?.permission,
		).toBe(PermissionLevel.Member);
	});

	test("drops an entry with no xuid, because there is nothing to key it by", () => {
		expect(
			normalizePermissions([
				{
					permission: "operator",
				},
			]),
		).toEqual([]);
	});
});

describe("changing permissions", () => {
	const entries = [
		{
			permission: PermissionLevel.Operator,
			xuid: "1",
		},
	];

	test("replaces a level rather than adding a second row for the same account", () => {
		const changed = withPermission(entries, "1", PermissionLevel.Visitor);

		expect(changed).toHaveLength(1);
		expect(changed[0]?.permission).toBe(PermissionLevel.Visitor);
	});

	test("adds an account that was not listed", () => {
		expect(withPermission(entries, "2", PermissionLevel.Operator)).toHaveLength(2);
	});

	test("removes by xuid", () => {
		expect(withoutPermission(entries, "1")).toEqual([]);
	});
});
