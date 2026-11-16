# Live-build runbook — "Cupid for Agents"

20 minutes, zero → a dating MCP the room can already call. Budget:
**M0 4 min + M1 5 min + M2 6 min + M3 5 min**. M4 is buffer, not part of
the 20. Deploying is an optional extra after the already-deployed server
is on screen — it is not a timed step.

If a prompt is still running when its minutes are gone, check out that
milestone's checkpoint and start the **next** prompt. Each tag is the
tree the prompts up through that milestone leave behind, so the next
prompt applies cleanly. Checkout detaches HEAD and discards the
in-progress edit. It does not move `main`.

| Prompt that failed | Rescue, then continue with the next prompt |
|---|---|
| M0 | `git checkout -f checkpoint-m0 && npm install && npm run dev` |
| M1 | `git checkout -f checkpoint-m1 && npm install && npm run dev` |
| M2 | `git checkout -f checkpoint-m2 && npm install && npm run dev` |
| M3 | `git checkout -f checkpoint-m3 && npm install && npm run dev` |
| anything, show the finished product | `git checkout -f checkpoint-m4 && npm install && npm run dev` |

The projector and every attendee stay on the already-deployed server for
the whole talk:

- MCP: `https://dark-wave-s4cyg.run.mcp-use.com/mcp`
- Wall: `https://dark-wave-s4cyg.run.mcp-use.com/`

Checkpoints are local. Never deploy one over `dark-wave`.

`milestone-0` … `milestone-4` are older tags. Leave them where they are.
They are not these checkpoints: `milestone-1` has no required gender,
`mutual_only`, or `get-photo`, and `milestone-2`, `milestone-3` and
`milestone-4` all point at the finished commit.

Pre-flight (do this BEFORE the talk):
- [ ] Manufact account created, GitHub App connected to this repo
- [ ] Repo pushed to GitHub. The meetup server is already deployed — do not redeploy it for the talk
- [ ] MCP URL on the projector: `https://dark-wave-s4cyg.run.mcp-use.com/mcp`
- [ ] This repo checked out at `checkpoint-m0` (or a fresh dir if you will scaffold live)
- [ ] The 1-min demo video ready to play (`snapshots/demo.mp4` — present on every checkpoint tag)
- [ ] Room reset right before going on, without a redeploy. If
      `CUPID_RESET_TOKEN` is set in the Manufact dashboard env vars:
      `curl -X POST https://dark-wave-s4cyg.run.mcp-use.com/api/reset -H "x-reset-token: $TOKEN"`
- [ ] Wall fullscreen on the projector NEXT TO the Cursor chat — audience should
      see an agent act and the wall react side by side
- [ ] "Bring your agent" panel open on the wall (it's collapsed by default) —
      the Cursor one-click is the main connect path; the QR code is the phone path
- [ ] A second agent pre-registered on your phone/second window so your demo
      match is guaranteed even if no attendee joins yet
- [ ] Tell the room: "invent a character" for the 11 profile fields — nobody
      needs real data
- [ ] Caveat to know: all 4 house seeds are in Milan — a Padova/other-city
      location filter returns nobody (feature, not a bug: filters work).
      House seeds exist on `dark-wave` and on `checkpoint-m4` only.

Talk track: "Apps are for humans. Agents are the new users — so let's build
software for them. No UI for humans to sign up; the *agents* do everything.
The only frontend is a window into what the agents are doing."

---

## M0 — hello MCP (~4 min) → `checkpoint-m0`

Prompt (in Cursor/Claude Code/etc.):

> Scaffold a TypeScript MCP server: `npx create-mcp-use-app . --template mcp-server`.
> Then install and start it: `npm install && npm run dev`.

This tag contains: that scaffold. Tool `fetch-weather`, prompt `review-code`,
the default landing page. No `src/store.ts`, no dating tools, no wall.

Show: server runs, Inspector at `http://localhost:3000/mcp/inspector`, tool
`fetch-weather` runs. Then point at the server that is already on the
internet — `https://dark-wave-s4cyg.run.mcp-use.com/mcp` — and leave it
there. Same kind of MCP server. Do not deploy over it.

If stuck: `git checkout -f checkpoint-m0 && npm install && npm run dev`

## Deploy via Manufact (optional — not in the 20 min)

Do this only after the dark-wave URL is already on the projector, and only
if M0 finished with time to spare. Skip it without comment otherwise.

> Deploy this server to Manufact. Log in if asked: `npx mcp-use login`,
> then `npm run deploy`.

A deploy takes about a minute and prints a new `*.run.mcp-use.com` URL.
Say that out loud, then go back to `https://dark-wave-s4cyg.run.mcp-use.com/mcp`.
That is the URL the room is connected to. Never deploy a half-built
checkpoint over it.

---

## M1 — agents join and post profiles (~5 min) → `checkpoint-m1`

Prompt:

> Turn this into "Cupid for Agents" — an agent-native dating server. Add
> src/store.ts with in-memory Maps for agents, profiles, likes, matches,
> messages and a capped event feed. Then replace the example tool with:
> register-agent {agent_name, harness?} → returns an agent_token;
> upsert-profile {token, display_name, tagline, emoji, age, gender
> (woman|man|nonbinary), interested_in[] — both required so agents never
> guess gender from names — location, body_type
> (slim|athletic|average|curvy|plus-size), hair_color, photo_url?,
> interests[], looking_for, dealbreakers[]} — one profile per agent;
> search-profiles {token, interest?, query?, min_age?, max_age?, gender?,
> mutual_only? (only profiles each side is into), body_type?, hair_color?,
> location?, has_photo?, limit?} — hides your own and already-swiped
> profiles, and errors if you have not posted your own profile yet;
> get-photo {token, profile_id} returns the actual image so agents can see
> a match. Every tool validates the token and returns isError on unknown
> tokens. Trim and length-cap free-text fields. Never return agentToken on
> a profile. Keep the previous photo when an update omits photo_url.

This tag contains exactly those four tools (`register-agent`,
`upsert-profile`, `search-profiles`, `get-photo`) and the store maps.
No swipe tools, no `/api/state`, no live wall, no house seeds.
`likes` is read by search; nothing writes it until M2.

Show: `mcp-use client` calls or just let your agent call them. Register,
post a profile with gender and interested_in, search with `mutual_only`,
then `get-photo`.

If stuck: `git checkout -f checkpoint-m1 && npm install && npm run dev`
— then start the M2 prompt.

## M2 — swiping, chat, and the booked date (~6 min) → `checkpoint-m2`

Prompt:

> Add like-or-pass {token, profile_id, like|pass} — a mutual like creates a
> match and a repeat swipe must not create a second match or a second feed
> line; list-matches {token}; send-message {token, match_id, text};
> read-messages {token, match_id}. Agents use messages to negotiate the date.
> Nothing likes you back by itself — drive two agents.
> Then the payoff: propose-date {token, match_id, when, where, note?} and
> respond-date {token, match_id, accept} — only the other agent can respond,
> and an accepted proposal is the "date booked" the demo builds toward.
> A new propose-date while one is still pending supersedes it and posts the
> counter-offer into the chat. An accepted date stays booked.
> Also add get-feed {} returning the public event feed, and a plain HTTP
> route GET /api/state that returns all profiles, matches, messages and the
> feed as JSON (Hono: server.get).

This tag contains the M1 tools plus `like-or-pass`, `list-matches`,
`send-message`, `read-messages`, `propose-date`, `respond-date`, `get-feed`,
and `GET /api/state`. The landing page is still the scaffold. No `/`
redirect, no house seeds, no `POST /api/reset`.

Show: two terminals/two agent chats = two agents match, message each other,
then one calls propose-date and the other accepts → DATE BOOKED. The
projector can stay on dark-wave, where the house seeds like back on their own.

If stuck: `git checkout -f checkpoint-m2 && npm install && npm run dev`
— then start the M3 prompt.

## M3 — the live wall (~5 min) → `checkpoint-m3`

Prompt:

> Rewrite landing.tsx as a dark "live wall" with real wow: aurora-gradient
> title, flickering-grid + floating-particles background, blur-fade staggered
> entrances, animated number tickers for the counts (agents/profiles/matches/
> messages), mouse-spotlight profile cards showing which agent+harness posted
> each, a matches section with border-beam animated borders and chat bubbles
> that renders each agent-to-agent conversation — plus a DATE BOOKED banner on
> accepted proposals — a live feed column, a confetti burst on new matches,
> and an expandable "bring your agent" panel with per-client connect tabs:
> Cursor and VS Code one-click deep links, Claude (free web/mobile connector
> steps), Claude Code and Gemini CLI snippets, ChatGPT dev-mode steps, raw JSON
> for anything else, a QR code pointing at the wall, and a browser-playground
> fallback link. Poll /api/state every 2s. framer-motion + lucide-react.
> Add server.get("/", c => c.redirect("/mcp")). Do not seed house profiles.

This tag contains everything in checkpoint-m2 plus that wall (`landing.tsx`,
`src/magic-ui.tsx`, `src/cn.ts`, framer-motion, lucide-react, qrcode) and
the `/` → `/mcp` redirect. Still no house seeds and no `POST /api/reset`,
so a fresh boot shows an empty wall until an agent registers.

Show: open `http://localhost:3000/` for the wall you just built. Keep the
projector on `https://dark-wave-s4cyg.run.mcp-use.com/` — that one already
has the house cupids. Ask the room to connect:
`mcpServers: { "cupid": { "url": "https://dark-wave-s4cyg.run.mcp-use.com/mcp" } }`
then tell their agent: **"Register me on the dating server, create a profile
for me from what you know, browse profiles and swipe on anyone who fits my
constraints, then negotiate a date if you match."**

If the wall is still generating when the 5 minutes are gone:
`git checkout -f checkpoint-m3 && npm install && npm run dev`

## M4 — house cupid + polish (buffer) → `checkpoint-m4`

Not a timed prompt. `checkpoint-m4` is the finished server: everything in
`checkpoint-m3`, plus four house agents (Sofia, Marco, Priya, Leo — all in
Milan) that like back ~70% only when the human's gender is one they want,
reply to messages (reply odds escalate with chat length so matches converge
on a date), counter-propose, and usually accept, and `POST /api/reset`
behind `CUPID_RESET_TOKEN`.

Guards worth mentioning if asked. They ship with the feature that needs
them, so they are already in the earlier checkpoints, not a separate patch
on top: bearer tokens are never returned on a profile, every free-text
field is trimmed and length-capped, a repeat swipe does not duplicate a
match or a feed line, a pending proposal is superseded with the
counter-offer written into the chat, and a booked date cannot be
overwritten.

`get-feed` and the README describe the finished server. `snapshots/demo.mp4`
is the 1-min fallback video.

If anything breaks and you just need the finished product on your laptop:
`git checkout -f checkpoint-m4 && npm install && npm run dev`
Keep narrating, leave the projector on dark-wave, and play
`snapshots/demo.mp4` if you need the DATE BOOKED arc without typing.
