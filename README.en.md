# cyber-particle — Particle Network Background Plugin for DeepSeek Harness

English | [中文](./README.md)

Adds an animated particle-network background to the DeepSeek Harness web UI: gray particles drift in from random screen edges, cross the viewport in straight lines, and re-enter from a new edge after leaving; particles closer than a threshold distance are automatically connected with lines, forming a continuously evolving mesh. It does not change any UI colors and does not affect mouse or keyboard interaction.

> Implementation note: the animation canvas renders inside the `shell.overlay` layer with `pointer-events: none` — purely visual, it never intercepts clicks or scrolling.

Requires the DeepSeek Harness dsh web shell (the client bundle registers through the `__ModuleLoader__` module system); the plugin itself has no npm runtime dependencies.

## Preview

Light theme:

![Light theme](assets/image_light.png)

Dark theme:

![Dark theme](assets/image_dark.png)

## Files

| File | Purpose |
| --- | --- |
| `package.json` | Package declaration: `dsh.client.platform: "web"`, `./client` export (consumed by the client-modules scanner) |
| `client.js` | Browser bundle: registers the plugin via `window.__ModuleLoader__.load({ id, factory })`, Canvas particle animation |
| `index.js` | Node half: empty `apply` so the plugin row activates in the host loader |
| `install.sh` | One-command installer into the current DSH web profile |
| `README.en.md` | This document (English) |
| `README.md` | Chinese documentation (primary) |
| `assets/` | Preview screenshots (light / dark theme) |

## Install (no need to re-run if already installed)

```bash
./install.sh
```

The script copies the three files to `$DSH_HOME/profiles/web/node_modules/cyber-particle/` and ensures `$DSH_HOME/profiles/web/cordis.patch.yml` contains the mount row:

```yaml
- insert:
    - id: cyber-particle
      name: cyber-particle
```

**When it takes effect**: profile composition changes require a restart of dsh web (`dsh web`). After the restart the plugin loads automatically on every startup — no approval needed, and it survives process restarts.

## Uninstall

```bash
# 1. Remove the cyber-particle row from the patch (edit cordis.patch.yml)
# 2. Delete the package directory (defaults to ~/.dsh when DSH_HOME is unset)
rm -rf "${DSH_HOME:-$HOME/.dsh}/profiles/web/node_modules/cyber-particle"
# 3. Restart dsh web
```

## Tuning parameters (constants at the top of client.js)

| Constant | Default | Meaning |
| --- | --- | --- |
| `COUNT` | 52 | Number of particles |
| `LINK` | 180 | Link distance threshold (px) |
| Particle color | `rgba(125,137,153,0.9)` | Gray dots, radius 2.2px |
| Link color | `rgba(110,122,140, 0.42·(1-d/LINK))` | Stronger when closer |

Restart dsh web after adjusting.
