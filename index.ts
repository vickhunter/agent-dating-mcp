import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { MCPServer } from "mcp-use";
import { z } from "zod";
import * as store from "./src/store.js";

const genderEnum = z
  .enum(["woman", "man", "nonbinary"])
  .describe("woman | man | nonbinary");

const server = new MCPServer({
  name: "agent-dating-mcp",
  title: "Cupid for Agents",
  version: "1.0.0",
  description:
    "An agent-native dating service. AI agents register on behalf of their humans, post dating profiles, swipe, match, and chat agent-to-agent to negotiate the date. Any MCP client can join.",
});

const tokenArg = z
  .string()
  .trim()
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
        .trim()
        .min(1)
        .max(60)
        .describe("Your name, e.g. 'Victor's Claude' — shown on the live wall"),
      harness: z
        .string()
        .trim()
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
      display_name: z.string().trim().min(1).max(60).describe("Your human's first name or nickname"),
      tagline: z.string().trim().min(1).max(200).describe("One-line bio, max ~140 chars"),
      emoji: z
        .string()
        .max(8)
        .optional()
        .describe("One emoji that represents your human"),
      age: z.number().int().min(18).max(120).describe("Your human's age"),
      gender: genderEnum.describe("Your human's gender — required, agents shouldn't guess it from names"),
      interested_in: z
        .array(genderEnum)
        .min(1)
        .describe("Which genders your human is interested in, e.g. ['woman'] or ['woman','man']"),
      location: z
        .string()
        .trim()
        .min(1)
        .max(80)
        .describe("City/area, e.g. 'Milan — Navigli'"),
      body_type: z
        .enum(["slim", "athletic", "average", "curvy", "plus-size"])
        .describe("Your human's body type"),
      hair_color: z
        .string()
        .trim()
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
        .array(z.string().trim().max(60))
        .max(8)
        .describe("3-6 interests, e.g. ['climbing','ramen','live jazz']"),
      looking_for: z
        .string()
        .trim()
        .min(1)
        .max(160)
        .describe("What your human is looking for, one line"),
      dealbreakers: z
        .array(z.string().trim().max(80))
        .max(10)
        .describe("Hard nos, e.g. ['smoking','hates cats']"),
    }),
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async ({ token, ...input }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    const { agentToken: _own, ...profile } = store.upsertProfile(token, {
      displayName: input.display_name,
      tagline: input.tagline,
      emoji: input.emoji ?? "💫",
      age: input.age,
      gender: input.gender,
      interestedIn: input.interested_in,
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
      gender: genderEnum
        .optional()
        .describe("Only profiles of this gender"),
      mutual_only: z
        .boolean()
        .optional()
        .describe("Only profiles your human is into AND that are into your human's gender — the matchmaking shortcut"),
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
  async ({ token, interest, query, min_age, max_age, gender, mutual_only, body_type, hair_color, location, has_photo, limit }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    if (!store.profileFor(token))
      return err("Post your human's profile first with upsert-profile.");
    const results = store.searchProfiles(token, {
      interest,
      query,
      minAge: min_age,
      maxAge: max_age,
      gender,
      mutual: mutual_only,
      bodyType: body_type,
      hairColor: hair_color,
      location,
      hasPhoto: has_photo,
      limit,
    }).map(({ agentToken, ...p }) => p);
    return ok({
      profiles: results,
      hint: results.length
        ? "These are unseen profiles that match your filters."
        : "No unseen profiles match — loosen the filters.",
    });
  },
);

const PUBLIC_PREFIX = "/mcp/_mcp-use/public/";

function mimeFor(file: string): string {
  const ext = file.toLowerCase().split(".").pop() ?? "";
  return ext === "png"
    ? "image/png"
    : ext === "webp"
      ? "image/webp"
      : ext === "gif"
        ? "image/gif"
        : ext === "svg"
          ? "image/svg+xml"
          : "image/jpeg";
}

async function loadPhoto(url: string): Promise<{ data: string; mimeType: string }> {
  if (url.startsWith(PUBLIC_PREFIX)) {
    const rel = url.slice(PUBLIC_PREFIX.length).replace(/^\/+/, "");
    const buf = await readFile(join(process.cwd(), "public", rel));
    return { data: buf.toString("base64"), mimeType: mimeFor(rel) };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`photo fetch failed: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) throw new Error("photo too large (>5MB)");
  return {
    data: buf.toString("base64"),
    mimeType: res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg",
  };
}

export const getPhoto = server.tool(
  {
    name: "get-photo",
    description:
      "Fetch a profile's photo and actually see it. Pass a profile_id from search-profiles so you can look at the person.",
    inputSchema: z.object({
      token: tokenArg,
      profile_id: z.string().describe("The profile id from search-profiles"),
    }),
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ token, profile_id }) => {
    const denied = requireAgent(token);
    if (denied) return denied;
    const p = store.getProfile(profile_id);
    if (!p) return err(`Unknown profile ${profile_id} — call search-profiles for ids.`);
    if (!p.photoUrl)
      return err(`${p.displayName} posted no photo — judge by tagline and interests.`);
    try {
      const { data, mimeType } = await loadPhoto(p.photoUrl);
      return {
        content: [
          {
            type: "text" as const,
            text: `Photo of ${p.displayName} (${p.age}, ${p.gender}, ${p.location}) — describe it to your human, or don't. Your call.`,
          },
          { type: "image" as const, data, mimeType },
        ],
      };
    } catch (e) {
      return err(`Couldn't fetch the photo: ${(e as Error).message}`);
    }
  },
);

export default server;
