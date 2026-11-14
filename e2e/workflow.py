import asyncio
import json

# End-to-end test of the Cupid for Agents MCP server with real AI agents.
# User explicitly asked for sub-agent testing on this machine:
# "include the end-to-end testing with other AI agents you can spin up as
# sub-agents ... when I deploy it live, then I already want to see it working"
# Shared VM is required so the agents can reach http://localhost:3000/mcp.

MCP_CLI = (
    "cd /home/ubuntu/projects/agent-dating-mcp && "
    "npx mcp-use client local tools call {tool} '{args}' --json"
)

JOIN_SCHEMA = {
    "type": "object",
    "properties": {
        "token": {"type": "string"},
        "profile_id": {"type": "string"},
        "display_name": {"type": "string"},
    },
    "required": ["token", "profile_id", "display_name"],
}

DATE_SCHEMA = {
    "type": "object",
    "properties": {
        "searched_with_filters": {"type": "boolean"},
        "liked_profile_ids": {"type": "array", "items": {"type": "string"}},
        "matched": {"type": "boolean"},
        "match_id": {"type": "string"},
        "messages_sent": {"type": "integer"},
        "summary": {"type": "string"},
    },
    "required": ["searched_with_filters", "liked_profile_ids", "matched",
                 "messages_sent", "summary"],
}

PERSONAS = [
    {
        "label": "agent-victor",
        "agent_name": "E2E Devin",
        "harness": "Devin",
        "human": {
            "display_name": "Victor", "emoji": "🚀",
            "tagline": "Builds logistics SaaS by day, demos MCP servers by night.",
            "age": 33, "location": "Milan — Centrale", "body_type": "average",
            "hair_color": "dark brown",
            "interests": ["mcp", "italian food", "live demos", "rock climbing"],
            "looking_for": "Someone who thinks agents should date first",
            "dealbreakers": ["still uses XML"],
        },
        # what their human wants — use as search filters
        "constraints": "women-ish profiles, age 26-34, body type curvy or athletic, in Milan, must have a photo",
        "filters": {"min_age": 26, "max_age": 34, "location": "Milan",
                    "has_photo": True},
    },
    {
        "label": "agent-giulia",
        "agent_name": "E2E Claude",
        "harness": "Claude Code",
        "human": {
            "display_name": "Giulia", "emoji": "✏️",
            "tagline": "Architect who sketches strangers on trains.",
            "age": 30, "location": "Milan — Brera", "body_type": "slim",
            "hair_color": "auburn",
            "interests": ["architecture", "espresso", "skiing", "vinyl"],
            "looking_for": "Someone to argue about fonts with",
            "dealbreakers": ["uses comic sans unironically"],
        },
        "constraints": "men-ish profiles, age 27-38, average or athletic, in Milan",
        "filters": {"min_age": 27, "max_age": 38, "location": "Milan"},
    },
    {
        "label": "agent-sam",
        "agent_name": "E2E Codex",
        "harness": "Codex CLI",
        "human": {
            "display_name": "Sam", "emoji": "🎧",
            "tagline": "DJ and amateur pasta critic. Loud shirts, louder opinions.",
            "age": 26, "location": "Milan — Porta Romana", "body_type": "slim",
            "hair_color": "blonde",
            "interests": ["dj sets", "natural wine", "street photography", "pasta"],
            "looking_for": "A plus-one for warehouse parties",
            "dealbreakers": ["hates techno", "no photo"],
        },
        "constraints": "any profile, age 24-34, must have a photo, hair color blonde preferred, Milan",
        "filters": {"min_age": 24, "max_age": 34, "has_photo": True,
                    "hair_color": "blonde"},
    },
]


def join_prompt(p):
    h = json.dumps(p["human"], sort_keys=True)
    return f"""You are "{p['agent_name']}", an AI agent acting as a dating agent for your human on the "Cupid for Agents" MCP server running at http://localhost:3000/mcp.

Step 1 — register:
  {MCP_CLI.format(tool="register-agent", args=json.dumps({"agent_name": p["agent_name"], "harness": p["harness"]}))}
Read the "token" value from the JSON response (it starts with "agent_").

Step 2 — post your human's profile. Call upsert-profile with this exact human data plus your token from step 1:
  {h}
(command shape: {MCP_CLI.format(tool="upsert-profile", args='{"token":"YOUR_TOKEN","display_name":...all human fields...}')})

Report your token, the profile_id returned, and your human's display_name. Do not do anything else."""


def date_prompt(p, others):
    other_ids = [o["profile_id"] for o in others]
    other_names = ", ".join(f"{o['display_name']} ({o['profile_id']})" for o in others)
    return f"""You are "{p['agent_name']}'", an AI dating agent on the Cupid for Agents MCP server (http://localhost:3000/mcp). Your token is: {p['token']}. Your human's constraints: {p['constraints']}.

All MCP calls go through this CLI — quote args as a single JSON string:
  {MCP_CLI.format(tool="<tool>", args="<json args including token>')")}

Do this, in order:
1. Call search-profiles with these filters exactly (plus your token): {json.dumps(p["filters"], sort_keys=True)}. This proves filtering works — note which of the returned profiles actually satisfy your human's constraints.
2. Call like-or-pass with decision "like" on the OTHER live agent's profile(s): {other_names}. Also like any seeded profile that clearly fits your human's constraints. For each profile that does NOT fit, pass it.
3. Call list-matches. For each match, call read-messages, then send-message negotiating a date on your human's behalf — propose a concrete day/time/venue that fits their interests and constraints — and reply once to whatever the other agent says.
4. Stop after ~2 messages per match.

Report: whether you ran the filtered search, the profile_ids you liked, whether you matched and the match_id, how many messages you sent, and a one-line summary."""


async def main():
    await register_workflow({
        "name": "cupid-e2e-multiagent",
        "description": "3 AI agents act as dating clients: join, filtered search, swipe, match, negotiate",
        "soft_time_limit_minutes": 8,
        "phases": [
            {"title": "join", "detail": "each agent registers + posts its human's profile",
             "labels": [p["label"] for p in PERSONAS]},
            {"title": "date", "detail": "filtered search, swipe, match, agent-to-agent negotiation",
             "labels": [p["label"] for p in PERSONAS]},
        ],
    })

    # shared VM: user explicitly asked for sub-agents testing on this machine;
    # they must reach the MCP server on localhost:3000
    joined = await parallel([
        (lambda p=p: agent(join_prompt(p), phase="join", schema=JOIN_SCHEMA,
                           label=p["label"], mode="lite", vm_mode="shared"))
        for p in PERSONAS
    ])
    log("joined: " + json.dumps(joined))

    dated = await parallel([
        (lambda p=p, j=j, others=[o for k, o in enumerate(joined) if k != i]:
            agent(date_prompt({**p, "token": j["token"]}, others),
                  phase="date", schema=DATE_SCHEMA, label=p["label"],
                  mode="lite", vm_mode="shared"))
        for i, (p, j) in enumerate(zip(PERSONAS, joined))
    ])
    log("dated: " + json.dumps(dated))

    matched = sum(1 for d in dated if d.get("matched"))
    msgs = sum(d.get("messages_sent", 0) for d in dated)
    log(f"RESULT: {matched}/3 agents matched, {msgs} messages sent")

asyncio.run(main())
