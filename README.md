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

Maze is connected to the **HEDGE MAZE** booth: approach it and press **E**. It uses the supplied `games/maze/index.html`, with WASD/arrows, swipe and touch-pad controls. Return to Island is available from the level picker and during play. Level unlocks, best stars, time and moves save per profile; first clears award 50 coins, 1 ticket and 20 XP without duplicate replay rewards.

Basketball Shoot is connected to the basketball booth: approach it and press **E**. The supplied game is restored to `games/basketball/index.html`; its 10 levels and generated sounds run locally. Back returns to the same island session, Escape pauses/resumes the shot game, and unlocks and first-clear rewards are saved per profile. Each first clear awards 50 coins, 1 ticket and 20 XP; replays update the best score without duplicate rewards.

Memory Tiles is connected to the **MEMORY TILES** booth: approach it and press **E**. It opens `games/memory/index.html` full-screen. Its Back to Island button returns to the same island session.

Chess is connected to the **CHESS VS AI** booth. It opens `games/chess/index.html` with ten selectable levels and a built-in opponent. Its castle background and illustrated UI source sheets are in `games/chess/assets/`. Return to Island closes the game and resumes exploration. The chess game saves its settings in this browser.

Double-click **PLAY.cmd** to start or reopen the game at http://localhost:8080. The server also starts automatically when you sign in to Windows, so closing VS Code does not stop it. If Windows has just restarted and the page is still loading, use **PLAY.cmd**. Node.js must be installed; `npm install`, Vite, and Stockfish are not required. Internet access is currently needed for the existing Three.js scripts and menu font.

The opening screen is `menu/index.html`. Its Play button opens `game.html`, which loads `src/main.js`.

Controls: WASD / arrows to walk, Shift to run, Space to jump, drag to orbit the camera, mouse wheel to zoom, E to explore a booth, and Escape to pause. Booth collision boundaries are enabled; the island is not restricted to fixed walking paths.

`assets/` holds the active models and images. `styles/main.css` provides the playable island styles. The main menu contains its own styling.

