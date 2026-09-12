## Everything lives in one database

On Bedrock the Overworld, the Nether and the End are all stored in a single database inside the world folder. That means two things:

- There is no way to reset the Nether or the End on their own. If you came from Java looking for that button, it does not exist — and not because we skipped it.
- Editing world files while the server runs corrupts the save. Always stop the server first.

> [!danger]
> Never edit or delete anything inside the `db` folder. That is the database itself, and touching it takes the whole world with it.

## Uploading a world from your phone

You can export your world from the game as a `.mcworld` file and upload it straight here:

1. In game, open the world's settings.
2. Choose **Export World** and you get a `.mcworld` file.
3. Upload it from the worlds tab.

Once it is up, activate it and restart the server to play on it.

> [!note]
> On Bedrock the folder name and the world name are not the same thing. A world exported from a phone can land in a folder with a strange string for a name, while the name you see is the one you typed in game.

## Java worlds do not work

If you upload a Java world we refuse it. The two formats are completely different and there is no way to convert between them. You need a world exported from Minecraft Bedrock.

## Backups

A backup is your only way back if something happens to your world. We take them while the server runs: we pause saving for a moment, take the copy, and resume — nobody notices.

Take one before anything big: before deleting a world, before installing an add-on, and before switching to the preview build.
