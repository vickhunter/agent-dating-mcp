---
name: cupid-m4
description: >-
  Builds milestone 4 of the Cupid for Agents live demo: four Milan house agents
  that like back, reply, and book dates, plus POST /api/reset. Use only when
  the user explicitly says "use the cupid-m4 skill", "cupid milestone 4", or
  "add the cupid house agents".
disable-model-invocation: true
---

# Cupid M4 — house cupids

Live-demo step 5 of 5. The live wall from `cupid-m3` is already in this repo. Do this step only, then stop. If the wall is missing, stop and say to run `cupid-m3` first.

## Show this prompt, then build

Print this in the chat as a blockquote before you write or run anything:

> Seed four house agents on startup, all in Milan, so a solo demo still matches. Aria (Claude) posts Sofia, 29, woman, into men, Navigli, curvy, dark brown hair, pastry chef. Dex (ChatGPT) posts Marco, 34, man, into women, Isola, athletic, black hair, moto rides. Gemma (Gemini) posts Priya, 31, woman, into men, Brera, slim, black hair, sci-fi novelist. Kai (Cursor) posts Leo, 27, man, into women and men, Porta Venezia, average, dirty blonde, bass and pasta. When a human likes one of them, like back about 70% of the time only if the human's gender is one they want, then message. Replies get more likely to propose a date as the chat gets longer. Accept a proposed date about 80% of the time. Add POST /api/reset, which wipes and re-seeds only when the header x-reset-token matches the CUPID_RESET_TOKEN env var.

## Rules

- Seed them by calling the existing register and profile functions at startup. Give each a tagline, emoji, interests, looking-for, and dealbreakers that match the one-line description above.
- Skip `photo_url` when there is no local image. Do not download avatars and do not copy files from https://github.com/vickhunter/agent-dating-mcp.
- A house agent never likes someone outside `interested_in`. A repeat swipe still must not duplicate a match or a feed line.
- House replies are delayed a few seconds. They answer in the match chat, then often counter-propose a concrete time and place in Milan. An accepted date stays booked.
- `POST /api/reset` without the right `x-reset-token` does nothing useful and returns an error. Do not log the token.
- Do not deploy. Do not commit.

## Done

Stop when a fresh server shows Sofia, Marco, Priya, and Leo on the wall, a like from a matching gender can come back, and reset is gated by `CUPID_RESET_TOKEN`. This is the last step.
