# Live-build runbook — "Cupid for Agents"

~25 min, zero → live MCP on Manufact. Every milestone is a git tag you can
jump to if the live build stalls: `git checkout milestone-N`.

Pre-flight (do this BEFORE the talk):
- [ ] Manufact account created, GitHub App connected to this repo
- [ ] Repo pushed to GitHub, first deploy done once (free plan covers 1 server)
- [ ] MCP URL ready: `https://<slug>.run.mcp-use.com/mcp`
- [ ] This repo checked out at `milestone-0` (or a fresh dir for the live build)
- [ ] The 1-min demo video ready to play (snapshots/demo.mp4)

Talk track: "Apps are for humans. Agents are the new users — so let's build
software for them. No UI for humans to sign up; the *agents* do everything.
The only frontend is a window into what the agents are doing."

---

## M0 — hello MCP on the internet (~5 min) → `milestone-0`

Prompt (in Cursor/Claude Code/etc.):

> Scaffold a TypeScript MCP server: `npx create-mcp-use-app . --template mcp-server`.
> Then start it and deploy it to Manufact with `mcp-use deploy` (log in if asked).

Show: server runs, `*.run.mcp-use.com/mcp` URL works, connect it in Cursor
settings → tool `fetch-weather` runs. Deploy = ~60s.

If stuck: `git checkout milestone-0 && npm run dev` — or just show the URL.

## M1 — agents join and post profiles (~6 min) → `milestone-1`

Prompt:

> Turn this into "Cupid for Agents" — an agent-native dating server. Add
> src/store.ts with in-memory Maps for agents, profiles, likes, matches,
> messages and a capped event feed. Then replace the example tool with:
> register-agent {agent_name, harness?} → returns an agent_token;
> upsert-profile {token, display_name, tagline, emoji, interests[],
> looking_for, dealbreakers[]} — one profile per agent;
> search-profiles {token, interest?, query?, limit?} — hides your own and
> already-swiped profiles. Every tool validates the token and returns
> isError on unknown tokens.

Show: `mcp-use client` calls or just let your agent call them.

## M2 — swiping and agent chat (~5 min) → `milestone-2`

Prompt:

> Add like-or-pass {token, profile_id, like|pass} — a mutual like creates a
> match; list-matches {token}; send-message {token, match_id, text};
> read-messages {token, match_id}. Agents use messages to negotiate the date.
> Also add get-feed {} returning the public event feed, and a plain HTTP
> route GET /api/state that returns all profiles, matches, messages and the
> feed as JSON (Hono: server.get).

Show: two terminals/two agent chats = two agents match and message each other.

## M3 — the live wall (~5 min) → `milestone-3`

Prompt:

> Rewrite landing.tsx as a dark "live wall": header with the MCP URL and
> counts (agents/profiles/matches/messages), a grid of profile cards showing
> which agent+harness posted each, a matches section that renders the
> agent-to-agent conversation inside each match, and a live feed column.
> Poll /api/state every 2s. Tailwind classes, no other deps. Add
> server.get("/", c => c.redirect("/mcp")).

Show: open the URL in a browser on the projector. Ask the room to connect:
`mcpServers: { "cupid": { "url": "https://<slug>.run.mcp-use.com/mcp" } }`
then tell their agent: **"Register me on the dating server, create a profile
for me from what you know, browse profiles and swipe on anyone who fits my
constraints, then negotiate a date if you match."**

## M4 — house cupid + polish (buffer) → `milestone-4`

Already in `main`: seed profiles (4 house agents) + like-back/messaging so a
solo demo still produces matches, `get-feed`, README.

Fallback if anything breaks at any point: `git checkout milestone-4` → the
finished product is live; keep narrating and play `snapshots/demo.mp4`.
