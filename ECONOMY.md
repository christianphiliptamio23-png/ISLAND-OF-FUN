# Island of Fun economy

Seven mini-games, ten levels each. Lucky Wheel is not an active attraction.

New profiles receive 150 Fun Coins, 2 Retry Tickets and 0 Prize Tokens. Existing balances are preserved; legacy gems convert to Prize Tokens. Level 1 is free. Later levels require the previous stamp and a permanent coin purchase.

| Level | Unlock | Every win |
|---|---:|---:|
| 1 | 0 | 30 |
| 2 | 30 | 60 |
| 3 | 50 | 100 |
| 4 | 75 | 150 |
| 5 | 100 | 200 |
| 6 | 140 | 280 |
| 7 | 180 | 360 |
| 8 | 225 | 450 |
| 9 | 275 | 550 |
| 10 | 350 | 700 |

Replays are free. Every completed win pays twice the level unlock price; free Level 1 pays 30 coins. Each attempt pays once, including replay attempts, with no daily replay cap. Existing balances remain unchanged until the next win. Free daily login rewards and quests provide further income. The 7-day login cycle restarts after a missed day. Weekly quests use a Monday boundary. Dates use the player's device clock.

## Retry controls

For Target Shooting, choose **Use Retry Ticket** from Pause or Out of Ammo. Its wallet stays compact. Other games use their existing retry controls or wallet panel. Chess's existing Undo button uses the same ticket system. Maximum three uses per attempt; unavailable or failed restores spend nothing. Successful levels cannot be rewound.

- Chess restores the position, history and clocks before the player's last move, including the AI response.
- Basketball restores the pre-shot state after a missed ball has settled.
- Target Shooting restores ammunition, target/blocker state and time after a miss or penalty target.
- Can Knockdown restores the previous throw's body positions, velocities, destroyed bodies, cans, score and balls once the throw settles.
- Memory restores an incorrect pair, closes its cards, and refunds the move without reshuffling.
- Maze treats each valid cell as a checkpoint and restores the preceding cell's stars, enemies, time and move count.
- Pickleball restores the serve, score and player/ball state of the last lost rally before the next rally begins.

## Shop, rewards and saves

The existing menu links open Shop, Inventory, Quest Board, Daily Login, Carnival Passport, Achievements and Gift Inbox. Four shop tabs provide gifts, accessories, ticket packs and token prizes. Purchases require confirmation. Cosmetics equip as player-card avatars; they do not attach new 3D models to the character.

Achievements are awarded once, including the Champion badge and trophy cosmetic for all 70 stamps. Quest metrics are recorded through game events. Replay deduplication, purchases, tickets, unlocks and stamps use the active local profile. Legacy shared game progress is assigned once to its first migrating local profile. Completed levels are preserved where the old save recorded completion, and existing accessible levels remain accessible. Global legacy saves cannot identify their original player if they predate profile support.

Account creation preserves guest economy progress. Wallet balances are never overwritten by stale island settings saves. Native game score/settings saves remain scoped to the active profile where supported.

## Backend-dependent features

Gift composition and inbox are a clearly labelled local preview. Sending and claiming are disabled. No coins are charged and no transfer occurs. A future authenticated server must enforce recipient identity, delivery/claim idempotency and the five-cosmetic-gifts-per-day limit. Coins and tickets must never be transferable.

There is no cloud login, cross-device sync, server-authoritative economy or protection against a player editing their own browser storage/clock. Clearing browser data removes local progress. Vercel serves this local single-player game; it does not create a multiplayer backend.

## Validation and deployment

Run `npm test` (or `node --test tests/*.test.mjs`). Browser checks in `tests/browser-*.mjs` use an isolated headless Chrome profile on debugging port 9223 and the local game server. They cover desktop/phone game starts, real state restoration in all seven games, and shop/menu flows; they do not play all 70 levels manually. Browser test data is excluded from deployment.

Run `npm run build` to create `dist/`. Vercel uses the checked-in build command and output directory. Its root redirect opens `/menu/`, where the introduction video plays before the menu. External Three.js, Draco, Matter.js and font resources still need network access. No secrets or backend environment variables are required.
