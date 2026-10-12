# Atlas Voyage

An immersive 3D scroll journey site. Solid deep navy background with white text and amber accent. A fixed Three.js starfield with floating low poly shapes reacts to scroll and mouse while pinned chapters guide the voyage.

## Features

1. Sticky nav with hamburger menu under 820px, smooth Lenis anchor scrolling, chapter progress dots and top scroll progress bar
2. Hero with staggered intro, scroll cue and dual call to action over the live 3D canvas
3. Three pinned chapters (Depart, Orbit, Land) with solid color cards; the 3D scene shifts color, spread and speed per chapter
4. Highlights grid with six solid art cards, hover tilt and animated stat counters
5. Contact form with inline validation plus footer with back to top

## Run

One command from this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. All pages are static so any static host works, including GitHub Pages.

## Customize Guide

* Colors: edit CSS variables in `styles.css` under `:root` (`--navy`, `--amber`, `--card`, and others)
* Copy: edit headings and paragraphs directly in `index.html`
* 3D scene: edit `initScene` in `script.js` to change shape count, colors, speed, spread and chapter targets
* Motion: tune Lenis duration, GSAP pin length and scrub values in `script.js`
* Fallbacks: if any CDN fails the page still renders; Three.js hides the canvas, GSAP falls back to IntersectionObserver reveals, Lenis falls back to native smooth scroll
* Accessibility: `prefers-reduced-motion` renders one static 3D frame and skips pins, tilt and smooth scroll extras

## Structure

```text
index.html   Page markup, nav, hero, chapters, highlights, contact, footer
styles.css   All styling, solid colors only, responsive 360px 768px 1200px
script.js    Three.js scene, Lenis, GSAP pins, dots, counters, tilt, form
README.md    This guide
```

## Notes

* Stack is static only with CDN scripts for Three.js, GSAP plus ScrollTrigger, Lenis and the Sora font with system fallback
* No build step required
* Canvas pixel ratio is capped at 2 and resizes with the window
* Pins are disabled on mobile where chapters stack vertically
