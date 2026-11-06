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
- Preview **Parked**, **Extended**, **Swivel left** or **Swivel right** mount positions. Edit provisional extension and swivel limits in Structure; TV, soundbar and cradle move together, with selected-position clearance findings.
- Move through **Finished → Behind TV → Behind panel → At drywall → Inside wall**. The inspection level survives camera changes.
- Hover or focus a dimension for emphasis. Its adjacent edit button opens the right drawer and selects its controlling input. Calculated dimensions explain their inputs.
- The drawer groups controls by thing: wall/framing, slatted finish, flat panel/spacers, TV/mount, soundbar/cradle, console, and electrical. **Layout** controls have sliders; physical facts use explicit Edit and verification controls. **Needs verification** collects outstanding measurements and links to their fields. Calculated results link to controlling inputs. Inputs use the selected inch/mm display unit; the model stores millimeters.
- Choose TV rail mounting settings in **TV & mount**. Hook heights, wall plate, lag rows and following blocking derive from fixed TV/rail facts plus the selected setting. **TV & rails** exposes any rail protrusion past the TV silhouette.
- Open **Construction details** for a framing elevation or fixed sections through a mount lag, upper electrical box and panel edge. Each dimension arrow focuses its source input. Plate sizes, rough openings, box/cavity depths, blocking depth, lag row spacing/embedment and in-wall route positions are editable.
- Use **Layout alternatives** to save named snapshots in this browser, compare layout choices and apply a saved layout while keeping current physical facts and verification status.
- **Export construction sheet** downloads a standalone SVG containing all construction views, coordinate schedule, dimensions, model findings and unresolved measurements.
- **Save locally** stores the current design in this browser. The next visit restores the last save. **Load** restores it explicitly; **Export / Import** transfer versioned JSON files. Reset keeps the saved copy. Unsaved edits are not automatically persisted.

V1/v1.5 are complete; v2 mount previews and construction planning are ready for hands-on testing. See [V2 scope and checks](docs/V2.md). Read [Architecture](docs/Architecture.md), [Requirements](docs/Requirements.md) and the [testing guide](docs/Testing.md).

## Limits

Product silhouettes, textures and rib pitch are illustrative. Wall, mount, cradle, blocking, spacers, boxes and cable geometry remain provisional until measured. Layer inspection is not a structural or electrical installation approval. Checks cover selected envelope conflicts and stock dimensions, not continuous articulation paths, fastener design, cable bend radius or code compliance. The preview arm and motion limits are schematic, not measured mount kinematics. External cable lengths/slack are out of scope. Cable routes represent proposed in-wall paths; framing penetrations are not modeled. Box and rough-opening envelopes are combined schematic groups, not separate measured electrical compartments. Camera/view settings are session-only; saved projects retain design data. Named alternatives use a separate browser library; project JSON exports only the current design.

## Local references and deployment

Original handoffs and research live only in ignored `.tmp/`. Tracked catalog data uses generic labels and opaque local-reference IDs. Vendor names, model IDs, shopping links and prices are excluded from source, Git and build output.

Pushes to `main` run formatting, tests and build, then upload only `dist/` to GitHub Pages through `.github/workflows/Pages.yml`. Repository Pages source must be **GitHub Actions**. The configured URL is https://tybenz.github.io/wall/; publishing status is separate from local development.

```sh
npm run check
npm run format:check
```

Construction includes an installation height elevation with numbered floor-height references, part-location coordinates, per-measurement verification links, and a matching SVG download.
