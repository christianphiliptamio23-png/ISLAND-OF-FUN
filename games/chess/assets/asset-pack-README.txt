ISLAND OF FUN — CHESS ASSET PACK

Copy the 3 .webp files to your project folder: assets/chess/

Contents:
- chess_background.webp: castle scenery, no interactive UI.
- chess_game_ui_sheet.webp: illustrated UI element sheet (not separated sprites).
- chess_level_select_ui_sheet.webp: illustrated level selection asset sheet (not separated sprites).

IMPORTANT: The UI sheets contain multiple graphics and baked-in text. They are visual source sheets; crop individual elements or recreate interactive UI in HTML/CSS. Do not use them as complete playable screens. Keep the current chess engine, legal-move validation, game state, and button handlers.

Suggested CSS background:
background-image: url("assets/chess/chess_background.webp");
background-size: cover;
background-position: center;

