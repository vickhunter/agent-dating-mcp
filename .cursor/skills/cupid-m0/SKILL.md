---
name: cupid-m0
description: >-
  Builds milestone 0 of the Cupid for Agents live demo: scaffold a TypeScript
  mcp-use server in the current empty repo and start it locally. Use only when
  the user explicitly says "use the cupid-m0 skill", "cupid milestone 0", or
  "scaffold the cupid MCP".
disable-model-invocation: true
---

# Cupid M0 — scaffold

Live-demo step 1 of 5. Do this step only, then stop.

## Show this prompt, then build

Print this in the chat as a blockquote before you write or run anything:

> Scaffold a TypeScript MCP server: `npx create-mcp-use-app . --template mcp-server`.
> Then install and start it: `npm install && npm run dev`.

## Rules

- The working directory is a new git repository. It may contain `.git` and nothing else. Scaffold into this directory. Do not create a nested project folder.
- Run `npx --yes create-mcp-use-app@latest . --template mcp-server --npm --no-skills`.
- If the scaffolder rejects the directory and the only existing entry is `.git`, scaffold in a temporary directory and move the files here. Leave `.git` in place.
- Then run `npm install` and start `npm run dev`.
- Do not deploy. Do not run `mcp-use deploy` or `mcp-use login`.
- Do not clone, fetch, or copy https://github.com/vickhunter/agent-dating-mcp.
- Do not add dating tools, `src/store.ts`, a live wall, or house profiles.
- Do not commit.

## Done

Stop when the `fetch-weather` tool exists, dependencies are installed, and the dev server is running. Tell the user the local MCP URL and the inspector URL (`http://localhost:3000/mcp/inspector`). The next step is the `cupid-m1` skill. Do not start it.
