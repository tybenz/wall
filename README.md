# Wall

A parametric wall-design studio with fixed front, side and orthographic isometric views. Adjust the composition, peel back its layers, inspect dimensions and save a design locally.

## Run locally

Use Node 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

Open the `/wall/` URL printed by Vite, normally http://localhost:5173/wall/. The 3D renderer needs WebGL; editing and project export remain available if rendering cannot start.

## Try the design

- Select **Front**, **Side** or **Isometric**. Fit and zoom buttons keep the camera on preset axes; there are no orbit or drag controls.
- Move through **Finished → Behind TV → Behind panel → At drywall → Inside wall**. The inspection level survives camera changes.
- Hover or focus a dimension for emphasis. Its adjacent edit button opens the right drawer and selects its controlling input. Calculated dimensions explain their inputs.
- Use the drawer to edit placement, surfaces, part sizes/finishes, stud offsets, schematic mounting geometry and electrical positions. Valid numbers update the drawing immediately. Inputs use the selected inch/mm display unit; the model stores millimeters.
- **Save locally** stores the current design in this browser. The next visit restores the last save. **Load** restores it explicitly; **Export / Import** transfer versioned JSON files. Reset keeps the saved copy. Unsaved edits are not automatically persisted.

The current app implements the agreed v1 for hands-on user testing. Read [Architecture](docs/Architecture.md), [Requirements](docs/Requirements.md) and the [testing guide](docs/Testing.md).

## Limits

Product silhouettes, textures and rib pitch are illustrative. Wall, mount, cradle, blocking, spacers, boxes and cable geometry remain provisional until measured. Layer inspection is not a structural or electrical installation approval. Checks cover selected envelope conflicts and stock dimensions, not articulation, fastener design, cable bend radius or code compliance. Camera/view settings are session-only; saved projects retain design data.

## Local references and deployment

Original handoffs and research live only in ignored `.tmp/`. Tracked catalog data uses generic labels and opaque local-reference IDs. Vendor names, model IDs, shopping links and prices are excluded from source, Git and build output.

Pushes to `main` run formatting, tests and build, then upload only `dist/` to GitHub Pages through `.github/workflows/Pages.yml`. Repository Pages source must be **GitHub Actions**. The configured URL is https://tybenz.github.io/wall/; publishing status is separate from local development.

```sh
npm run check
npm run format:check
```
