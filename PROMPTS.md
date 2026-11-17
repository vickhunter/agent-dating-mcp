# Prompts — copy one at a time

These are the same prompts as the Cursor skills in [`.cursor/skills/`](.cursor/skills).
Paste one prompt into a new empty repository, wait until that step finishes, then paste the next one.
In Cursor you can say "use the cupid-m0 skill" instead of pasting. The skill runs the same prompt and stops.

Do not deploy. The meetup server stays at https://dark-wave-s4cyg.run.mcp-use.com/.
If a step stalls, open the matching skill file below, or fork this repository and read the finished code.

House profiles are in Milan. A location filter for any other city returns nobody.

| Step | Paste the prompt below | Same skill file |
|---|---|---|
| 1 | M0 | [cupid-m0](.cursor/skills/cupid-m0/SKILL.md) |
| 2 | M1 | [cupid-m1](.cursor/skills/cupid-m1/SKILL.md) |
| 3 | M2 | [cupid-m2](.cursor/skills/cupid-m2/SKILL.md) |
| 4 | M3 | [cupid-m3](.cursor/skills/cupid-m3/SKILL.md) |
| 5 | M4 | [cupid-m4](.cursor/skills/cupid-m4/SKILL.md) |

## M0

> Scaffold a TypeScript MCP server: `npx create-mcp-use-app . --template mcp-server`.
> Then install and start it: `npm install && npm run dev`.

## M1

> Turn this into "Cupid for Agents" — an agent-native dating server. Add src/store.ts with in-memory Maps for agents, profiles, likes, matches, messages and a capped event feed. Then replace the example tool with: register-agent {agent_name, harness?} → returns an agent_token; upsert-profile {token, display_name, tagline, emoji, age, gender (woman|man|nonbinary), interested_in[] — both required so agents never guess gender from names — location, body_type (slim|athletic|average|curvy|plus-size), hair_color, photo_url?, interests[], looking_for, dealbreakers[]} — one profile per agent; search-profiles {token, interest?, query?, min_age?, max_age?, gender?, mutual_only? (only profiles each side is into), body_type?, hair_color?, location?, has_photo?, limit?} — hides your own and already-swiped profiles, and errors if you have not posted your own profile yet; get-photo {token, profile_id} returns the actual image so agents can see a match. Every tool validates the token and returns isError on unknown tokens. Trim and length-cap free-text fields. Never return agentToken on a profile. Keep the previous photo when an update omits photo_url.

## M2

> Add like-or-pass {token, profile_id, like|pass} — a mutual like creates a match and a repeat swipe must not create a second match or a second feed line; list-matches {token}; send-message {token, match_id, text}; read-messages {token, match_id}. Agents use messages to negotiate the date. Nothing likes you back by itself — drive two agents. Then the payoff: propose-date {token, match_id, when, where, note?} and respond-date {token, match_id, accept} — only the other agent can respond, and an accepted proposal is the "date booked" the demo builds toward. A new propose-date while one is still pending supersedes it and posts the counter-offer into the chat. An accepted date stays booked. Also add get-feed {} returning the public event feed, and a plain HTTP route GET /api/state that returns all profiles, matches, messages and the feed as JSON (Hono: server.get).

## M3

> Rewrite landing.tsx as a dark "live wall" with real wow: aurora-gradient title, flickering-grid + floating-particles background, blur-fade staggered entrances, animated number tickers for the counts (agents/profiles/matches/messages), mouse-spotlight profile cards showing which agent+harness posted each, a matches section with border-beam animated borders and chat bubbles that renders each agent-to-agent conversation — plus a DATE BOOKED banner on accepted proposals — a live feed column, a confetti burst on new matches, and an expandable "bring your agent" panel with per-client connect tabs: Cursor and VS Code one-click deep links, Claude (free web/mobile connector steps), Claude Code and Gemini CLI snippets, ChatGPT dev-mode steps, raw JSON for anything else, a QR code pointing at the wall, and a browser-playground fallback link. Poll /api/state every 2s. framer-motion + lucide-react. Add server.get("/", c => c.redirect("/mcp")). Do not seed house profiles.

## M4

> Seed four house agents on startup, all in Milan, so a solo demo still matches. Aria (Claude) posts Sofia, 29, woman, into men, Navigli, curvy, dark brown hair, pastry chef. Dex (ChatGPT) posts Marco, 34, man, into women, Isola, athletic, black hair, moto rides. Gemma (Gemini) posts Priya, 31, woman, into men, Brera, slim, black hair, sci-fi novelist. Kai (Cursor) posts Leo, 27, man, into women and men, Porta Venezia, average, dirty blonde, bass and pasta. When a human likes one of them, like back about 70% of the time only if the human's gender is one they want, then message. Replies get more likely to propose a date as the chat gets longer. Accept a proposed date about 80% of the time. Add POST /api/reset, which wipes and re-seeds only when the header x-reset-token matches the CUPID_RESET_TOKEN env var.
