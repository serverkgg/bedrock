## What the preview build is

Preview is where Microsoft tries new things before they reach everyone. You can run your server on it if you want to try something new ahead of the crowd.

## Before you switch

> [!danger]
> A world opened on preview does not come back to the release build. Preview upgrades your world data to a newer format that the release build cannot read. This is a one-way door.

The version operation creates a recovery backup before switching. To return safely, restore that pre-switch backup with its recorded runtime version. Installing an older build alone cannot undo changes to the world.

## Players need the same build

Only players who have the Minecraft Preview app installed can join a preview server. The normal game cannot.

So if you switch, all of your friends have to switch with you.

## When to use it

- You want to try a new feature before it ships.
- You are building an add-on and want to test it against the new format.

If neither is true, stay on the release build. It is the steadier one, and it is the one all of your friends can already join.

## Updates are explicit

**Keep installed build** picks the latest build only at first installation. Ordinary restarts keep that concrete version. To update, choose a new version number in **Version**. Recovery backups also preserve the installed build metadata; an unavailable requested build fails visibly instead of silently substituting another one.
