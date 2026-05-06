// ============================================================
// Brain Music Lab — script.js
//
// All the interactivity for the site lives here. It covers:
//   • A tiny Web Audio synth engine for tones and drum sounds
//   • Mobile navigation toggle and dark/light theme switching
//   • Scroll-reveal animations using IntersectionObserver
//   • Quiz grading for all three lessons
//   • Three Activity Hub modules: Circuit Builder, Music
//     Playground, and Pulse-to-Tempo Drum Lab
//
// Everything is wired up at the bottom in initBrainMusicLab(),
// which fires once the DOM is fully parsed.
// ============================================================

// ------------------------------
// Utility: Audio Engine
// ------------------------------
// We use the Web Audio API to synthesize tones on the fly so
// no audio files are needed. The context is created lazily —
// browsers block audio until the user has interacted with the
// page, so we wait for the first click or tap before creating it.
let audioContext = null;

function initAudio() {
  if (!audioContext) {
    // webkitAudioContext is the older Safari prefix
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtx();
  }

  // Mobile browsers sometimes auto-suspend the context after a
  // tab switch. Calling resume() here ensures sound keeps working.
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

// Plays a single synthesized tone. Parameters:
//   frequency – pitch in Hz  (440 = concert A)
//   duration  – length of the tone in seconds
//   volume    – peak amplitude (0 to 1)
//   type      – oscillator waveform: "sine", "square", "triangle", "sawtooth"
//
// The gain envelope (near-zero → peak → near-zero) gives each
// tone a natural attack and decay so it doesn't click or pop.
function beep(frequency = 440, duration = 0.2, volume = 0.12, type = "sine") {
  const context = initAudio();
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  // Gain starts near-zero (exponentialRamp requires > 0), ramps up fast,
  // then fades out over the note's full duration.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.02); // small buffer so the fade-out finishes cleanly
}

const audio = { beep };

// ------------------------------
// Navigation + Theme
// ------------------------------
// initNavigation wires up the hamburger menu for mobile screens.
// Pressing the toggle button opens or closes the nav list and
// keeps aria-expanded in sync so screen readers know the state.
// Each nav link also closes the menu when tapped so users aren't
// left with an open overlay after jumping to a section.
function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (!toggle || !navLinks) {
    return;
  }

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    navLinks.classList.toggle("open", !expanded); // CSS shows/hides the list based on .open
  });

  // Close the menu whenever the user taps a link inside it
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// initThemeToggle manages the dark/light mode button.
// The user's preference is saved in localStorage under "bml-theme"
// so it persists between visits. The CSS swaps all color variables
// automatically when data-theme="dark" is set on the <html> element.
function initThemeToggle() {
  const button = document.getElementById("theme-toggle");
  if (!button) {
    return;
  }

  // Apply the saved theme before the page finishes rendering
  const saved = localStorage.getItem("bml-theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    button.setAttribute("aria-pressed", "true");
  }

  button.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    if (isDark) {
      document.documentElement.removeAttribute("data-theme"); // back to light
      localStorage.setItem("bml-theme", "light");
      button.setAttribute("aria-pressed", "false");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("bml-theme", "dark");
      button.setAttribute("aria-pressed", "true");
    }
  });
}

// ------------------------------
// Section Reveal Animation
// ------------------------------
// Sections start invisible (opacity 0, nudged down slightly in CSS).
// IntersectionObserver watches each .reveal element and adds the
// .visible class once 12% of it enters the viewport. The CSS
// transition then fades it in and slides it up — no scroll event
// listeners or manual position calculations needed.
function initRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible"); // triggers the CSS fade + slide-up transition
      }
    });
  }, { threshold: 0.12 }); // fires when 12% of the element is in view

  items.forEach((item) => observer.observe(item));
}

// ------------------------------
// Quiz Logic
// ------------------------------
// All three lesson quizzes share the same grading code.
// Each quiz card in the HTML has a data-quiz attribute that maps
// to an entry in answerKeys below. FormData makes it easy to
// read all radio group values at once without looping over inputs.
function initQuizzes() {
  // Correct answer for each question in each quiz.
  // These must match the value attributes on the radio inputs in the HTML.
  const answerKeys = {
    quiz1: { q1: "b", q2: "c", q3: "a" }, // Circuits quiz
    quiz2: { q1: "b", q2: "a", q3: "b" }, // Sound + Code quiz
    quiz3: { q1: "a", q2: "b", q3: "b" }  // Biosignals quiz
  };

  document.querySelectorAll(".quiz").forEach((quizCard) => {
    const quizId = quizCard.dataset.quiz;
    const button = quizCard.querySelector(".check-quiz");
    const result = quizCard.querySelector(".quiz-result");

    if (!quizId || !button || !result || !answerKeys[quizId]) {
      return;
    }

    button.addEventListener("click", () => {
      const key = answerKeys[quizId];
      // FormData reads all radio values by name in one call
      const formData = new FormData(quizCard.querySelector("form"));
      let score = 0;

      Object.keys(key).forEach((question) => {
        if (formData.get(question) === key[question]) {
          score += 1;
        }
      });

      if (score === 3) {
        result.textContent = "Awesome! You got 3/3.";
        result.style.color = "var(--success)";
        // Play a short two-note celebration chime
        audio.beep(880, 0.09);
        setTimeout(() => audio.beep(1046, 0.09), 110);
      } else {
        result.textContent = `You got ${score}/3. Review and try again.`;
        result.style.color = "var(--accent)";
      }
    });
  });
}

// ------------------------------
// Lesson Mini Activities
// ------------------------------
// initConductorSort — Lesson 1 quick activity.
// Users tap material chips to predict which ones conduct
// electricity. A Set tracks the active selection so toggling
// on/off is simple and cheap. Pressing "Test My Choices"
// checks whether both conductors are selected and neither
// insulator was included.
function initConductorSort() {
  const chipContainer = document.getElementById("conductor-sort");
  const testButton = document.getElementById("test-materials");
  const feedback = document.getElementById("conductor-feedback");

  if (!chipContainer || !testButton || !feedback) {
    return;
  }

  // A Set lets us toggle materials in and out cleanly
  const selected = new Set();
  chipContainer.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const material = chip.dataset.material;
      if (!material) {
        return;
      }

      // If already in the Set, remove it; otherwise add it
      if (selected.has(material)) {
        selected.delete(material);
        chip.classList.remove("active");
      } else {
        selected.add(material);
        chip.classList.add("active");
      }
    });
  });

  testButton.addEventListener("click", () => {
    // A full-credit answer means both conductors are selected AND
    // no insulators snuck in
    const goodChoices = ["metal", "graphite"];
    const hasGood = goodChoices.every((item) => selected.has(item));
    const avoidedInsulators = !selected.has("plastic") && !selected.has("rubber");

    if (hasGood && avoidedInsulators) {
      feedback.textContent = "Nice prediction! Metal and graphite can conduct, while plastic/rubber usually insulate.";
      feedback.style.color = "var(--success)";
      audio.beep(740, 0.08);
      setTimeout(() => audio.beep(880, 0.08), 90);
    } else {
      feedback.textContent = "Hint: Think about materials with free electrons. Metals and graphite are good bets.";
      feedback.style.color = "var(--accent)";
    }
  });
}

// initFrequencyMatch — Lesson 2 quick activity.
// Students move a slider to pick a frequency, hear it played
// through the browser, and get feedback on how close they are
// to 440 Hz (A4, the standard concert pitch). We use a triangle
// wave here because it sounds softer and more musical than sine.
function initFrequencyMatch() {
  const slider = document.getElementById("freq-match-slider");
  const value = document.getElementById("freq-match-value");
  const playButton = document.getElementById("play-freq-match");
  const feedback = document.getElementById("freq-match-feedback");

  if (!slider || !value || !playButton || !feedback) {
    return;
  }

  // Keep the displayed Hz number in sync as the slider moves
  slider.addEventListener("input", () => {
    value.textContent = slider.value;
  });

  playButton.addEventListener("click", () => {
    const frequency = Number(slider.value);
    audio.beep(frequency, 0.22, 0.11, "triangle");

    // Give directional feedback: within 20 Hz of target counts as a match
    const diff = Math.abs(frequency - 440);
    if (diff < 20) {
      feedback.textContent = "Great match. You are very close to 440 Hz (A4).";
    } else if (frequency > 440) {
      feedback.textContent = "That tone is above 440 Hz, so it sounds higher.";
    } else {
      feedback.textContent = "That tone is below 440 Hz, so it sounds lower.";
    }
  });
}

// ------------------------------
// Activity Hub A: Circuit Builder
// ------------------------------
// Students check off components then press "Test Circuit".
// The logic mirrors how real circuits work: you need the three
// core parts, a conductor strengthens the path, and an insulator
// breaks it entirely. Conditions are checked in priority order
// so the most critical failure gets reported first.
// The bulb element lights up or dims via a CSS class toggle.
function initCircuitBuilder() {
  const checkButton = document.getElementById("check-circuit");
  const feedback = document.getElementById("circuit-feedback");
  const bulb = document.getElementById("bulb");

  if (!checkButton || !feedback || !bulb) {
    return;
  }

  checkButton.addEventListener("click", () => {
    // Collect all checked boxes into a Set for quick membership checks
    const checks = Array.from(document.querySelectorAll("#circuit-builder input[type='checkbox']"));
    const selected = new Set(checks.filter((input) => input.checked).map((input) => input.value));

    const hasCore = selected.has("battery") && selected.has("wire") && selected.has("bulb");
    const hasConductor = selected.has("metal");
    const hasInsulator = selected.has("plastic") || selected.has("rubber");

    if (!hasCore) {
      bulb.classList.remove("on");
      feedback.textContent = "Hint: Every basic circuit needs a battery, wire, and bulb in a full loop.";
      feedback.style.color = "var(--accent)";
      return;
    }

    // An insulator breaks the loop even when everything else is in place
    if (hasInsulator) {
      bulb.classList.remove("on");
      feedback.textContent = "This circuit fails because an insulator is blocking current. Try removing plastic/rubber.";
      feedback.style.color = "var(--danger)";
      return;
    }

    if (!hasConductor) {
      bulb.classList.remove("on");
      feedback.textContent = "You have the basics. Add a metal conductor to complete the strongest path.";
      feedback.style.color = "var(--accent)";
      return;
    }

    // All conditions met — light the bulb!
    bulb.classList.add("on");
    feedback.textContent = "Success! Closed circuit detected. The bulb lights up.";
    feedback.style.color = "var(--success)";
    audio.beep(660, 0.08, 0.1, "square");
    setTimeout(() => audio.beep(990, 0.08, 0.1, "square"), 100);
  });
}

// ------------------------------
// Activity Hub B: Music Playground
// ------------------------------
// Two sliders let students control pitch (Hz) and rhythm (notes
// per second). Pressing Play starts a repeating interval that
// cycles through a 4-note minor pentatonic sequence, so it always
// sounds musical regardless of slider position. Stop clears the
// interval; the same cleanup also fires before the page unloads.
function initMusicPlayground() {
  const pitchSlider = document.getElementById("pitch-slider");
  const rhythmSlider = document.getElementById("rhythm-slider");
  const pitchValue = document.getElementById("pitch-value");
  const rhythmValue = document.getElementById("rhythm-value");
  const playButton = document.getElementById("play-music");
  const stopButton = document.getElementById("stop-music");
  const feedback = document.getElementById("music-feedback");

  if (!pitchSlider || !rhythmSlider || !pitchValue || !rhythmValue || !playButton || !stopButton || !feedback) {
    return;
  }

  let intervalId = null; // holds the setInterval reference so we can cancel it

  function updateLabels() {
    pitchValue.textContent = pitchSlider.value;
    rhythmValue.textContent = rhythmSlider.value;
  }

  function stopPlayback() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      feedback.textContent = "Music stopped.";
    }
  }

  pitchSlider.addEventListener("input", updateLabels);
  rhythmSlider.addEventListener("input", updateLabels);

  playButton.addEventListener("click", () => {
    stopPlayback();

    const frequency = Number(pitchSlider.value);
    const notesPerSecond = Number(rhythmSlider.value);
    // Floor to 120ms minimum so notes don't blur together at fast speeds
    const intervalMs = Math.max(120, Math.floor(1000 / notesPerSecond));

    feedback.textContent = `Playing ${frequency} Hz at ${notesPerSecond} notes per second.`;

    let step = 0;
    intervalId = setInterval(() => {
      // Cycle through a 4-note pentatonic pattern (semitone offsets: 0, 3, 7, 10).
      // Multiplying the base frequency by 2^(n/12) converts semitone steps into Hz.
      const sequence = [0, 3, 7, 10];
      const semitone = sequence[step % sequence.length];
      const noteFreq = frequency * Math.pow(2, semitone / 12);
      audio.beep(noteFreq, 0.11, 0.1, "triangle");
      step += 1;
    }, intervalMs);
  });

  stopButton.addEventListener("click", stopPlayback);
  window.addEventListener("beforeunload", stopPlayback);
}

// ------------------------------
// Activity Hub C: Pulse-to-Tempo (4/4 Drum Beat)
// ------------------------------
// This module implements a Web Audio "lookahead scheduler" — a
// well-known pattern for sample-accurate timing in the browser.
// Instead of playing each note directly inside a setInterval tick
// (which drifts because JS timers aren't precise), we run a fast
// interval that looks slightly ahead on the Web Audio clock and
// pre-schedules any notes falling within that window. This keeps
// the beat rock-solid regardless of how busy the browser tab is.
//
// Drum pattern (16 sixteenth-note steps per bar):
//   Hi-hat → every even step     (eighth notes, steps 0 2 4 6 8 10 12 14)
//   Kick   → steps 0 and 8       (beats 1 and 3)
//   Snare  → steps 4 and 12      (beats 2 and 4)
const pulseState = {
  bpm: 96,                     // current tempo in beats per minute
  isPlaying: false,
  current16thNote: 0,          // which step we're on in the 16-step bar (0–15)
  nextNoteTime: 0,             // Web Audio clock timestamp for the next note
  scheduleAheadTime: 0.12,     // seconds to look ahead when scheduling notes
  lookaheadMs: 25,             // how often the scheduler interval fires (ms)
  schedulerTimer: null,        // holds the setInterval reference
  ui: null                     // DOM references populated by initPulseToTempoLab
};

// playKick synthesizes a kick drum with a sine oscillator whose
// pitch drops rapidly (155 Hz → 48 Hz) — the same way a real
// kick drum resonates as the head springs back after the beater
// hits. The very fast gain spike gives it that punchy thump.
function playKick(time) {
  const context = initAudio();
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(155, time);                      // high start (impact)
  osc.frequency.exponentialRampToValueAtTime(48, time + 0.12); // drops to sub-bass

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.95, time + 0.004);  // very fast attack
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);

  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(time);
  osc.stop(time + 0.14);
}

// playSnare layers two sounds together to mimic a real snare:
//   1. White noise through a highpass filter — the airy rattle
//      of the snare wires on the bottom head.
//   2. A short triangle oscillator at ~205 Hz — the body "crack"
//      you feel more than hear.
// Filling a buffer with random values is the standard Web Audio
// approach to generating white noise.
function playSnare(time) {
  const context = initAudio();

  // Build a white noise buffer (random samples in the −1 to +1 range)
  const bufferSize = Math.floor(context.sampleRate * 0.2);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  noise.buffer = buffer;

  // Highpass at 1350 Hz removes the low rumble, leaving the airy snare texture
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.setValueAtTime(1350, time);

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.55, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

  // Triangle oscillator adds the body snap of the snare hit
  const snapOsc = context.createOscillator();
  snapOsc.type = "triangle";
  snapOsc.frequency.setValueAtTime(205, time);

  const snapGain = context.createGain();
  snapGain.gain.setValueAtTime(0.45, time);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.075);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(context.destination);

  snapOsc.connect(snapGain);
  snapGain.connect(context.destination);

  noise.start(time);
  noise.stop(time + 0.12);
  snapOsc.start(time);
  snapOsc.stop(time + 0.08);
}

// playHiHat runs a short white noise burst through two filters
// stacked in series to simulate the metallic shimmer of a cymbal:
//   bandpass at 8800 Hz → isolates the bright metallic frequency band
//   highpass at 6500 Hz → removes any remaining low-end rumble
// The result is a thin, airy tick that sits above the kick and
// snare in the mix without competing with them.
function playHiHat(time) {
  const context = initAudio();

  // Very short buffer (50ms) — hi-hats are crisp and decay almost instantly
  const bufferSize = Math.floor(context.sampleRate * 0.05);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  noise.buffer = buffer;

  const bandPass = context.createBiquadFilter();
  bandPass.type = "bandpass";
  bandPass.frequency.setValueAtTime(8800, time); // center of the metallic shimmer range

  const highPass = context.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.setValueAtTime(6500, time); // cut everything below

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.25, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03); // very fast decay

  noise.connect(bandPass);
  bandPass.connect(highPass);
  highPass.connect(gain);
  gain.connect(context.destination);

  noise.start(time);
  noise.stop(time + 0.035);
}

// updatePulseVisual syncs the on-screen beat indicators with the
// audio timeline. Because notes are scheduled ahead of time, we
// calculate how far in the future a note falls and delay the DOM
// update by that same amount so the lights flash exactly on beat.
// void element.offsetWidth forces a browser reflow, which is the
// trick needed to restart a CSS animation that's already applied.
function updatePulseVisual(beatInBar, atTime) {
  if (!pulseState.ui) {
    return;
  }

  const context = initAudio();
  const delayMs = Math.max(0, (atTime - context.currentTime) * 1000);

  window.setTimeout(() => {
    const { beatIndicator, beatLights, heart } = pulseState.ui;
    beatIndicator.textContent = String(beatInBar);
    beatLights.forEach((light) => {
      const isActive = Number(light.dataset.beat) === beatInBar;
      light.classList.toggle("active", isActive);
    });

    // Remove the class, force a reflow to reset the animation, then re-add it
    heart.classList.remove("pulse");
    void heart.offsetWidth;
    heart.classList.add("pulse");
  }, delayMs);
}

// scheduleNote decides which drum sounds to fire for a given
// 16th-note step and triggers the visual update on each downbeat.
function scheduleNote(beatNumber, time) {
  if (beatNumber % 2 === 0) {     // hi-hat on every eighth note
    playHiHat(time);
  }

  if (beatNumber === 0 || beatNumber === 8) {   // kick on beats 1 and 3
    playKick(time);
  }

  if (beatNumber === 4 || beatNumber === 12) {  // snare on beats 2 and 4
    playSnare(time);
  }

  if (beatNumber % 4 === 0) {  // visual update only on quarter-note downbeats
    const beatInBar = beatNumber / 4 + 1; // convert step index to 1–4 beat number
    updatePulseVisual(beatInBar, time);
  }
}

// nextNote advances the internal clock by exactly one 16th note.
// One 16th note = one quarter of a beat = 60/bpm/4 seconds.
function nextNote() {
  const secondsPerBeat = 60 / pulseState.bpm;
  pulseState.nextNoteTime += 0.25 * secondsPerBeat; // one sixteenth note
  pulseState.current16thNote = (pulseState.current16thNote + 1) % 16; // wrap at bar end
}

// scheduler is called every ~25ms. It looks ahead by scheduleAheadTime
// seconds and pre-queues any notes that fall in that window onto the
// Web Audio clock. This decouples audio timing from JS timer jitter.
function scheduler() {
  const context = initAudio();

  while (pulseState.nextNoteTime < context.currentTime + pulseState.scheduleAheadTime) {
    scheduleNote(pulseState.current16thNote, pulseState.nextNoteTime);
    nextNote();
  }
}

function startBeat() {
  if (!pulseState.ui) {
    return;
  }

  initAudio();

  if (pulseState.isPlaying) {
    return; // already running, do nothing
  }

  const context = initAudio();
  pulseState.isPlaying = true;
  pulseState.current16thNote = 0;              // start at the top of the bar
  pulseState.nextNoteTime = context.currentTime + 0.05; // tiny offset to avoid stuttering on start

  scheduler();
  // Kick off the lookahead loop
  pulseState.schedulerTimer = window.setInterval(scheduler, pulseState.lookaheadMs);
  pulseState.ui.feedback.textContent = `Playing a 4/4 groove at ${pulseState.bpm} BPM.`;
}

function stopBeat() {
  if (!pulseState.ui) {
    return;
  }

  pulseState.isPlaying = false;
  if (pulseState.schedulerTimer) {
    window.clearInterval(pulseState.schedulerTimer);
    pulseState.schedulerTimer = null;
  }

  // Reset the visual back to beat 1 so it looks clean after stopping
  pulseState.ui.feedback.textContent = "Beat stopped. Press Start Beat to play again.";
  pulseState.ui.beatIndicator.textContent = "1";
  pulseState.ui.beatLights.forEach((light) => {
    light.classList.toggle("active", Number(light.dataset.beat) === 1);
  });
}

// initPulseToTempoLab wires the BPM slider and playback buttons
// to the drum scheduler. The BPM value on pulseState is updated
// live so the scheduler always reads the current tempo; no need
// to stop and restart the beat when the slider changes.
function initPulseToTempoLab() {
  const bpmSlider = document.getElementById("pulse-bpm-slider");
  const bpmValue = document.getElementById("pulse-bpm-value");
  const startButton = document.getElementById("pulse-start");
  const stopButton = document.getElementById("pulse-stop");
  const beatIndicator = document.getElementById("beat-indicator");
  const beatLights = Array.from(document.querySelectorAll(".beat-light"));
  const feedback = document.getElementById("pulse-feedback");
  const heart = document.getElementById("pulse-heart");

  if (!bpmSlider || !bpmValue || !startButton || !stopButton || !beatIndicator || !beatLights.length || !feedback || !heart) {
    return;
  }

  pulseState.ui = {
    bpmSlider,
    bpmValue,
    beatIndicator,
    beatLights,
    feedback,
    heart
  };

  pulseState.bpm = Number(bpmSlider.value);
  bpmValue.textContent = String(pulseState.bpm);

  bpmSlider.addEventListener("input", () => {
    pulseState.bpm = Number(bpmSlider.value);
    bpmValue.textContent = bpmSlider.value;
    if (pulseState.isPlaying) {
      feedback.textContent = `Tempo updated: ${pulseState.bpm} BPM. Groove follows in real time.`;
    }
  });

  startButton.addEventListener("click", startBeat);
  stopButton.addEventListener("click", stopBeat);
  window.addEventListener("beforeunload", stopBeat);
}

// ------------------------------
// App Bootstrap
// ------------------------------
// initBrainMusicLab is the single entry point for the whole page.
// Every feature is initialized here in one place so it's easy to
// see at a glance what's active. Each init function is independent
// and will silently bail out if its required DOM elements are
// missing — so nothing breaks if you remove a section from the HTML.
function initBrainMusicLab() {
  initNavigation();
  initThemeToggle();
  initRevealAnimations();
  initQuizzes();
  initConductorSort();
  initFrequencyMatch();
  initCircuitBuilder();
  initMusicPlayground();
  initPulseToTempoLab();
}

// Wait until the DOM is fully parsed before touching any elements.
// The <script> tag in the HTML uses defer, which already ensures
// this, but DOMContentLoaded here makes the intent explicit.
document.addEventListener("DOMContentLoaded", initBrainMusicLab);
