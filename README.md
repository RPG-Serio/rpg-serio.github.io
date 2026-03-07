# RPG Master Hub

Static, JSON-driven GitHub Pages site to centralize sessions, materials, history, map, cities, regions, gods and characters.

How it works
- All content is defined in `data/*.json` files. Edit those to add or change content.
- The sessions page is the default home (index.html).

Files to edit
- `data/sessions.json` — sessions list (main page)
- `data/characters.json` — characters
- `data/materials.json` — materials (PDF links)
- `data/map.json` — map image
- `data/history.json` — timeline entries
- `data/cities.json` — cities
- `data/regions.json` — regions and city lists
- `data/gods.json` — gods and deities

Quick preview locally
1. Start a simple static server in this folder (Python 3):

```bash
python -m http.server 8000
```

2. Open `http://localhost:8000` and you should see the site.

Deploy to GitHub Pages
1. Create a repo and push this folder's contents to the `gh-pages` branch (or enable Pages from `main`).
2. In repo settings enable GitHub Pages to publish from the branch/folder you choose.

Customization
- Replace the placeholder images/links in `data/*.json` with your assets (you can commit images into `assets/` and reference them relatively).
- Materials accept `pdf` fields and will render download links.
