import type { Bridge } from "@serverkgg/bridge";
import { announce } from "./announce";
import { backup } from "./backup";
import { events } from "./events";
import { install } from "./install";
import { lifecycle } from "./lifecycle";
import { query } from "./query";

export const driver: Bridge.Driver = {
	install,
	lifecycle,
	events,
	query,
	backup,
	announce,
};
