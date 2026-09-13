## Two kinds of add-on

- **Behavior packs** — change mobs, items and game rules. They run on the server, and players download nothing.
- **Resource packs** — change textures and sounds. Every player downloads them when they join.

## Installing one

You have two routes, and both end up in the same place:

1. **The catalog** — find an add-on and install it with one click.
2. **Upload** — if you already have a `.mcaddon` or `.mcpack` file, upload it from the same tab.

Before installing, we save a recovery backup and stop the game. We then install the add-on and start the server again if it was running. If it was stopped, it stays stopped.

> [!note]
> A single `.mcaddon` file can hold more than one add-on — usually a behavior pack and a resource pack together. We unpack it and install all of them.

## Order matters

If several resource packs change the same thing, the order decides which one wins. You can move them up and down in the list.

> [!warning]
> If you remove a behavior pack that a world was using, everything it added disappears from that world — the mobs and items it brought with it. Take a backup first.

## Requirements and shared worlds

The installed list includes discovered packs from the active world and server folders. It shows which worlds use each pack and its declared dependencies, including Script API modules. These declarations help diagnose compatibility; they do not prove that a script loaded successfully.

Installing or enabling a pack checks required pack versions and its declared minimum Minecraft version. Required packs are activated first. Missing dependencies and dependency cycles stop activation. Disable dependent add-ons before disabling a pack they need.

A pack used by another world cannot be removed or switched to a different version until those references are removed. This prevents fixing one world from breaking another. Pack changes use a recovery backup and a stopped server. Failed staged installation restores the previous files.

After restarting, check **Server status** for recent content errors and open the console for the full message. “Installed” means the files are present; it does not claim the game loaded the add-on.
