# Linked List Visualizer

An interactive, browser-based learning lab for linked lists. Every operation —
insertion, deletion, search, traversal, reversal — plays out as a **step-by-step
animation** with live pointer changes, synchronized code highlighting, complexity
information and plain-English explanations.

No build step, no server, no dependencies: **just open `index.html`.**

## Features

- **Three list types** — singly, doubly and circular (plus a conversion switch
  that keeps your current values).
- **Animated operations** — insert at beginning / end / position, delete at
  beginning / end / position, search, forward & reverse traversal, full reversal,
  clear, multi-value "Add" and random-list generator.
- **Step player** — Restart / Prev / Play-Pause / Next / Skip-to-result, with a
  speed slider (0.25× – 3×) and keyboard shortcuts: `←` `→` step, `Space` play/pause.
- **Live code panel** — the running line is highlighted in **C++, Java, Python or
  pseudocode** while the animation runs.
- **Explanation cards** — *What are we doing?*, *What is happening?* and *Why?*
  update on every step, plus a status line and register chips
  (`temp = [20]`, `prev = null`, …).
- **Complexity panel** — Big-O table for all operations with the active row
  highlighted and a note that explains the trade-offs.
- **Memory view** — pseudo-random addresses, data, next and prev fields, so you
  see that nodes are *not* contiguous (toggle in the sidebar).
- **Practice** — 4 challenges (gap insert, delete, search, reverse-by-clicking)
  with hints, checking and per-challenge progress.
- **Quiz** — 12 multiple-choice questions with instant explanations, a result
  screen, answer review and a locally stored best score.
- **Array vs Linked list** — animated side-by-side demo of front insert/delete
  and a comparison table.
- **Undo / Redo** — full operation history in the visualizer.
- **Dark / Light theme** and responsive layout (desktop → phone).
- **Progress tracking** — operations run, challenges solved and quiz best score
  are saved to `localStorage` (nothing leaves your browser).

## Getting started

1. Unzip the project.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari).
   Double-clicking the file is enough — no web server required.
3. Pick an operation in the left sidebar and watch it play.

## Project structure

```
linked-list-visualizer/
├── index.html            # page structure: views, sidebar, player, panels
├── css/
│   └── style.css         # all styling, animations, themes, responsive rules
├── js/
│   ├── linked-list.js    # data structure model (nodes, registry, snapshots)
│   ├── operations.js     # step generators for every operation
│   ├── code.js           # code snippets per language + complexity data
│   ├── visualizer.js     # DOM/SVG rendering, layout, links, states, FLIP motion
│   ├── animations.js     # StepPlayer (play/pause/step/speed)
│   ├── quiz.js           # 12-question quiz with review screen
│   ├── practice.js       # 4 interactive challenges
│   ├── compare.js        # array vs linked list demo
│   └── app.js            # wiring: state, views, undo/redo, progress, theme
├── assets/
│   └── favicon.svg
└── README.md
```

## How it works (architecture)

1. **Model** — `LinkedList` keeps nodes in a registry; every node has a stable id.
2. **Operations** — each operation is a generator function that mutates a *clone*
   of the list and records, for every micro-step: a full **state snapshot**,
   **highlights** (current / visited / new / deleting / changed links), **register
   values**, a **code tag**, and the three explanation texts.
3. **Player** — `StepPlayer` walks the step array; moving to a step **rebuilds the
   real list from the snapshot**, so the UI, data structure, memory table and code
   panel can never drift apart.
4. **View** — `Visualizer.render()` diffs the previous DOM against the new state:
   nodes FLIP into their new positions, deleted nodes fade out as ghosts, changed
   pointer arrows pulse, and new links draw themselves in.

Because each step carries its own snapshot, Prev/Restart/Rewind are exact — any
step can be revisited at any time.

## Rules of the sandbox

- Lists are capped at **12 nodes** so every pointer stays readable.
- Values must be **whole numbers** (negatives are fine).
- Reverse traversal is only available on a **doubly** linked list (that is the
  lesson — `prev` pointers are what make it possible).

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `→` | Next step |
| `←` | Previous step |
| `Space` / `p` | Play / pause |

## Browser support & data

- Works offline in any browser with ES6 support (2016+).
- Progress and theme preferences are stored in `localStorage` under
  `llv.progress.v1` / `llv.theme`. Clearing site data or using the
  **Reset progress** button in the progress modal resets them.

## Verification

The project was verified with:

- `node --check` on every JavaScript file,
- a 275-assertion logic suite covering all operations × list types
  (including empty lists, single nodes, positions, capacity limits,
  circular/doubly invariants and code-tag/snippet consistency),
- an 80-assertion headless DOM smoke test (jsdom) driving the real UI:
  operations, step player, undo/redo, type switching, memory view, theme,
  progress modal, capacity guard, all practice challenges, the full quiz and
  the compare demo — with **zero runtime errors**.
