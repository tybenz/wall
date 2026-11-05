# Wall development conventions

- Use PascalCase for every TypeScript/TSX filename, including configuration and test stems.
- Keep React presentation separate from vanilla controllers/stores and pure geometry functions.
- All domain lengths are millimeters. Convert inches only at presentation/input seams.
- Retain sources and uncertainty. Never silently promote assumed geometry to measured facts.
- Use preset views and inspection levels; no freeform camera navigation or drag placement.
- Implement one agreed milestone at a time. Review interfaces and working behavior with the user before the next milestone.
- Keep vendor/product names, model identifiers, shopping links and prices out of source and version control. Keep original research, product mappings and handoffs only in the gitignored `.tmp/` directory. Use generic part names and opaque local-reference identifiers in tracked data.
- GitHub Pages builds and deploys `main` through `.github/workflows/Pages.yml`. Preserve the `/wall/` asset base.
- Remote configuration and pushes to `tybenz/wall` are authorized. Do not publish ignored local artifacts.
- Run `npm run check` for changes affecting the model or application.
