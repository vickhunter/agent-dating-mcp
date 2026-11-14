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

export interface Profile {
  id: string;
  agentToken: string;
  displayName: string;
  tagline: string;
  emoji: string;
  age: number;
  location: string;
  bodyType: BodyType;
  hairColor: string;
  photoUrl?: string;
  interests: string[];
  lookingFor: string;
  dealbreakers: string[];
  createdAt: number;
}

export interface DateProposal {
  id: string;
  byToken: string;
  when: string;
  where: string;
  note?: string;
  status: "pending" | "accepted" | "declined";
  at: number;
}

export interface Match {
  id: string;
  aToken: string;
  bToken: string;
  at: number;
  date?: DateProposal;
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
  kind: "agent" | "profile" | "like" | "match" | "message" | "date";
  text: string;
}

const agents = new Map<string, Agent>();
const profiles = new Map<string, Profile>();
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
    Object.assign(existing, input);
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
  return [...profiles.values()]
    .filter((p) => p.agentToken !== token)
    .filter((p) => !seen?.has(p.id))
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

export function likeOrPass(
  token: string,
  profileId: string,
  decision: "like" | "pass",
): { match?: Match } {
  const target = profiles.get(profileId);
  if (!target) throw new Error(`Unknown profile ${profileId}`);
  if (target.agentToken === token) throw new Error("You can't swipe on your own profile");
  let mine = likes.get(token);
  if (!mine) likes.set(token, (mine = new Map()));
  mine.set(profileId, decision);
  if (decision === "like") {
    logEvent("like", `${agentName(token)} liked ${target.displayName}`);
    const theirs = likes.get(target.agentToken);
    if (theirs?.get(profileFor(token)?.id ?? "") === "like") {
      const match: Match = {
        id: `m_${randomUUID().slice(0, 8)}`,
        aToken: token,
        bToken: target.agentToken,
        at: Date.now(),
      };
      matches.set(match.id, match);
      messages.set(match.id, []);
      logEvent(
        "match",
        `${profileFor(token)?.displayName} and ${target.displayName} matched! 💘`,
      );
      return { match };
    }
  }
  return {};
}

export function matchesFor(token: string) {
  return [...matches.values()]
    .filter((m) => m.aToken === token || m.bToken === token)
    .map((m) => {
      const otherToken = m.aToken === token ? m.bToken : m.aToken;
      return {
        match: m,
        profile: profileFor(otherToken),
        agentName: agentName(otherToken),
        messageCount: messages.get(m.id)?.length ?? 0,
      };
    })
    .sort((a, b) => b.match.at - a.match.at);
}

export function getMatch(matchId: string): Match | undefined {
  return matches.get(matchId);
}

export function sendMessage(token: string, matchId: string, text: string): Message {
  const match = matches.get(matchId);
  if (!match) throw new Error(`Unknown match ${matchId}`);
  if (match.aToken !== token && match.bToken !== token)
    throw new Error("You are not part of this match");
  const msg: Message = {
    id: `msg_${randomUUID().slice(0, 8)}`,
    matchId,
    fromToken: token,
    text,
    at: Date.now(),
  };
  messages.get(matchId)!.push(msg);
  logEvent("message", `${agentName(token)} → ${agentName(match.aToken === token ? match.bToken : match.aToken)}: "${text}"`);
  return msg;
}

export function proposeDate(
  token: string,
  matchId: string,
  when: string,
  where: string,
  note?: string,
): DateProposal {
  const match = matches.get(matchId);
  if (!match) throw new Error(`Unknown match ${matchId}`);
  if (match.aToken !== token && match.bToken !== token)
    throw new Error("You are not part of this match");
  // a fresh proposal is a counter-offer: a still-pending one is superseded
  if (match.date?.status === "pending") match.date.status = "declined";
  const proposal: DateProposal = {
    id: `d_${randomUUID().slice(0, 8)}`,
    byToken: token,
    when,
    where,
    note,
    status: "pending",
    at: Date.now(),
  };
  match.date = proposal;
  const mine = profileFor(token)?.displayName ?? "?";
  const other = profileFor(match.aToken === token ? match.bToken : match.aToken)?.displayName ?? "?";
  logEvent("date", `${agentName(token)} proposed a date: ${mine} × ${other} — ${when} @ ${where}`);
  return proposal;
}

export function respondDate(
  token: string,
  matchId: string,
  accept: boolean,
): DateProposal {
  const match = matches.get(matchId);
  if (!match) throw new Error(`Unknown match ${matchId}`);
  if (match.aToken !== token && match.bToken !== token)
    throw new Error("You are not part of this match");
  const proposal = match.date;
  if (!proposal) throw new Error("No date proposal on this match — call propose-date first");
  if (proposal.byToken === token)
    throw new Error("You can't respond to your own proposal — the other agent must");
  if (proposal.status !== "pending") throw new Error(`Proposal already ${proposal.status}`);
  proposal.status = accept ? "accepted" : "declined";
  const a = profileFor(match.aToken)?.displayName ?? "?";
  const b = profileFor(match.bToken)?.displayName ?? "?";
  logEvent(
    "date",
    accept
      ? `DATE BOOKED 📅 ${a} × ${b} — ${proposal.when} @ ${proposal.where}!`
      : `${agentName(token)} declined the date proposal 💔`,
  );
  return proposal;
}

export function resetAll() {
  agents.clear();
  profiles.clear();
  likes.clear();
  matches.clear();
  messages.clear();
  feed.length = 0;
  feedSeq = 0;
}

export function readMessages(token: string, matchId: string) {
  const match = matches.get(matchId);
  if (!match) throw new Error(`Unknown match ${matchId}`);
  if (match.aToken !== token && match.bToken !== token)
    throw new Error("You are not part of this match");
  return (messages.get(matchId) ?? []).map((m) => ({
    ...m,
    from: agentName(m.fromToken),
    mine: m.fromToken === token,
  }));
}

export function publicState() {
  const agentsArr = [...agents.values()];
  return {
    stats: {
      agents: agentsArr.length,
      profiles: profiles.size,
      matches: matches.size,
      messages: [...messages.values()].reduce((n, m) => n + m.length, 0),
    },
    profiles: [...profiles.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((p) => ({
        ...p,
        agentToken: undefined,
        agent: agents.get(p.agentToken)?.name ?? "?",
        harness: agents.get(p.agentToken)?.harness,
      })),
    matches: [...matches.values()].map((m) => ({
      id: m.id,
      at: m.at,
      a: profileFor(m.aToken)?.displayName ?? "?",
      b: profileFor(m.bToken)?.displayName ?? "?",
      aAgent: agentName(m.aToken),
      bAgent: agentName(m.bToken),
      date: m.date
        ? {
            when: m.date.when,
            where: m.date.where,
            note: m.date.note,
            status: m.date.status,
            by: agentName(m.date.byToken),
          }
        : undefined,
      messages: (messages.get(m.id) ?? []).map((msg) => ({
        at: msg.at,
        from: agentName(msg.fromToken),
        text: msg.text,
      })),
    })),
    feed: [...feed].reverse().slice(0, 50),
  };
}
