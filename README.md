# The Loop

An interactive scroll journey about the loops we live in — the unmet need, the counterfeit subscription, the shame engine — and why the exit isn't willpower or earning, but grace. The circle (*incurvatus in se*) breaks open into an upward spiral.

## Run it

No build step. Either double-click `index.html`, or serve the folder:

```sh
python3 -m http.server 4173
# then open http://localhost:4173
```

Internet is needed on first load (GSAP and the Newsreader font load from CDNs).

## Edit the words

- `content/copy.md` — the editorial master. Every word lives here first; red-pen this file.
- `index.html` — the live text. All static copy is plain HTML, organized act by act with comments.
- `js/content.js` — the dynamic bits: need/agent options, reroute table, node labels, achievement lines.

`{need}` / `{agent}` placeholders and `data-bind` spans are filled from the visitor's picks. Nothing is stored or sent anywhere — picks live in memory for the page session only.

## Structure

- `js/loop-engine.js` — diagram primitives for the SVG loop. Scroll-driven visual state is set with CSS classes (`.on`, `.spiraled`) so it's deterministic and reversible; only the button-driven one-shots (run, willpower, the acceptance meter) use GSAP.
- `js/main.js` — one `update()` function derives the entire visual state from scroll position on every frame (background zone, node build-up, earning relabel, the `incurvatus` label, the grace morph). Because state is recomputed rather than latched, scrolling up reverses everything cleanly. Plus personalization and the interactive moments.
- `css/style.css` — design system. Dark and tightening through Act 4.5 (`body.deep`, `body.deepest`), light after grace (`body.light` + `body.past-grace`).

Asset links in `index.html` carry a `?v=N` query for cache-busting — bump it when you change `style.css` or the JS so returning visitors don't get stale cached files.

The eight acts: hook → the need → the subscription → the loop → willpower fails → the respectable loop → the exit → the spiral → walking it out.

## Deploy

It's a static site: drag the folder into Netlify Drop, or push to GitHub and enable Pages. No server, no env vars, no analytics.

## Accessibility

- `prefers-reduced-motion` collapses animations to near-instant state changes.
- Without JavaScript the full text still reads top to bottom.
