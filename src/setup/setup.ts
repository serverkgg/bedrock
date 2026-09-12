import { type Bridge, BridgeKind, BridgeSetupStepKind } from "@serverkgg/bridge";
import { GuideOpenTab } from "@serverkgg/bridge/guides";
import { PROPERTY_KEYS } from "../shared";

export const setup: Bridge.Setup = {
	kind: BridgeKind.Setup,
	steps: [
		{
			id: "identity",
			kind: BridgeSetupStepKind.Form,
			required: false,
			title: {
				ar: "سمّ سيرفرك",
				en: "Name your server",
			},
			help: {
				ar: "هذا الاسم اللي يشوفه اللاعبين في قائمة السيرفرات عندهم.",
				en: "This is the name players see in their server list.",
			},
			tab: "settings",
			section: "world",
			fields: [
				PROPERTY_KEYS.serverName,
				PROPERTY_KEYS.maxPlayers,
				PROPERTY_KEYS.gamemode,
				PROPERTY_KEYS.difficulty,
			],
		},
		{
			id: "access",
			kind: BridgeSetupStepKind.Form,
			required: false,
			title: {
				ar: "مين يقدر يدخل",
				en: "Who can join",
			},
			help: {
				ar: "لو تبي سيرفر خاص، شغّل القائمة البيضاء وضيف أصحابك فيها. في بيدروك ما فيه حظر، فهذي طريقتك.",
				en: "For a private server, turn the allowlist on and add your friends to it. Bedrock has no ban, so this is your way.",
			},
			tab: "settings",
			section: "access",
			fields: [
				PROPERTY_KEYS.allowList,
				PROPERTY_KEYS.onlineMode,
			],
		},
		{
			id: "invite",
			kind: BridgeSetupStepKind.Open,
			required: false,
			title: {
				ar: "عزم أصحابك",
				en: "Invite your friends",
			},
			help: {
				ar: "في بيدروك العنوان والمنفذ خانتين منفصلات — انسخهم من هنا وأرسلهم لأصحابك.",
				en: "On Bedrock the address and the port are two separate fields — copy them from here and send them over.",
			},
			target: {
				tab: GuideOpenTab.Access,
			},
		},
	],
};
