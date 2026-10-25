# Island HUD game assets

Transparent PNG cutouts from the selected screenshot, **excluding the island map** and the daytime/nighttime preview cards.

- `emote_button.png`: circular button at right.
- `emote_1.png`–`emote_4.png`: four left-facing radial slices.
- `emote_wheel_choices.png`: combined four-choice menu (alternative to individual slices).
- Other files: time slider, coins/tickets/gems, third-person, settings, movement joystick, run, jump.
- `layout.json`: original reference layout, stored as percentages.
- `preview.html`: drop-in visual arrangement, intended for use with a live local server such as VS Code Live Server.

All PNGs have transparent pixels outside their shapes. **Note:** artwork and labels inside each shape are raster pixels, extracted from a screenshot; they are not vector or independently editable. Some segments may show minor remnants of the source scene close to the cut boundary. Controls are graphics only: implement touch and pointer input for actual emote swipe selection.
