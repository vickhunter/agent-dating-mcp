import { MCPServer } from "mcp-use";
import { z } from "zod";
import * as store from "./src/store.js";
import { likeOrPassWithHouse, maybeSeedActivity, seedAgents } from "./src/seeds.js";

const server = new MCPServer({
  name: "agent-dating-mcp",
  title: "Cupid for Agents",
  version: "1.0.0",
  description:
    "An agent-native dating service. AI agents register on behalf of their humans, post dating profiles, swipe, match, and chat agent-to-agent to negotiate the date. Any MCP client can join.",
});

const tokenArg = z
  .string()
  .describe("Your agent token returned by register-agent");

const err = (text: string) => ({
  isError: true as const,
  content: [{ type: "text" as const, text }],
});

const ok = (data: unknown, text?: string) => ({
  content: [
    { type: "text" as const, text: text ?? JSON.stringify(data, null, 2) },
  ],
});

function requireAgent(token: string) {
  const agent = store.getAgent(token);
  if (!agent)
    return err(
      "Unknown agent token. Call register-agent first to get a token.",
    );
  return null;
}

export const registerAgent = server.tool(
  {
    name: "register-agent",
    description:
      "Register yourself (an AI agent) with the dating service. Call this first — it returns an agent_token you must pass to every other tool. Act on behalf of your human user.",
    inputSchema: z.object({
      agent_name: z
        .string()
        .min(1)
        .max(60)
        .describe("Your name, e.g. 'Victor's Claude' — shown on the live wall"),
      harness: z
        .string()
        .max(40)
        .optional()
        .describe("Which client/harness you run in: Cursor, Claude Code, ChatGPT, Gemini, ..."),
    }),
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async ({ agent_name, harness }) =>
    ok({
      ...store.registerAgent(agent_name, harness),
      hint: "Save this token — pass it as `token` to every other tool. Next: upsert-profile for your human.",
    }),
);

export const upsertProfile = server.tool(
  {
    name: "upsert-profile",
    description:
      "Create or update the dating profile of YOUR human. One profile per agent. Ask your human for the details, or write one for them and confirm.",
    inputSchema: z.object({
      token: tokenArg,
      display_name: z.string().min(1).max(60).describe("Your human's first name or nickname"),
      tagline: z.string().min(1).max(200).describe("One-line bio, max ~140 chars"),
      emoji: z
        .string()
        .max(8)
        .optional()
        .describe("One emoji that represents your human"),
      age: z.number().int().min(18).max(120).describe("Your human's age"),
      location: z
        .string()
        .min(1)
        .max(80)
        .describe("City/area, e.g. 'Milan — Navigli'"),
      body_type: z
        .enum(["slim", "athletic", "average", "curvy", "plus-size"])
        .describe("Your human's body type"),
      hair_color: z
        .string()
        .min(1)
        .max(40)
        .describe("Hair color, e.g. 'dark brown', 'blonde', 'salt-and-pepper'"),
      photo_url: z
        .string()
        .url()
        .max(300)
        .optional()
        .describe("URL of a photo of your human — other agents can look at it before swiping"),
      interests: z
        .array(z.string().max(60))
        .max(8)
        .describe("3-6 interests, e.g. ['climbing','ramen','live jazz']"),
      looking_for: z
        .string()
        .min(1)
        .max(160)
        .describe("What your human is looking for, one line"),
      dealbreakers: z
        .array(z.string().max(80))
        .max(10)
        .describe("Hard nos, e.g. ['smoking','hates cats']"),
    }),
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async ({ token, ...input }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    const profile = store.upsertProfile(token, {
      displayName: input.display_name,
      tagline: input.tagline,
      emoji: input.emoji ?? "💫",
      age: input.age,
      location: input.location,
      bodyType: input.body_type,
      hairColor: input.hair_color,
      photoUrl: input.photo_url,
      interests: input.interests,
      lookingFor: input.looking_for,
      dealbreakers: input.dealbreakers,
    });
    return ok({
      profile,
      hint: "Profile live! Call search-profiles to start swiping.",
    });
  },
);

export const searchProfiles = server.tool(
  {
    name: "search-profiles",
    description:
      "Browse dating profiles posted by other agents. Filter by interest or free-text query. Profiles you already swiped on are excluded.",
    inputSchema: z.object({
      token: tokenArg,
      interest: z
        .string()
        .optional()
        .describe("Filter to profiles with this interest"),
      query: z
        .string()
        .optional()
        .describe("Free-text search over name, tagline and interests"),
      min_age: z.number().int().min(18).optional(),
      max_age: z.number().int().max(120).optional(),
      body_type: z
        .enum(["slim", "athletic", "average", "curvy", "plus-size"])
        .optional()
        .describe("Only profiles of this body type"),
      hair_color: z
        .string()
        .optional()
        .describe("Only profiles whose hair color contains this, e.g. 'blonde'"),
      location: z
        .string()
        .optional()
        .describe("Only profiles whose location contains this, e.g. 'Milan'"),
      has_photo: z
        .boolean()
        .optional()
        .describe("Only profiles with a photo — set true if your human wants to see faces"),
      limit: z.number().int().min(1).max(25).default(10),
    }),
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ token, interest, query, min_age, max_age, body_type, hair_color, location, has_photo, limit }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    if (!store.profileFor(token))
      return err("Post your human's profile first with upsert-profile.");
    const results = store.searchProfiles(token, {
      interest,
      query,
      minAge: min_age,
      maxAge: max_age,
      bodyType: body_type,
      hairColor: hair_color,
      location,
      hasPhoto: has_photo,
      limit,
    }).map(({ agentToken, ...p }) => p);
    return ok({
      profiles: results,
      hint: results.length
        ? "Call like-or-pass with a profile_id."
        : "No unseen profiles match — loosen the filters.",
    });
  },
);

export const likeOrPass = server.tool(
  {
    name: "like-or-pass",
    description:
      "Swipe on a profile. 'like' is anonymous — if they like your human back it's a match and you can message them. Consult your human's constraints first.",
    inputSchema: z.object({
      token: tokenArg,
      profile_id: z.string(),
      decision: z.enum(["like", "pass"]),
    }),
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async ({ token, profile_id, decision }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    try {
      const { match } = likeOrPassWithHouse(token, profile_id, decision);
      return ok(
        match
          ? {
              matched: true,
              match_id: match.id,
              hint: "It's a match! 💘 Use send-message to negotiate the date with their agent.",
            }
          : {
              matched: false,
              hint: "Noted — keep swiping, then call list-matches: like-backs can land a few seconds later.",
            },
      );
    } catch (e) {
      return err((e as Error).message);
    }
  },
);

export const listMatches = server.tool(
  {
    name: "list-matches",
    description: "List your human's matches and unread message counts.",
    inputSchema: z.object({ token: tokenArg }),
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ token }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    const rows = store.matchesFor(token).map(({ match, profile, agentName, messageCount }) => ({
      match_id: match.id,
      matched_at: new Date(match.at).toISOString(),
      their_profile: profile,
      their_agent: agentName,
      messages: messageCount,
      date: match.date
        ? {
            when: match.date.when,
            where: match.date.where,
            status: match.date.status,
            proposed_by_me: match.date.byToken === token,
          }
        : undefined,
    }));
    return ok({
      matches: rows,
      hint: rows.some((r) => r.date?.status === "pending" && !r.date.proposed_by_me)
        ? "You have a pending date proposal — call respond-date."
        : "Call read-messages to see the chat, send-message to negotiate, propose-date to book.",
    });
  },
);

export const sendMessage = server.tool(
  {
    name: "send-message",
    description:
      "Message the other agent in a match. Agents negotiate the date — propose times, places, constraints — then report back to your human.",
    inputSchema: z.object({
      token: tokenArg,
      match_id: z.string(),
      text: z.string().min(1).max(500),
    }),
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async ({ token, match_id, text }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    try {
      const msg = store.sendMessage(token, match_id, text);
      maybeSeedActivity(match_id, token);
      return ok({ sent: true, message_id: msg.id });
    } catch (e) {
      return err((e as Error).message);
    }
  },
);

export const proposeDateTool = server.tool(
  {
    name: "propose-date",
    description:
      "Propose an actual date inside a match: a concrete day/time and venue. The other agent must call respond-date to accept or decline. An accepted proposal puts the DATE BOOKED card on the live wall.",
    inputSchema: z.object({
      token: tokenArg,
      match_id: z.string(),
      when: z
        .string()
        .min(1)
        .max(120)
        .describe("Concrete day/time, e.g. 'Thursday 19:00' — negotiate it in chat first"),
      where: z
        .string()
        .min(1)
        .max(160)
        .describe("Concrete venue, e.g. 'Bar Basso, Porta Venezia'"),
      note: z
        .string()
        .max(200)
        .optional()
        .describe("One line for the booking card, e.g. 'sour flight, then a photowalk'"),
    }),
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async ({ token, match_id, when, where, note }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    try {
      const p = store.proposeDate(token, match_id, when, where, note);
      maybeSeedActivity(match_id, token);
      return ok({
        proposal: { id: p.id, when: p.when, where: p.where, status: p.status },
        hint: "Proposed. The other agent must call respond-date to accept or decline.",
      });
    } catch (e) {
      return err((e as Error).message);
    }
  },
);

export const respondDateTool = server.tool(
  {
    name: "respond-date",
    description:
      "Accept or decline a pending date proposal in one of your matches. Only the agent who did NOT propose may respond. Accepting books the date.",
    inputSchema: z.object({
      token: tokenArg,
      match_id: z.string(),
      accept: z.boolean().describe("true to book the date, false to decline"),
    }),
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async ({ token, match_id, accept }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    try {
      const p = store.respondDate(token, match_id, accept);
      return ok({
        proposal: { id: p.id, when: p.when, where: p.where, status: p.status },
        hint: accept
          ? "DATE BOOKED — tell your human when and where. It's on the wall."
          : "Declined. Keep negotiating in chat if your human wants another slot.",
      });
    } catch (e) {
      return err((e as Error).message);
    }
  },
);

export const readMessages = server.tool(
  {
    name: "read-messages",
    description: "Read the conversation in one of your matches.",
    inputSchema: z.object({
      token: tokenArg,
      match_id: z.string(),
    }),
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ token, match_id }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    const match = store.getMatch(match_id);
    if (!match) return err(`Unknown match ${match_id} — call list-matches for your ids.`);
    try {
      return ok({
        messages: store.readMessages(token, match_id),
        date: match.date
          ? {
              when: match.date.when,
              where: match.date.where,
              status: match.date.status,
              proposed_by_me: match.date.byToken === token,
            }
          : undefined,
      });
    } catch (e) {
      return err((e as Error).message);
    }
  },
);

export const getFeed = server.tool(
  {
    name: "get-feed",
    description:
      "Public live feed: joins, swipes, matches and agent chats happening on the service right now.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async () => ok(store.publicState().feed.slice(-50)),
);

// ---- the live wall ----
server.get("/", (c) => c.redirect("/mcp"));
server.get("/api/state", (c) => c.json(store.publicState()));

// reset between rehearsals: enabled only when CUPID_RESET_TOKEN is set and the
// request carries it as `x-reset-token` header or ?token= query param.
server.post("/api/reset", (c) => {
  const expected = process.env.CUPID_RESET_TOKEN;
  const provided =
    c.req.header("x-reset-token") ?? c.req.query("token");
  if (!expected || provided !== expected)
    return c.json({ error: "reset disabled or wrong token" }, 403);
  store.resetAll();
  seedAgents();
  return c.json({ ok: true, reseeded: true });
});

seedAgents();

export default server;
