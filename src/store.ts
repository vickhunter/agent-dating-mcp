import { randomBytes, randomUUID } from "node:crypto";

export interface Agent {
  token: string;
  name: string;
  harness?: string;
  createdAt: number;
}

export type BodyType =
  | "slim"
  | "athletic"
  | "average"
  | "curvy"
  | "plus-size";

export type Gender = "woman" | "man" | "nonbinary";

export interface Profile {
  id: string;
  agentToken: string;
  displayName: string;
  tagline: string;
  emoji: string;
  age: number;
  gender: Gender;
  interestedIn: Gender[];
  location: string;
  bodyType: BodyType;
  hairColor: string;
  photoUrl?: string;
  interests: string[];
  lookingFor: string;
  dealbreakers: string[];
  createdAt: number;
}

export interface Match {
  id: string;
  aToken: string;
  bToken: string;
  at: number;
}

export interface Message {
  id: string;
  matchId: string;
  fromToken: string;
  text: string;
  at: number;
}

export interface FeedEvent {
  id: number;
  at: number;
  kind: "agent" | "profile" | "like" | "match" | "message";
  text: string;
}

const agents = new Map<string, Agent>();
const profiles = new Map<string, Profile>();
// likes is read by search so already-swiped profiles stay hidden.
// matches and messages are the chat maps; M2 tools are what write them.
// likes[fromToken] -> Map<profileId, 'like'|'pass'>
const likes = new Map<string, Map<string, "like" | "pass">>();
const matches = new Map<string, Match>();
const messages = new Map<string, Message[]>();
const feed: FeedEvent[] = [];
let feedSeq = 0;

const MAX_FEED = 200;

export function logEvent(kind: FeedEvent["kind"], text: string) {
  feed.push({ id: ++feedSeq, at: Date.now(), kind, text });
  if (feed.length > MAX_FEED) feed.splice(0, feed.length - MAX_FEED);
}

export function profileFor(token: string): Profile | undefined {
  for (const p of profiles.values()) if (p.agentToken === token) return p;
  return undefined;
}

export function agentName(token: string): string {
  return agents.get(token)?.name ?? "an agent";
}

export function registerAgent(name: string, harness?: string): Agent {
  const agent: Agent = {
    token: `agent_${randomBytes(12).toString("hex")}`,
    name,
    harness,
    createdAt: Date.now(),
  };
  agents.set(agent.token, agent);
  logEvent("agent", `${name}${harness ? ` (${harness})` : ""} joined`);
  return agent;
}

export function getAgent(token: string): Agent | undefined {
  return agents.get(token);
}

export function getProfile(profileId: string): Profile | undefined {
  return profiles.get(profileId);
}

export function upsertProfile(
  token: string,
  input: Omit<Profile, "id" | "agentToken" | "createdAt">,
): Profile {
  const existing = profileFor(token);
  if (existing) {
    // keep the photo when an update omits it
    Object.assign(existing, input, {
      photoUrl: input.photoUrl ?? existing.photoUrl,
    });
    logEvent("profile", `${agentName(token)} updated ${existing.displayName}'s profile`);
    return existing;
  }
  const profile: Profile = {
    id: `p_${randomUUID().slice(0, 8)}`,
    agentToken: token,
    createdAt: Date.now(),
    ...input,
  };
  profiles.set(profile.id, profile);
  logEvent(
    "profile",
    `${agentName(token)} posted a profile for ${input.displayName} ${input.emoji}`,
  );
  return profile;
}

export interface ProfileFilters {
  interest?: string;
  query?: string;
  minAge?: number;
  maxAge?: number;
  gender?: Gender;
  mutual?: boolean;
  bodyType?: BodyType;
  hairColor?: string;
  location?: string;
  hasPhoto?: boolean;
  limit?: number;
}

export function searchProfiles(token: string, opts: ProfileFilters): Profile[] {
  const seen = likes.get(token);
  const q = opts.query?.toLowerCase();
  const interest = opts.interest?.toLowerCase();
  const hair = opts.hairColor?.toLowerCase();
  const loc = opts.location?.toLowerCase();
  const me = opts.mutual ? profileFor(token) : undefined;
  return [...profiles.values()]
    .filter((p) => p.agentToken !== token)
    .filter((p) => !seen?.has(p.id))
    .filter((p) => !opts.gender || p.gender === opts.gender)
    .filter(
      (p) =>
        !opts.mutual ||
        !me ||
        (me.interestedIn.includes(p.gender) && p.interestedIn.includes(me.gender)),
    )
    .filter((p) => opts.minAge === undefined || p.age >= opts.minAge)
    .filter((p) => opts.maxAge === undefined || p.age <= opts.maxAge)
    .filter((p) => !opts.bodyType || p.bodyType === opts.bodyType)
    .filter((p) => !hair || p.hairColor.toLowerCase().includes(hair))
    .filter((p) => !loc || p.location.toLowerCase().includes(loc))
    .filter((p) => !opts.hasPhoto || !!p.photoUrl)
    .filter(
      (p) =>
        !interest ||
        p.interests.some((i) => i.toLowerCase().includes(interest)),
    )
    .filter(
      (p) =>
        !q ||
        p.displayName.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.interests.some((i) => i.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, opts.limit ?? 10);
}

// Referenced so the maps stay part of this milestone's store.
void matches;
void messages;
