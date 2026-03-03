# Nick the Tree Man

Arcade physics lumber game built with plain HTML5 canvas and JavaScript.

You play as Nick and trim branches to control trunk balance so trees fall safely, away from homes, cars, and old ladies. Trees react to branch mass, deadness, wedge direction, wind, and trunk geometry. Some levels include boss trees, gust events, and moving cats on branches (cat branches are protected from cutting).

## Play

Open [`index.html`](./index.html) in a browser, or run a static file server from this folder.

Example:

```bash
npx serve .
```

Then open the shown local URL.

## Controls

- `A` cut left branch (saw mode)
- `B`/`D` cut right branch (saw mode)
- `Swipe` optional direct branch cutting (saw mode)
- `1`/`ArrowDown` select lower branch tier
- `2`/`ArrowUp` select upper branch tier
- `X` toggle `Saw` / `Axe` mode
- `Axe mode`: notch one side first, then back-cut opposite side
- `Q` / `E` set wedge direction, `W` clear wedge
- `Tab` / `Shift+Tab` cycle selected tree
- `Space` jump
- `V` toggle fiddle dance mode
- `F` toggle fullscreen
- `Enter` start / continue

## Notes

- Trees now avoid falling onto Nick, and Nick auto-dodges active falling trunks.
- Level failure is driven by trunk impacts on protected hazards.
- Includes deterministic test hooks used by automation:
  - `window.render_game_to_text()`
  - `window.advanceTime(ms)`

