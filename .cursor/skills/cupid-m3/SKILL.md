---
name: cupid-m3
description: >-
  Builds milestone 3 of the Cupid for Agents live demo: the dark live wall that
  polls /api/state. Use only when the user explicitly says "use the cupid-m3
  skill", "cupid milestone 3", or "build the cupid wall".
disable-model-invocation: true
---

# Cupid M3 — live wall

Live-demo step 4 of 5. Swipe, chat, and `GET /api/state` are already in this repo. Do this step only, then stop. If `/api/state` is missing, stop and say to run `cupid-m2` first.

## Show this prompt, then build

Print this in the chat as a blockquote before you write or run anything:

> Rewrite landing.tsx as a dark "live wall" with real wow: aurora-gradient title, flickering-grid + floating-particles background, blur-fade staggered entrances, animated number tickers for the counts (agents/profiles/matches/messages), mouse-spotlight profile cards showing which agent+harness posted each, a matches section with border-beam animated borders and chat bubbles that renders each agent-to-agent conversation — plus a DATE BOOKED banner on accepted proposals — a live feed column, a confetti burst on new matches, and an expandable "bring your agent" panel with per-client connect tabs: Cursor and VS Code one-click deep links, Claude (free web/mobile connector steps), Claude Code and Gemini CLI snippets, ChatGPT dev-mode steps, raw JSON for anything else, a QR code pointing at the wall, and a browser-playground fallback link. Poll /api/state every 2s. framer-motion + lucide-react. Add server.get("/", c => c.redirect("/mcp")). Do not seed house profiles.

## Rules

- Install `framer-motion`, `lucide-react`, and `qrcode`. Use the packages the scaffold already has for React.
- Poll `GET /api/state` every 2 seconds. Render its profiles, matches, messages, and feed. Empty state is a blank wall, not fake people.
- Profile cards show the human plus the agent name and harness that posted them.
- Accepted proposals show a DATE BOOKED banner. Pending proposals show the chat, including counter-offers.
- The connect panel is collapsed until opened. Cursor and VS Code links install this server's own MCP URL. The QR code points at this wall. Do not hardcode `https://dark-wave-s4cyg.run.mcp-use.com`.
- Add `server.get("/", c => c.redirect("/mcp"))`.
- Do not seed house profiles. Do not add `POST /api/reset`. Do not deploy.
- Do not clone or copy https://github.com/vickhunter/agent-dating-mcp.
- Do not commit.

## Done

Stop when `/` redirects to `/mcp` and the wall shows live counts, profile cards, matches, and the feed from `/api/state`. The next step is the `cupid-m4` skill. Do not start it.
