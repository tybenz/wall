# Wall development conventions

- Use PascalCase for every TypeScript/TSX filename, including configuration and test stems.
- Keep React presentation separate from vanilla controllers/stores and pure geometry functions.
- All domain lengths are millimeters. Convert inches only at presentation/input seams.
- Retain sources and uncertainty. Never silently promote assumed geometry to measured facts. Organize the editor by thing, with Layout choices separate from physical facts and read-only calculations. Only layout choices get sliders; explicit fact edits clear verification when values change. Applying layout alternatives must preserve the current physical baseline.
- Use preset views and inspection levels; no freeform camera navigation or drag placement. TV-side rail mounting positions are layout choices; TV holes, rail geometry and available shifts are physical facts. Hook-to-TV offsets are derived from the chosen rail setting.
- V1/v1.5 and the v2 mount-position slice are accepted. V2 focuses on construction inside and attached to the wall: framing, blocking, plates, boxes, in-wall routes, spacers and lag paths. External lead lengths, service slack and routing between TV/console and wall ports are explicitly out of scope. Construction sections, named alternatives and dimensioned exports are authorized. See docs/V2.md.
- Keep vendor/product names, model identifiers, shopping links and prices out of source and version control. Keep original research, product mappings and handoffs only in the gitignored `.tmp/` directory. Use generic part names and opaque local-reference identifiers in tracked data.
- GitHub Pages builds and deploys `main` through `.github/workflows/Pages.yml`. Preserve the `/wall/` asset base.
- Remote configuration and pushes to `tybenz/wall` are authorized. Do not publish ignored local artifacts.
- User-driven verification: do not run tests, builds, type checks or a dev server unless the user explicitly requests it. Make code changes and provide concise manual test steps. Keep the existing CI configuration.

- Electrical planning is limited to upper power/HDMI plate height and TV coverage, comparing above/below the mount. Assume vertical runs beside a stud; do not add lateral routing, cable budgets or framing-passage controls.
