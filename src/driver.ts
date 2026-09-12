import { type Bridge, BridgeKind } from "@serverkgg/bridge";

const install: Bridge.Install = {
	kind: BridgeKind.Install,
	async run() {
		return;
	},
};

const lifecycle: Bridge.Lifecycle = {
	kind: BridgeKind.Lifecycle,
	async command() {
		return [
			"./bedrock_server",
		];
	},
};

export const driver: Bridge.Driver = {
	install,
	lifecycle,
};
