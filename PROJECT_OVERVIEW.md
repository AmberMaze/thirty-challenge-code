# File usage

- Use this file to understand the project. Update as we go along. Turn old info into comments, never delete text.
- Treat ️ "Approved Changes" at the end of the note As a checklist list.
- Put a "✅" next to completed tasks.

---

## 1 Purpose

Help build and iterate on a replayable, club‑themed football quiz web app using React 18, Vite 5, Tailwind 3, and Supabase realtime.

---

## 2 MVP Definition

| Area               | Must‑have for first public demo                                                                                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lobby              | Create/join game (Host, 2 players)                                                                                                                                                                                                                                                                               |
| Quiz Flow          | Sequential segments (see _Quiz Structure.md_) with manual “Next” button that only the host can press                                                                                                                                                                                                             |
| Basic Scoring      | Points tally per rules in QUIZ_STRUCTURE.md ; winner banner                                                                                                                                                                                                                                                      |
| Visuals            | Two player panels + host panel, club colour theme picker or team poster                                                                                                                                                                                                                                          |
| Tech               | Works offline as static site; Nets out at < 200 kB JS                                                                                                                                                                                                                                                            |
| Questions language | Will be in arabic                                                                                                                                                                                                                                                                                                |
| Quiz Style         | QUIZ_STRUCTURE.md                                                                                                                                                                                                                                                                                                |
| Host view          | I can see the questions and answers but they cant (I will read them at loud)                                                                                                                                                                                                                                     |
| Segments           | Some segments require a player to press a bell in order to answer first. Once clicked, it will be shown who clicked the bell (player name) then 10 seconds countdown starts, if timer finishes without answer the question move to the other player. to indicate that there wasnt an answer I can press a button |

---

## 3 Chosen Tech Stack (Why & Version Pins)

|                   |                                         |                                            |                              |
| ----------------- | --------------------------------------- | ------------------------------------------ | ---------------------------- |
| Layer             | Tool                                    | Rationale                                  | Version                      |
| Build & Framework | **React 19 + Vite 7**                   | Ubiquitous ecosystem, fast HMR             |                              |
| Styling           | **Tailwind 3.4**                        | Rapid theming, easy dark mode              | tailwindcss@3.4.0            |
| Animations        | **Framer Motion 12**                    | Declarative micro‑interactions             | framer-motion@12.0.0         |
| Backend           | **Supabase**                            | Realtime channels & Postgres with zero ops | @supabase/supabase-js@2.19.0 |
| Video Chat        | **daily.co**                            | free tier                                  |                              |
| Testing           | **Vitest 2 + React Testing Library 15** | Vite‑native, zero config                   | vitest@2.4.1                 |

Why not Svelte/Next? See _Appendix A_.

---

## 4 Repo Skeleton (Original structure/not used anymore)

Can be modified by agent/gpt.

```
/                     # repo root
│
├─ src/
│   ├─ api/           # Supabase helpers
│   ├─ components/    # UI widgets
│   ├─ hooks/         # custom hooks
│   ├─ pages/         # route entries
│   ├─ segments/      # segment-specific logic
│   └─ themes/        # club palettes
├─ public/
│   └─ audio/         # transition jingles
├─ scripts/           # setup, build, smoke-test
├─ .github/           # CI workflows
│
├─ .env.example       # Supabase URL + anon key
├─ index.html         # Vite mount
├─ vite.config.ts     # Vite plugins + paths
├─ tsconfig.*.json    # TypeScript configs
└─ package.json
```

---

## 5 Live Hosting & Realtime Requirements

- ✅ Project is hosted on Netlify, mapped to **quiz.tyshub.xyz**
- ✅ Uses **Supabase** for real-time player and game state sync
- ✅ Uses **Daily.co** for live video
- I own a domain on porkbun: tyshub.xyz
- ⚠️ Supabase and Daily keys are **in local .env** only. They arer set in Netlify
- 🚧 AI/Codex should check for missing `.env` keys in `supabaseClient.ts` and `dailyClient.ts`
- 🎯 Goal is not a static demo but a real-time multiplayer experience

## 6 Dependency Map Strategy

- Generated with `npx madge src --extensions ts,tsx --json > full-dependency-map.json`
- Visual: `npx madge src --extensions ts,tsx --image dependency-graph.svg`
- Used to audit and analyze cross-dependencies and suggest file/module cleanup

---

## ✅ Approved Changes

- **Dual Host Control**
  - Host can join via _mobile_ to see what players see.
  - Host can also join via _PC_ with advanced controls:
    - View all questions/answers
    - Mark answers as right/or wrong
    - Add/remove strikes
    - Manually control scores
    - Reveal clubs/logos (REMO)
    - Move to next question or segment
    - Lock inputs after bell click
    - Flexible host control over game state
    - GameContext actions persist to Supabase and broadcast via GameSync

- **Segment-Specific Behavior**
  - **BELLJ** and **SING**:
    - Question hidden from players.
    - Players race to click a shared "bell" button.
    - First click disables bell for second player.
    - Host sees who clicked first, acts on their answer.
    - If incorrect, control passes to second player; else question is void.
    - Host picks correct/incorrect via ui.

- **REMO** Logic:
  - Host clicks to reveal club logos step-by.s

- **Pre-Game Lobby Settings**
  - Host PC lobby view:
    - Set number of questions per segment
    - [Suggestions]: choose enabled segments, customize team logos, toggle special buttons)
  - Mobile lobby view:
    = Confirm theme; wait for host to start the game

- **Special Button Logic**
  - Special buttons (LOCK_BUTTON, TRAVELER_BUTTON, PIT_BUTTON) can each be used \*once per player\*\*.
  - After use, button is hidden/disabled.
- **Responsive Layout (Mobile Support)**
  - Ensure full gameplay fits within at least [iPhone 13 Pro] viewport.
  - Layout suggestion:
    - Pyramid format: Host top-center, Players bottom-left/right.
    - Show strike count, round/total score, special button status.
    - Avoid scroll; prioritize camera, scores, question visibility.

# Thirty Challenge – Green‑Field Repo Overview

_Created: 2025‑07‑23_
