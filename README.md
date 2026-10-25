# Island of Fun

Camera: click the **Third person / First person (V)** button or press **V** while exploring. Drag to look around in either view. First-person hides your character and follows eye height; third-person shows your character and supports wheel zoom. Your camera choice saves with your profile.

## Folder guide

Each mini-game has its own folder, containing its game code, island-booth connection, styles and any background artwork:

```text
games/
  memory/          index.html, MemoryTilesBoothGame.js, style.css, assets/
  cans/            index.html, CanKnockdownBoothGame.js, style.css, assets/
  pickleball/      index.html, PickleballBoothGame.js, style.css, assets/
  chess/           index.html, ChessBoothGame.js, style.css
  shooting-range/  index.html, ShootingBoothGame.js, style.css, assets/
  basketball/      index.html, BasketballBoothGame.js, style.css, assets/
  maze/            index.html, MazeBoothGame.js, style.css
```

Shared island code, player controls and account saving stay in `src/`. Shared island/booth models stay in `assets/models/`. The opening menu and its artwork are in `menu/`. Game progress is stored in the browser, so moving these files does not reset it. Game test files remain together in `tests/`.

Shooting Range is connected to the **TARGET SHOOTING** booth: approach it and press **E**. It opens the supplied `games/shooting-range/index.html` with all 10 levels. Click/tap to shoot, Escape pauses/resumes, and Back to Island returns to the same island session. Unlocks and cleared levels save locally per profile.

Maze is connected to the **HEDGE MAZE** booth: approach it and press **E**. It opens a first-person hedge-maze walkthrough in `games/maze/index.html`. W/S or up/down walk, A/D sidestep, Q/E or left/right turn, and dragging turns the view. M or the Map button opens a map and pauses navigation; touch walking and turning buttons are available. Return to Island is available from the level picker and during play. Level unlocks, best stars, time and moves save per profile; win and replay rewards use the shared economy described in ECONOMY.md.

Basketball Shoot is connected to the basketball booth: approach it and press **E**. The supplied game is restored to `games/basketball/index.html`; its 10 levels and generated sounds run locally. Back returns to the same island session, Escape pauses/resumes the shot game, and unlocks and first-clear rewards are saved per profile. Win and replay rewards now use the shared economy; see ECONOMY.md.

Memory Tiles is connected to the **MEMORY TILES** booth: approach it and press **E**. It opens `games/memory/index.html` full-screen. Its Back to Island button returns to the same island session.

Chess is connected to the **CHESS VS AI** booth. It opens `games/chess/index.html` with ten selectable levels and a built-in opponent. Its castle background and illustrated UI source sheets are in `games/chess/assets/`. Return to Island closes the game and resumes exploration. The chess game saves its settings in this browser.

Double-click **PLAY.cmd** to start or reopen the game at http://localhost:8080. The server also starts automatically when you sign in to Windows, so closing VS Code does not stop it. If Windows has just restarted and the page is still loading, use **PLAY.cmd**. Node.js must be installed; `npm install`, Vite, and Stockfish are not required. Internet access is currently needed for the existing Three.js scripts and menu font.

The opening screen is `menu/index.html`. Its Play button opens `game.html`, which loads `src/main.js`.

Controls: WASD / arrows to walk, Shift to run, Space to jump, drag to orbit the camera, mouse wheel to zoom, E to explore a booth, and Escape to pause. Booth collision boundaries are enabled; the island is not restricted to fixed walking paths.

`assets/` holds the active models and images. `styles/main.css` provides the playable island styles. The main menu contains its own styling.

## Put the game online

On Render, create a **Web Service** connected to the `main` branch of this GitHub repository. Select the **Node** runtime, set the build command to `npm install`, the start command to `npm start`, and choose a plan (the Free plan is suitable for a class preview). No environment variables are required. Set the health-check path to `/health` if prompted. Render will provide an HTTPS `onrender.com` URL when deployment completes.

The Free web service can sleep after inactivity, so open its public URL a little before presenting and wait for it to wake up. Game progress and accounts are stored in each browser, not on the server: a teacher opening the site on a different device can play, but will not see your locally saved progress.



## Phone controls

Use the left thumb joystick to walk and drag the open island view to move the camera. Tap Run to toggle running, Jump to jump, and Explore near a booth. The gear opens settings. Touch controls hide while a mini-game or dialog is open. Portrait and landscape layouts are supported. The game fills the viewport and requests fullscreen on the first tap on each page when supported. Browser restrictions prevent forcing fullscreen on page load. On iPhone, add the site to the Home Screen and launch its icon for standalone display. Use the deployed HTTPS game URL on your phone; localhost refers to the phone itself.

## Economy and progression

See [ECONOMY.md](./ECONOMY.md) for currency balances, paid unlocks, seven retry adapters, the shop, quests, daily rewards, achievements, save migration and backend limitations. Gems have been replaced by Prize Tokens. Gift sending is disabled until a multiplayer server is connected.

## Final island HUD and emotes

The island has live wallet counters, day/night selection, and five animated emotes. Open Emote to choose a flip or dance. The camera moves in front at a comfortable 6.5-unit distance, then restores your previous view when the clip finishes or you move/jump. All mini-games hide the island controls.

Run `npm test` for regression checks and `npm run build` to generate the optional static `dist/` folder. Generated builds and original asset ZIPs are not committed; Render runs the source with `npm start`.
