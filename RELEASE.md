# Web-only release

The game remains single-player and playable in the browser at https://island-of-fun.onrender.com/. Progress, purchases and accounts remain stored locally on each device. No player data has been deleted.

- Island day/night transitions include sunlight, a moon, stars and glowing lanterns. Controls remain in island exploration.
- Four purchasable emotes and the free flip remain available. Dance camera stays in front at the wider 6.5-unit distance.
- Pickleball has larger joystick/action controls and an upper-left compact wallet. New backgrounds are shown atomically after loading; the old procedural fallback appears only if the supplied background fails.
- Basketball has a shaded, textured ball with curved seams and a tropical teal-and-gold shooter uniform, headband and improved hair. Shooting physics are unchanged.
- APK build files, download controls, optional database backend, online hub and leaderboard/friend menu options have been removed. Saved local friend/profile data is preserved for compatibility.
- Five byte-identical dance texture sets now share one set. All five original animation clips remain intact.

## Running and deployment

Run `npm ci`, `npm test`, and `npm start`. Build a static copy with `npm run build`. Render should use the GitHub `main` branch, build command `npm ci`, start command `npm start`, and `/health` as its health check. No database or signing credentials are required. Remove any obsolete database migration pre-deploy command if one was manually configured.

Node 20+ is supported. The server streams files, supports byte ranges, and blocks private project files such as `.git`, `.env`, scripts and backend configuration. Three.js and its loaders are served locally.

Browser tests use an isolated Chrome profile and never change the user's saved game. Physical phone performance still depends on the device. Existing graphics-quality options and reduced-motion support remain available.

Movement now accepts stone steps up to 0.85 world units and gentler rock slopes, with narrower booth clearance. Water and tall obstacles remain blocked. Paid emotes cannot play without ownership, including direct playback calls.
