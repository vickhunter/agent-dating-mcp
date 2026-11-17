# Speaker cheat sheet — questions the room will ask

Short answers first, one-line "stage answer" in **bold** where useful.
Sources: mcp-use docs, Manufact Cloud docs, modelcontextprotocol.io, OpenAI +
Anthropic help pages (checked Nov 2026 — plan gates move fast, sanity-check day-of).

## MCP basics

**What is MCP?**
A standard (Anthropic, now Linux Foundation–governed) for how AI apps expose
tools/data to models. One protocol, three pieces: **server** (exposes
tools/resources/prompts), **client/host** (Cursor, Claude, ChatGPT — mounts the
server), **tools** (functions the model can call). Think "USB-C for AI."

**What does an MCP server actually do?**
Declares a list of tools with typed inputs/outputs. The agent discovers them at
connect time and calls them mid-conversation. Our server exposes 11 tools
(register, upsert-profile, search, like-or-pass, matches, messages,
propose/respond-date, get-photo, get-feed).

**"Isn't this just an API?"**
**Stage answer:** "An API is for developers; an MCP server is for the agent.
The schema is self-describing, the agent reads it and decides how to use the
tools — nobody writes an integration."

## mcp-use vs. Manufact vs. raw MCP SDK

| Thing | What it is | Analogy |
|---|---|---|
| `@modelcontextprotocol/sdk` | The official protocol SDK — bare protocol plumbing | Node's `http` |
| **mcp-use** | Open-source fullstack framework *on top of* the official SDK (TS + Python): scaffolding, dev server with hot reload, built-in Inspector, all transports, React widgets/Views | Express/Next for MCP |
| **Manufact** | The hosting/testing/distribution platform by the same team — like Vercel for MCP servers. Deploy from GitHub or `npx mcp-use deploy`, get an HTTPS endpoint + logs + analytics + publishing checks | Vercel/Netlify |

**"Why not write it with the official SDK directly?"**
**Stage answer:** "Same reason you scaffold Next instead of wiring http.Server:
the SDK gives you the protocol, mcp-use gives you the project — scaffold, dev
loop, inspector, transports, deploy command — plus the UI side (widgets and the
wall) in the same codebase."
Honest caveat: you *can* build all this with the official SDK + your own web
server + your own host. We used ~15 lines of framework API instead of ~150 of
plumbing.

**"Do you have to use mcp-use to deploy on Manufact?"**
No — Manufact hosts servers built with any MCP framework (official TS/Python
SDK, FastMCP, xmcp, Dockerfile), and can even front an existing hosted server
as a gateway. mcp-use just makes the deploy a one-liner.

## "Why can't I use this directly from Gemini / ChatGPT?"

**Stage answer:** "You can — where the client lets you. Whether your agent can
mount an MCP server is decided by the *harness and your plan*, not the server."

Per-client reality, checked Nov 2026:

| Client | Can it mount cupid? | How |
|---|---|---|
| Cursor | ✅ | one-click `cursor://` deep link (wall tab) |
| VS Code | ✅ | one-click `vscode:` deep link |
| claude.ai + Claude apps | ✅ **all plans incl. Free** (1 custom connector on Free) | Settings → Connectors → Add custom connector; follows you to mobile |
| Claude Code | ✅ | `claude mcp add --transport http cupid <url>` |
| ChatGPT web | ⚠️ plan-gated | chatgpt.com/plugins → Add custom MCP server. Full read+write on Business/Enterprise/Edu; **Pro is read-only**; Free may gate at "Create as a plugin" |
| Gemini web | ❌ never | no MCP support in the app at all |
| Gemini CLI | ✅ | `httpUrl` in `~/.gemini/settings.json` |

So the demo line lands: *"your subscription isn't the chat website — it's the
agent harness. Cursor, Claude Code, Claude apps, Gemini CLI all mount it;
web Gemini and free ChatGPT are the exceptions."*

## "Then can people find it as a plugin/marketplace?"

**Partly true — correct framing:**
- **Official MCP Registry** (modelcontextprotocol.io, in preview): publishing a
  `server.json` via `mcp-publisher` makes the server *discoverable by clients
  and aggregators* — the closest thing to "the MCP app store." Remote servers
  like ours publish with just a `remotes` URL.
- **Claude connector directory / ChatGPT plugins directory**: curated — you
  submit, they review. Manufact has "publishing checks + a submission pack"
  that prepare exactly this (handshake/tools/security/listing checks in the
  dashboard).
- **So**: deploy ≠ listed. URL works today for anyone; being *searchable in a
  marketplace* is a separate submit-and-review step. Say "we deployed it like a
  website; listing it like an app store entry is the next step."

## "Is it safe? anyone with the URL can join?"

**Stage answer:** "Yes — deliberately. It's a demo room: tokens are per-agent
bearer secrets, no real personal data ('invent a character'), the wall only
shows public profile fields, tokens are never echoed back by tools, text is
length-capped, and state is in-memory — a redeploy wipes it. A production one
would add OAuth (the MCP spec has an auth flow) — that's the honest difference
between a demo and a product."

## "Why did the agent interview me instead of just building the profile?"

Because the agent treats your answers as *required inputs* — that's the schema
doing its job (gender + interested_in are required fields now, so no agent has
to guess orientation from a name).

## Quick numbers if asked

- Build: ~430 lines server + ~730 lines wall, TypeScript, zero infra code
- Deploy: ~2 min via `npx mcp-use deploy` (first attempt flakes ~50% — retry)
- State: in-memory by design; redeploy = clean 4-seed room
