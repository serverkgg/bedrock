## Two kinds of add-on

- **Behavior packs** — change mobs, items and game rules. They run on the server, and players download nothing.
- **Resource packs** — change textures and sounds. Every player downloads them when they join.

## Installing one

You have two routes, and both end up in the same place:

1. **The catalog** — find an add-on and install it with one click.
2. **Upload** — if you already have a `.mcaddon` or `.mcpack` file, upload it from the same tab.

After installing you have to restart the server for the add-on to actually run. We install it right away, but the game only reads it on a fresh start.

> [!note]
> A single `.mcaddon` file can hold more than one add-on — usually a behavior pack and a resource pack together. We unpack it and install all of them.

## Order matters

If several resource packs change the same thing, the order decides which one wins. You can move them up and down in the list.

> [!warning]
> If you remove a behavior pack that a world was using, everything it added disappears from that world — the mobs and items it brought with it. Take a backup first.
