## Bedrock has no ban

This is the first thing to know, especially coming from Java: a Bedrock server has no ban command at all — no `ban`, no banned-players list. You get two things:

- **Kick** (`kick`) — removes a player now, but they can walk straight back in.
- **The allowlist** — this is your real way to keep someone out.

## The allowlist

Once it is on, nobody joins your server unless their name is on it. So to keep a player out: turn the list on, and make sure their name is not on it.

@[command](allowlist on)

And to add someone:

@[command](allowlist add PlayerName)

> [!warning]
> The moment you turn the allowlist on, every player who is not on it is locked out — not just the one you wanted to stop. Add all of your friends before you turn it on.

The name you type is the player's gamertag. If it has a space in it, wrap it in quotes.

## Operators

An operator is a player who can run admin commands in game. While the server is running, one command does it:

@[command](op PlayerName)

> [!note]
> Bedrock stores permissions by account id (XUID), not by name, and we only learn a player's id after they have joined once. So if the server is off and that player has never joined, we cannot make them an operator — start the server, let them join once, and after that you can op them any time.

Because it is stored by account id, a player who changes their gamertag keeps their permissions.
