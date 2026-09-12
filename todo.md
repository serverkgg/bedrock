# todo

What is deliberately left, and what still has to be proven against a real server.

## Must be measured before this is sold

`tome/process/game.md` is explicit that these are measurements, not guesses copied from a wiki. Every value
in `serverk.yml` below is currently a placeholder that reads plausible and has not been measured.

- `resources.minMemoryMb` (1024) — this is the field that decides which plans Bedrock can be ordered on, so
  it is a commercial number as much as a technical one. BDS is a native server with no heap to size, so it
  should land well under minecraft's 1024; measure with `docker stats` under load.
- `resources.recommendedMemoryMb` (2048), `playersPerMemoryGb` (10), `maxRecommendedPlayers` (100).
- `resources.minDiskMb` (5120) — the installed size after the debug-symbol prune, plus world headroom.
- `container.runtime.installBudgetMinutes` (10) — a measured cold install. This is the number the
  provisioning screen shows the customer, so an optimistic value fails real provisions.
- `container.runtime.bootBudgetMinutes` (6) — process start to the ready line, worst case: first boot
  generates a world.
- `container.runtime.shmMb` (64) and `pidsLimit` (512) — defaults; raise only if a failure demands it.
- `lifecycle.stopTimeoutSeconds` (120) — how long BDS really takes to flush a large LevelDB world. **180s is
  the ceiling a package may declare alone**; past that, `DEFAULT_STOP_TIMEOUT_SECONDS` in
  `platform/src/services/server/stopControl.ts` has to move in the same change.

## Still to verify against a real BDS

- `PORT_BIND_FAILED` and `WORLD_CORRUPT` in `src/events/events.ts` are informed guesses. Reproduce them
  (hold the port; corrupt a `db/`) and fix the patterns — or **delete them rather than ship regexes that
  never fire**.
- The stop reply. `lifecycle.stop` expects `/Quit correctly|Stopping server/i`.
- `kick <xuid>` — the shipped manual says kick takes a name or an xuid; `players.kick` relies on it.
- Whether `op <gamertag>` needs quoting for a gamertag containing a space.
- Whether `permission reload` picks up a `visitor` downgrade without a rejoin.
- What `allowlist add` does when `online-mode=false`. If it refuses to operate at all, the whole allowlist
  tab is a no-op in that configuration and the `online-mode` warning has to say so.
- Whether BDS starts cleanly when `server-portv6` is bound but never published. `seedConfig` forces it to
  the game port + 1 inside the container's own netns.
- Whether a pack version mismatch between `world_*_packs.json` and a manifest fails silently, and whether
  a `format_version: 3` semver string is accepted there (we always write the numeric triple).
- Whether the first entry of `world_resource_packs.json` is the highest priority. New packs are appended and
  the operator gets explicit move up/down, so the design does not depend on the answer — but the `help`
  copy on the add-ons tab names one end as winning and should be correct.

## Deferred, on purpose

- **A CurseForge add-on catalog.** The upload route is complete and has no external dependency; the catalog
  is gated on CurseForge's numeric `gameId` for Minecraft Bedrock and the `classId`s for Addons / Worlds /
  Resource Packs, which are not resolvable from public docs. Resolve them with `GET /v1/games` then
  `GET /v1/categories?gameId=<id>&classesOnly=true` and hard-code them as named constants. **A wrong gameId
  yields a catalog full of Java mods, which is worse than no catalog** — check the class of the first search
  hit before shipping. The SDK already carries `createCurseforgeCatalog`, and `CURSEFORGE_API_KEY` is already
  declared in the manifest as an optional secret.
- **Player avatars.** There is no public gamertag→skin or XUID→gamerpic endpoint for Bedrock; the Xbox ones
  need an XSTS token, which is a Microsoft account and a refresh flow a game driver has no business holding.
  The Players page already degrades to a platform glyph and then the name's initial. The eventual shape is a
  platform-side `serverk://avatars/bedrock/{xuid}` route, after which this is one manifest line.
- **A `codecs/jsonList.ts` promotion into `@serverkgg/bridge`.** `codec.json` returns `{}` for a top-level
  array (`codecs/json.ts:14`), and `allowlist.json`, `permissions.json` and both `world_*_packs.json` are all
  top-level arrays. `src/shared/jsonList.ts` works around it here; a second package hitting the same wall is
  the moment to push it up.
- **`ModCrashed` / `MissingDependency` events.** Pack load failures only surface in the content log, which
  `seedConfig` forces off because it is enormous. Turning it on behind a variable, learning the real lines
  and adding the patterns is the follow-up.

## Notes for whoever runs the first real install

- **Mojang's CDN refuses curl's User-Agent.** Verified against the real URL from inside `debian:12-slim`:
  curl's default UA and an explicit `curl/7.88.1` both get an empty reply, while `Mozilla/5.0` and
  `serverk-bridge/1.0 (serverk.gg)` both answer `206`. The bridge sends the latter
  (`runtime/bridgeFiles.ts:306` reuses `USER_AGENT` from `bridgeNet.ts:10`), so `context.files.download`
  works — but anyone reaching for `context.exec(["curl", ...])` here will be confused for an hour.
- `install.run` logs the archive's entry count and top-level names on every install (`unzip -Z1` before
  unpacking). Read that line on the first container run — it is how we learn what the archive actually
  carries, and it is what the stale-file sweep on the next upgrade deletes.
- World and pack folder names keep Unicode letters (`/[^\p{L}\p{N}._-]+/gu`), so an Arabic add-on or world
  name survives into the folder instead of sanitising to nothing. BDS's own default `level-name` carries a
  space, so a non-ASCII one should be fine — but confirm that an Arabic `level-name` round-trips through
  `server.properties` on a real server before relying on it.
