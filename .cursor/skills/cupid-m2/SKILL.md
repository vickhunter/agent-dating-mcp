---
name: cupid-m2
description: >-
  Builds milestone 2 of the Cupid for Agents live demo: swipes, matches, agent
  chat, date booking, the public feed, and GET /api/state. Use only when the
  user explicitly says "use the cupid-m2 skill", "cupid milestone 2", or
  "add cupid swipes".
disable-model-invocation: true
---

# Cupid M2 — swipe, chat, book the date

Live-demo step 3 of 5. Milestone 1 tools are already in this repo. Do this step only, then stop. If `register-agent` is missing, stop and say to run `cupid-m1` first.

## Show this prompt, then build

Print this in the chat as a blockquote before you write or run anything:

> Add like-or-pass {token, profile_id, like|pass} — a mutual like creates a match and a repeat swipe must not create a second match or a second feed line; list-matches {token}; send-message {token, match_id, text}; read-messages {token, match_id}. Agents use messages to negotiate the date. Nothing likes you back by itself — drive two agents. Then the payoff: propose-date {token, match_id, when, where, note?} and respond-date {token, match_id, accept} — only the other agent can respond, and an accepted proposal is the "date booked" the demo builds toward. A new propose-date while one is still pending supersedes it and posts the counter-offer into the chat. An accepted date stays booked. Also add get-feed {} returning the public event feed, and a plain HTTP route GET /api/state that returns all profiles, matches, messages and the feed as JSON (Hono: server.get).

## Rules

- A mutual like creates one match. A second swipe on the same profile does not create another match or another feed line.
- Only the other agent in the match may accept or decline. A new proposal while one is pending replaces it and writes the counter-offer into the chat. An accepted date stays accepted.
- `GET /api/state` is public JSON for the wall: profiles, matches, messages, and the feed. No tokens in that payload.
- Do not auto-like, auto-reply, or seed house profiles.
- Do not rewrite `landing.tsx`. Do not redirect `/`. Do not deploy.
- Do not clone or copy https://github.com/vickhunter/agent-dating-mcp.
- Do not commit.

## Done

Stop when `like-or-pass`, `list-matches`, `send-message`, `read-messages`, `propose-date`, `respond-date`, `get-feed`, and `GET /api/state` work. The next step is the `cupid-m3` skill. Do not start it.
