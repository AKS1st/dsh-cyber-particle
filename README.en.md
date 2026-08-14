# cyber-particle — Particle Network Background Plugin for DeepSeek Harness

English | [中文](./README.md)

Adds an animated particle-network background to the DeepSeek Harness web UI: gray particles drift in from random screen edges, cross the viewport in straight lines, and re-enter from a new edge after leaving; particles closer than a threshold distance are automatically connected with lines, forming a continuously evolving mesh.

Rendered in a full-screen overlay with `pointer-events: none`, it never intercepts clicks or scrolling and does not change any UI colors. No npm runtime dependencies.

## Preview

Light theme:

![Light theme](assets/image_light.png)

Dark theme:

![Dark theme](assets/image_dark.png)

## Install

```sh
# Option 1: local directory
dsh plugin --profile web add /path/to/dsh-cyber-particle

# Option 2: from the git repository
dsh plugin --profile web add github:AKS1st/dsh-cyber-particle

# Restart the web service for the profile change to take effect
dsh web
```

## Uninstall

```sh
dsh plugin --profile web remove cyber-particle
dsh web
```

## Tuning parameters (constants at the top of client.js)

| Constant | Default | Meaning |
| --- | --- | --- |
| `COUNT` | 52 | Number of particles |
| `LINK` | 180 | Link distance threshold (px) |
| Particle color | `rgba(125,137,153,0.9)` | Gray dots, radius 2.2px |
| Link color | `rgba(110,122,140, 0.42·(1-d/LINK))` | Stronger when closer |

Restart dsh web after adjusting.
