# Daily.co Integration

This document explains Daily.co usage: Netlify functions for room creation/tokens, client SDK patterns and recommended flows.

Key endpoints (Netlify functions):
- `create-daily-room.ts` — POST to create a room
- `create-daily-token.ts` — POST to create meeting tokens
- `delete-daily-room.ts` — POST to delete a room

Client-side uses a lazy-loaded Daily SDK and manages call object via Jotai atoms (`src/state/videoAtoms.ts`).

Important: host PC is source-of-truth for room creation. Tokens must be generated server-side.
