# Wall

A parametric TV wall designer: start with the desired finished arrangement and work back toward verifiable installation geometry.

## Run

Node20.19+ or22.12+ is required by Vite. Dependencies are pinned in `package-lock.json`.

```sh
npm ci
npm run dev
```

`npm run check` runs model/controller tests, TypeScript checking, and a production build.

## Current milestone

Milestone1 establishes product evidence, a shared spatial model, vanilla controller/store reactivity, and a small diagnostic UI. The depth schedule updates when a temporary input loses focus. Finished product rendering, preset view/layer controls, the editing drawer and persistence belong to later agreed milestones.

Read [the architecture](docs/Architecture.md) for the interfaces and [the requirements](docs/Requirements.md) for the full v1 scope. Original handoffs and research are local-only artifacts in the gitignored `.tmp/` directory. Tracked catalog data uses generic labels and local-reference identifiers, with no vendor names, model identifiers, shopping links or prices.

## Deployment

Pushes to `main` run format checks, tests and a production build, then deploy only `dist/` to GitHub Pages through `.github/workflows/Pages.yml`. Repository Settings → Pages → Source must be **GitHub Actions**.

The app is hosted at https://tybenz.github.io/wall/. Vite's asset base is `/wall/`. Run `npm run dev` and open its `/wall/` path for local development. Research in `.tmp/` is excluded from both Git and the build output.
