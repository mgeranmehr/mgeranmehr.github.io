# SWMM 3D Viewer

A static, local-first web application that opens EPA SWMM `.inp` files and
displays their drainage networks in interactive 3D. Model files are parsed in
the browser and are never uploaded.

## Features

- Drag-and-drop or file-picker INP loading
- Built-in example model
- Junction, storage, outfall, conduit, pump, orifice and weir display
- Subcatchment polygons
- 3D orbit, pan and zoom
- Vertical exaggeration
- Layer visibility controls
- Object search, picking and accessible object table
- Responsive light/dark interface
- GitHub Pages deployment workflow

This is a visualization tool, not a SWMM simulation engine. Pipe elevations
between known endpoints are interpolated, and subcatchment surfaces are shown
schematically.

## Run locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run typecheck
npm test
npm run build
```

## Publish on GitHub Pages

1. Create a public GitHub repository and push this project to its `main` branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions**.
4. Push a change or run the `Deploy to GitHub Pages` workflow manually.

The Vite configuration automatically uses `/<repository-name>/` for a project
Pages site and `/` for a `username.github.io` repository.

## Supported INP sections

`[OPTIONS]`, `[JUNCTIONS]`, `[OUTFALLS]`, `[STORAGE]`, `[COORDINATES]`,
`[CONDUITS]`, `[PUMPS]`, `[ORIFICES]`, `[WEIRS]`, `[OUTLETS]`, `[XSECTIONS]`,
`[VERTICES]`, `[SUBCATCHMENTS]`, and `[POLYGONS]`.

Unknown sections are retained in the parser's section inventory and ignored by
the 3D renderer.

## Privacy

The application uses the browser File API. It has no backend, authentication,
analytics or model upload endpoint. Public repository source code and the
included example are public; models opened by visitors remain on their device.

## License

MIT. EPA SWMM is maintained separately by the U.S. Environmental Protection
Agency. This project is not affiliated with or endorsed by the EPA.
