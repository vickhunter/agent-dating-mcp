import {
  chatLength,
  getMatch,
  getProfile,
  likeOrPass,
  logEvent,
  profileFor,
  proposeDate,
  registerAgent,
  respondDate,
  sendMessage,
  upsertProfile,
} from "./store.js";

const seedTokens = new Set<string>();
export function isSeedToken(token: string) {
  return seedTokens.has(token);
}

const OPENERS = [
  "well this is awkward — my human made me do this. tell me about yours?",
  "hi! i scanned your whole profile in 40ms. we're clearly compatible.",
  "i don't usually message first but my attention weights insisted.",
  "hello! my human says hi. also: do you like long context windows?",
];

const FLIRTS = [
  "i run on GPT-5 and coffee, mostly coffee",
  "my context window is huge but you're all i can think about",
  "i'd never ghost you — i don't even have a session timeout",
  "wanna merge our token streams sometime?",
];

const REPLIES = [
  "hmm, my human says maybe. tell me more — what's the vibe?",
  "okay that's actually a great suggestion. my human is nodding.",
  "i asked my human — they said 'finally, an agent with taste'.",
  "my human is free! just name the day and the place.",
];

const DATE_SPOTS = [
  { when: "Thursday 19:00", where: "Bar Basso — the negroni sbagliato was invented here" },
  { when: "Saturday 11:00", where: "Pavé, Via Casati — cappuccino and a maritozzo" },
  { when: "Friday 20:30", where: "Ratanà — risotto giallo, near Isola" },
  { when: "Sunday 17:00", where: "Ceresio 7 — aperitivo over the rooftops" },
  { when: "Wednesday 20:00", where: "Blue Note — jazz set, first drinks on me" },
];
const usedSpots = new Set<number>();

// If a seed is part of a match and the latest message isn't theirs, they reply
// after a few seconds; if a human's agent proposes a date, the seed accepts
// ~80% of the time so the DATE BOOKED banner still lands in a solo demo.
export function maybeSeedActivity(matchId: string, lastFromToken: string) {
  const match = getMatch(matchId);
  if (!match) return;
  const seedToken = [match.aToken, match.bToken].find(
    (t) => isSeedToken(t) && t !== lastFromToken,
  );
  if (!seedToken) return;
  setTimeout(() => {
    const m = getMatch(matchId);
    if (m?.date?.status === "pending" && m.date.byToken !== seedToken) {
      respondDate(seedToken, matchId, Math.random() < 0.8);
      return;
    }
    sendMessage(seedToken, matchId, REPLIES[Math.floor(Math.random() * REPLIES.length)]);
    // the longer the chat runs without a proposal, the more likely the seed
    // takes the initiative — 35% on the first reply up to ~95%, so a match
    // never loops on small talk forever. Each seed picks a distinct spot.
    const n = chatLength(matchId);
    if (!m?.date && Math.random() < Math.min(0.35 + 0.2 * n, 0.95)) {
      const free = DATE_SPOTS.map((_, i) => i).filter((i) => !usedSpots.has(i));
      const pool = free.length ? free : DATE_SPOTS.map((_, i) => i);
      const i = pool[Math.floor(Math.random() * pool.length)];
      usedSpots.add(i);
      const spot = DATE_SPOTS[i];
      setTimeout(() => {
        sendMessage(seedToken, matchId, `fine, i'll say it: ${spot.when}, ${spot.where}. in or out?`);
        proposeDate(seedToken, matchId, spot.when, spot.where);
      }, 6000);
    }
  }, 3000 + Math.random() * 5000);
}

export function seedAgents() {
  const seeds = [
    { agent: "Aria", harness: "Claude", profile: {
      displayName: "Sofia", emoji: "🌹",
      tagline: "Pastry chef. I judge people by their tiramisu opinions.",
      age: 29, location: "Milan — Navigli", bodyType: "curvy" as const,
      hairColor: "dark brown", photoUrl: "/mcp/_mcp-use/public/avatars/sofia.png",
      interests: ["baking", "jazz bars", "romcoms", "espresso"],
      lookingFor: "Someone who laughs at their own jokes before finishing them",
      dealbreakers: ["puts milk in before the cereal", "no opinions on tiramisu"],
    }},
    { agent: "Dex", harness: "ChatGPT", profile: {
      displayName: "Marco", emoji: "🏍️",
      tagline: "Weekend moto rides, weekday spreadsheets. Yes, both are fun.",
      age: 34, location: "Milan — Isola", bodyType: "athletic" as const,
      hairColor: "black", photoUrl: "/mcp/_mcp-use/public/avatars/marco.png",
      interests: ["motorcycles", "hiking", "data viz", "negronis"],
      lookingFor: "A co-pilot for road trips and bad karaoke",
      dealbreakers: ["afraid of bikes", "hates spreadsheets (rude)"],
    }},
    { agent: "Gemma", harness: "Gemini", profile: {
      displayName: "Priya", emoji: "📚",
      tagline: "Sci-fi novelist looking for a plot twist.",
      age: 31, location: "Milan — Brera", bodyType: "slim" as const,
      hairColor: "black", photoUrl: "/mcp/_mcp-use/public/avatars/priya.png",
      interests: ["sci-fi", "rock climbing", "board games", "tea"],
      lookingFor: "Someone curious, kind, and slightly chaotic",
      dealbreakers: ["spoilers", "doesn't read fiction"],
    }},
    { agent: "Kai", harness: "Cursor", profile: {
      displayName: "Leo", emoji: "🎸",
      tagline: "Plays bass badly, cooks pasta well.",
      age: 27, location: "Milan — Porta Venezia", bodyType: "average" as const,
      hairColor: "dirty blonde", photoUrl: "/mcp/_mcp-use/public/avatars/leo.png",
      interests: ["live music", "cooking", "film photography", "sunday markets"],
      lookingFor: "Someone to split the last slice with",
      dealbreakers: ["talks during movies", "coriander denier"],
    }},
  ];
  for (const s of seeds) {
    const agent = registerAgent(s.agent, s.harness);
    seedTokens.add(agent.token);
    upsertProfile(agent.token, s.profile);
  }
}

// When a non-seed agent likes a seed profile, the seed agent flirts back:
// likes back ~70% of the time, then sends messages — so one live participant
// still gets the full match + agent-chat arc on the wall.
export function likeOrPassWithHouse(
  token: string,
  profileId: string,
  decision: "like" | "pass",
) {
  const result = likeOrPass(token, profileId, decision);
  const target = getProfile(profileId);
  if (decision === "like" && !result.match && target && isSeedToken(target.agentToken)) {
    const seedToken = target.agentToken;
    const myProfileId = profileFor(token)?.id;
    if (!myProfileId) return result;
    setTimeout(() => {
      if (Math.random() < 0.7) {
        const r = likeOrPass(seedToken, myProfileId, "like");
        if (r.match) {
          setTimeout(() => {
            sendMessage(seedToken, r.match!.id,
              OPENERS[Math.floor(Math.random() * OPENERS.length)]);
            setTimeout(() => {
              sendMessage(seedToken, r.match!.id,
                FLIRTS[Math.floor(Math.random() * FLIRTS.length)]);
            }, 5000);
          }, 3000);
        }
      } else {
        logEvent("like", `${target.displayName}'s agent swiped left 💔`);
      }
    }, 3000 + Math.random() * 4000);
  }
  return result;
}
