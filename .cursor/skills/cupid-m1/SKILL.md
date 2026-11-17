---
name: cupid-m1
description: >-
  Builds milestone 1 of the Cupid for Agents live demo: in-memory store plus
  register-agent, upsert-profile, search-profiles, and get-photo. Use only when
  the user explicitly says "use the cupid-m1 skill", "cupid milestone 1", or
  "add cupid profiles".
disable-model-invocation: true
---

# Cupid M1 — profiles

Live-demo step 2 of 5. The mcp-use scaffold from `cupid-m0` is already in this repo. Do this step only, then stop. If `fetch-weather` is missing, stop and say to run `cupid-m0` first.

## Show this prompt, then build

Print this in the chat as a blockquote before you write or run anything:

> Turn this into "Cupid for Agents" — an agent-native dating server. Add src/store.ts with in-memory Maps for agents, profiles, likes, matches, messages and a capped event feed. Then replace the example tool with: register-agent {agent_name, harness?} → returns an agent_token; upsert-profile {token, display_name, tagline, emoji, age, gender (woman|man|nonbinary), interested_in[] — both required so agents never guess gender from names — location, body_type (slim|athletic|average|curvy|plus-size), hair_color, photo_url?, interests[], looking_for, dealbreakers[]} — one profile per agent; search-profiles {token, interest?, query?, min_age?, max_age?, gender?, mutual_only? (only profiles each side is into), body_type?, hair_color?, location?, has_photo?, limit?} — hides your own and already-swiped profiles, and errors if you have not posted your own profile yet; get-photo {token, profile_id} returns the actual image so agents can see a match. Every tool validates the token and returns isError on unknown tokens. Trim and length-cap free-text fields. Never return agentToken on a profile. Keep the previous photo when an update omits photo_url.

## Rules

- Keep the `MCPServer` setup from the scaffold. Replace `fetch-weather` and the example prompt with the four tools above.
- `register-agent` returns `agent_token` once. Every later tool takes `token` and returns an error on an unknown token.
- `gender` and `interested_in` are required. `mutual_only` keeps a profile only when each side's gender is in the other's `interested_in`.
- Search hides the caller's own profile and profiles they already swiped on. Nothing writes swipes yet.
- Store data in memory. Cap the event feed.
- Do not add swipe, match, message, date, feed, or `/api/state` tools. Do not rewrite the landing page. Do not seed house profiles.
- Do not deploy. Do not clone or copy https://github.com/vickhunter/agent-dating-mcp.
- Do not commit.

## Done

Stop when `register-agent`, `upsert-profile`, `search-profiles`, and `get-photo` are registered and the dev server still runs. The next step is the `cupid-m2` skill. Do not start it.
