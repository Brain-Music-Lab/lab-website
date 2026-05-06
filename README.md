# Brain Music Lab

A self-contained educational website for students ages 10–15 that teaches electric circuits, music technology, and biosignals through video lessons, mini quizzes, and browser-based experiments — no installs required.

Looking for the Arduino code that goes with these tutorials? You can find it all here:
**[github.com/Brain-Music-Lab/BML_Tutorials](https://github.com/Brain-Music-Lab/BML_Tutorials)**

---

## What the project does

The site is structured as a linear learning pathway with three lessons and an activity hub:

1. **Lesson 1 — Electric Circuits**: Covers how electricity flows through a closed loop, what conductors and insulators are, and how a basic LED circuit works. Includes a mini quiz and a "Conductor Sort" activity where students predict which materials let electricity through.

2. **Lesson 2 — Music + Microcontrollers**: Introduces how microcontrollers work, what sound waves and frequency are, and how pitch connects to Hz. Includes a quiz and a "Frequency Match" slider where students tune a live browser tone to 440 Hz (concert A).

3. **Lesson 3 — Heartbeat + PPG Sensors**: Explains photoplethysmography (PPG), how a sensor detects blood flow with light, and how heartbeat data can control music tempo. Includes a quiz.

After the three lessons there's an **Interactive Activity Hub** with three experiments students can play with right in the browser:

- **Circuit Builder** — Check off components and see whether the virtual bulb lights up based on real circuit rules.
- **Music Playground** — Sliders for pitch (Hz) and rhythm speed drive a live pentatonic tone sequence.
- **Pulse-to-Tempo Drum Lab** — A BPM slider controls a synthesized 4/4 drum groove (kick, snare, hi-hat) with a visual beat indicator and animated heartbeat.

---

## Project structure

```
website/
├── index.html      — All page content and structure
├── styles.css      — All styling, themes, and responsive layout
├── script.js       — All interactivity (audio, quizzes, activities)
└── assets/
    └── spontaneous_brain_activity_i.mp4   — Hero background video
```

There are no build tools, no bundlers, and no dependencies to install. Just open `index.html` in a browser and everything works.

---

## How the files connect

**`index.html`** is the whole page. It pulls in the font from Google Fonts, links `styles.css` for appearance, and loads `script.js` with `defer` so the script runs after the DOM is ready. Every interactive element — sliders, checkboxes, buttons, quiz forms — is just standard HTML. JavaScript finds them by their `id` attributes.

**`styles.css`** defines two sets of color variables (light and dark) at the top using CSS custom properties. Everything on the page uses those variables, so switching themes is just a matter of flipping one attribute on the `<html>` element. The layout uses CSS Grid throughout — no external framework needed.

**`script.js`** does all the heavy lifting. It's broken into clearly labeled sections:

| Section | What it does |
|---|---|
| Audio Engine | Creates Web Audio API tones on the fly at any frequency |
| Navigation | Hamburger menu for mobile, keeps aria state in sync |
| Theme Toggle | Reads/writes localStorage to remember the user's theme choice |
| Reveal Animations | IntersectionObserver fades sections in as you scroll |
| Quiz Logic | Grades all three quizzes from a shared answer key |
| Conductor Sort | Chip-toggle activity for Lesson 1 |
| Frequency Match | Slider-to-tone activity for Lesson 2 |
| Circuit Builder | Component checkbox activity for the Activity Hub |
| Music Playground | Pitch + rhythm sliders driving a tone loop |
| Pulse-to-Tempo Drum Lab | Full drum machine with lookahead Web Audio scheduling |
| App Bootstrap | Single entry point that wires everything up on page load |

---

## Key technical choices

### Web Audio API instead of audio files
All sounds — beeps, quiz chimes, kick drum, snare, hi-hat — are synthesized in JavaScript using the Web Audio API. This means no audio files to manage and every tone can be any frequency you want. The audio context is created lazily on the first user interaction because browsers block audio until then.

### Lookahead drum scheduler
The Pulse-to-Tempo Drum Lab uses a technique where a fast `setInterval` (every 25ms) looks slightly ahead on the Web Audio clock and pre-schedules drum hits within that window. This is how professional web audio apps keep timing accurate — the JS timer is allowed to drift, but the audio engine isn't.

### CSS custom properties for theming
Instead of writing separate dark-mode stylesheets, every color on the page is a variable like `--primary` or `--bg`. The dark theme just overrides those variables under `[data-theme="dark"]`. Toggling the theme is one attribute change on `<html>`.

### No frameworks, no build step
The whole project is plain HTML, CSS, and JavaScript. You can open it directly in a browser, edit any file in a text editor, and refresh to see changes instantly.

---

## Running the project

Since `index.html` loads local files, you can either:

1. **Double-click `index.html`** — works for most things, but the hero video and some browser security restrictions may behave differently.

2. **Serve it with a local web server** — the most reliable option. If you have Python installed:
   ```bash
   cd website
   python3 -m http.server 8080
   # then open http://localhost:8080 in your browser
   ```
   Or use the **Live Server** extension in VS Code (right-click `index.html` → *Open with Live Server*).

---

## Modifying the lessons or quizzes

- **To change quiz answers**, edit the `answerKeys` object near the top of the `initQuizzes` function in `script.js`. Each key (e.g., `quiz1`) maps to an object where property names match the radio `name` attributes and values match the correct radio `value` attributes in the HTML.

- **To add a new lesson section**, copy one of the existing `<section id="lesson-X">` blocks in `index.html`, give it a new `id`, and update the nav links. The reveal animation will pick it up automatically.

- **To add a new activity**, write an `initMyActivity()` function in `script.js` following the same pattern as the existing ones, then call it inside `initBrainMusicLab()`.

---

## Browser support

The site uses a few modern CSS features (`color-mix()`, `backdrop-filter`, `clamp()`) that work in all current versions of Chrome, Firefox, Safari, and Edge. The Web Audio API is also universally supported in modern browsers. Internet Explorer is not supported.


