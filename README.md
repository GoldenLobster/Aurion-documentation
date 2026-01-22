# Aurion — Documentation (static template)

This repository contains a static documentation website template for the Aurion music player, built using plain HTML, CSS and JavaScript.

How it works:
- index.html is the single-page shell: header, sidebar, content area, search and footer.
- docs/*.html are HTML fragments (only article content). The shell loads them into the content area.
- js/main.js handles navigation, client-side search (lunr.js), dark mode, and syntax highlighting (Prism).
- Add your images to the img/ folder and reference them from docs pages like: <img src="img/hero.png" />

To run locally:
- Serve the site with a static server (recommended), for example:
  - Python: `python -m http.server 8000` (run from the repo root)
  - Node: `npx serve .`
- Open http://localhost:8000

What to customize:
- Replace docs/*.html with your own documentation content.
- Add images to img/*.png (hero.png, logo.svg, screenshots, etc).
- Edit css/styles.css to change colors or layout.
- Update the pages array in js/main.js to reorder pages or add/remove entries.
- Replace download links in docs/downloads.html with actual release assets.

Optional enhancements you might want:
- Generate docs from Markdown automatically (build step).
- Add offline search indexing during build and ship a static search-index.json to avoid client fetches.
- Add versioned docs or translations.

If you want, I can:
- Convert Markdown files into these HTML fragments automatically,
- Add a script to generate a static search index at build time,
- Or provide a deploy workflow for GitHub Pages.