# Nick the Tree Man

A woodland physics arcade game about careful cuts, clean landings, and a man who really loves his fiddle. Built with plain JavaScript, HTML, and Canvas 2D. All artwork and sound are generated locally; the game requires no external assets or services.

## Play

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. You can also open `index.html` directly in a browser. Career records and sound preferences are saved in the current browser's local storage (and therefore are separate for different origins).

## The job

Fell every tree without hitting houses, cars, or neighbors. The selected tree's striped green landing zone marks a safe direction. Cut branches on the opposite side to shift its balance, or make an axe notch on the landing side and back-cut from the opposite side. Heavy limbs need multiple hits. Wedges, wind, tree size, and dead wood all affect balance.

The five jobs progress from a guided morning in Cedar Hollow through stormy Harbor Crossing, Orchard Lane, Museum Row, and the Heritage Giant. Each has a repeatable layout, its own time target, and at least one safe fall direction for every tree. A failed job can be retried immediately without replaying earlier jobs.

Earn up to three stars on each job:

- Complete the job with no damage.
- Finish within its time target.
- Trim at least two branches.

Branches award 75 points with a flow multiplier for quick consecutive cuts. Clean tree landings award 300 points (800 for the giant), protected neighbors and property award 150 each, and finishing under par adds a time bonus. Play the fiddle to coax a cat to safety for 200 extra points. Occupied branches cannot be cut. Nick automatically dodges falling trunks.

## Controls

Every essential action also has an on-screen button for mouse and touch.

| Action | Keyboard / pointer |
| --- | --- |
| Start / next job / retry after failure | Enter |
| Cut left / right | A / D (B also cuts right) |
| Lower / upper branches | 1 / 2 or Down / Up |
| Switch saw / axe | X |
| Wedge left / clear / right | Q / W / E or Left / Right |
| Select next / previous tree | Tab / Shift+Tab |
| Select a tree | Click its trunk |
| Cut a specific branch | Tap it or swipe across it in saw mode |
| Jump | Space |
| Play fiddle / rescue a cat | V |
| Pause / resume | P or Escape |
| Retry the current job | R |
| Toggle sound | M |
| Toggle fullscreen | F (Escape also exits) |

The Field guide explains the cutting sequence. Pause and open panels stop the simulation. Switching to another browser tab automatically pauses the game. Reduced-motion preferences suppress camera shake and cinematic slowdown.

## Development and verification

```sh
npm run check        # JavaScript syntax checks
npm test             # Browser-based end-to-end campaign and controls verification
npm run test:smoke   # Menu, first job, and safety smoke test
```

Tests use the existing Playwright dependency and start their own temporary local server. Install the browser with `npx playwright install chromium` if it is not already available. The test suite plays through all five jobs using actual keyboard/pointer/UI input and checks progression, branch durability, natural falls, axe sequences, cat protection and rescue, pause, retry, persistence, fullscreen, touch layouts, and browser errors. Screenshots and reports are written to `output/upgrade-qa/` (git-ignored).

Game files:

- `game.js`: world generation, tree physics, interaction, animation, state, and test hooks.
- `scenery.js`: procedural landscape, trees, Nick, and the truck illustration.
- `experience.js`: accessible menus, live HUD, control dock, career persistence, and synthesized audio.
- `styles.css`: responsive layout and visual system.
- `scripts/serve.js`: local server, limited to the public game files.

For automation, `window.render_game_to_text()` returns current, actionable game state including branch geometry/health, hazards, cats, score, job progress, and career records. `window.advanceTime(ms)` enables manual simulation stepping. Append `?test=1` to start with the simulation clock paused until it is advanced explicitly; no special gameplay shortcuts are exposed.
