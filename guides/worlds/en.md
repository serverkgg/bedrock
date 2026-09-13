## Create, switch and copy worlds

Open **Worlds** to create a named world with an optional seed, upload a `.mcworld`, or switch between existing worlds. A new world generates when the server starts. The seed only affects a world that has not generated yet.

World changes run as protected operations. The panel makes a recovery backup, stops the server before changing files, and resumes it if it was running. A failed backup stops the change. Keep the operation open until it finishes.

**Clone world** makes an independent copy with a new name. It keeps the original world and its player progress. Shared add-ons remain shared, so check the add-on list before changing them.

## Take a world back to Bedrock

Choose **Export to Files**. After the operation completes, download the `.mcworld` from the `exports` folder in **Files** and open it in Minecraft Bedrock. Exporting again replaces that world's previous export. Delete old exports when you no longer need them.

The export includes the world's files, embedded packs and the exact shared pack versions its activation files reference. A missing pack stops export so you do not receive a world with broken add-on references.

## Upload a world

1. Export your world from Minecraft Bedrock as a `.mcworld` file.
2. Upload it from **Worlds**.
3. Activate it to play on it. An existing world with the same folder name is kept; rename the upload if needed.

Serverk does not convert Java worlds into Bedrock worlds. Upload a Bedrock export. Archives with unsafe paths, unsupported links or excessive expanded size are rejected before installation.

## Protect your progress

The Overworld, Nether and End share one LevelDB database. This panel does not reset individual Bedrock dimensions. Never edit the `db` directory by hand.

Recovery backups protect changes; keep regular backups too. Live backups use Bedrock's fresh save report and copy the reported file boundaries before resuming saving. If the server cannot provide a consistent copy, the backup fails instead of pretending an unsafe copy succeeded.
