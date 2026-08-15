if (typeof window !== 'undefined' && typeof window.__ModuleLoader__ !== 'undefined') {
  window.__ModuleLoader__.load({
    id: 'cyber-particle',
    factory(require) {
      const React = require('react')
      return {
        inject: ['timer'],
        apply(ctx) {
          const slots = ctx.get('slots')
          if (slots === undefined) return
          slots.inject('shell.overlay', () => slots.register(
            { name: 'shell.overlay', id: 'cybergrid-hud', order: -100 },
            () => {
              const [canvasNode, setCanvasNode] = React.useState(null)
              React.useEffect(() => {
                if (canvasNode === null) return
                const c = canvasNode.getContext('2d')
                if (c === null) return

                // ---- Display-consistency tuning ------------------------------------
                // The scene is authored for a 2560x1440 (27" 2K) reference viewport.
                // On other screens we keep the network *proportional* instead of using
                // fixed pixel sizes/counts:
                //   * devicePixelRatio rendering keeps lines/dots crisp on high-DPI
                //     (e.g. 13" 4K @ 200% OS zoom, DPR = 2) instead of blurry/upscaled.
                //   * `scale` shrinks spacing, line width, dot radius and speed with the
                //     viewport area so a small screen isn't flooded with oversized
                //     particles, and a huge screen isn't left sparse.
                const REF_W = 2560
                const REF_H = 1440
                const REF_AREA = REF_W * REF_H
                const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
                const rand = (a, b) => a + Math.random() * (b - a)
                // Precomputed link styles (alpha by distance bucket) to avoid per-frame string allocation.
                const LINK_STYLES = []
                for (let i = 0; i <= 20; i++) {
                  LINK_STYLES.push('rgba(110, 122, 140, ' + (0.42 * (1 - i / 20)).toFixed(3) + ')')
                }
                let frame = 0

                let cw = 0            // logical (CSS-pixel) width
                let ch = 0            // logical (CSS-pixel) height
                let dpr = 1           // capped device pixel ratio
                let scale = 1         // geometric scale vs. reference viewport
                let COUNT = 52
                let LINK = 180
                let LINE_W = 1.2
                let DOT_R = 2.2
                let SPEED_MIN = 2.0
                let SPEED_MAX = 4.2

                const applySize = () => {
                  const rw = canvasNode.clientWidth
                  const rh = canvasNode.clientHeight
                  if (rw === 0 || rh === 0) return false
                  const nextDpr = clamp(window.devicePixelRatio || 1, 1, 2)
                  const nextScale = clamp(Math.sqrt((rw * rh) / REF_AREA), 0.55, 1.5)
                  if (rw === cw && rh === ch && nextDpr === dpr && nextScale === scale) return true
                  cw = rw
                  ch = rh
                  dpr = nextDpr
                  scale = nextScale
                  // Count scales with area; sizes scale with the geometric ratio so the
                  // network keeps the same *relative* look on any screen size.
                  COUNT = Math.round(clamp(52 * scale * scale, 24, 90))
                  LINK = 180 * scale
                  LINE_W = 1.2 * scale
                  DOT_R = 2.2 * scale
                  SPEED_MIN = 2.0 * scale
                  SPEED_MAX = 4.2 * scale
                  // Backing store in device pixels; the transform keeps drawing in CSS px.
                  canvasNode.width = Math.round(cw * dpr)
                  canvasNode.height = Math.round(ch * dpr)
                  c.setTransform(dpr, 0, 0, dpr, 0, 0)
                  return true
                }

                const spawn = (inside) => {
                  let x, y, angle
                  const w = cw
                  const h = ch
                  const edge = Math.floor(Math.random() * 4)
                  if (edge === 0) { x = inside ? rand(0, w) : -24; y = rand(0, h); angle = rand(-1.1, 1.1) - Math.PI / 2 }
                  else if (edge === 1) { x = inside ? rand(0, w) : w + 24; y = rand(0, h); angle = rand(-1.1, 1.1) + Math.PI / 2 }
                  else if (edge === 2) { x = rand(0, w); y = inside ? rand(0, h) : -24; angle = rand(0.6, Math.PI - 0.6) }
                  else { x = rand(0, w); y = inside ? rand(0, h) : h + 24; angle = rand(-Math.PI + 0.6, -0.6) }
                  const speed = rand(SPEED_MIN, SPEED_MAX)
                  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed }
                }

                let particles = []

                const resizeParticles = () => {
                  while (particles.length < COUNT) particles.push(spawn(true))
                  if (particles.length > COUNT) particles.length = COUNT
                }

                if (!applySize()) return
                resizeParticles()

                const draw = () => {
                  // Size probe throttled to ~every 0.4s: reading clientWidth/Height can force
                  // a synchronous layout when the page is dirty, which stalls the animation
                  // whenever the host UI does layout work. applySize() also re-applies the
                  // DPR transform and re-sizes the particle pool when the window moves
                  // between monitors with different scaling.
                  frame++
                  if (frame % 12 === 0) {
                    if (!applySize()) return
                    resizeParticles()
                  }
                  const w = cw
                  const h = ch
                  c.clearRect(0, 0, w, h)
                  for (const p of particles) {
                    p.x += p.vx
                    p.y += p.vy
                  }
                  for (let i = 0; i < particles.length; i++) {
                    const p = particles[i]
                    if (p.x < -30 || p.x > w + 30 || p.y < -30 || p.y > h + 30) {
                      particles[i] = spawn(false)
                    }
                  }
                  c.lineWidth = LINE_W
                  for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                      const a = particles[i]
                      const b = particles[j]
                      const dx = a.x - b.x
                      const dy = a.y - b.y
                      const d2 = dx * dx + dy * dy
                      if (d2 < LINK * LINK) {
                        const t = 1 - Math.sqrt(d2) / LINK
                        c.strokeStyle = LINK_STYLES[Math.round(t * 20)]
                        c.beginPath()
                        c.moveTo(a.x, a.y)
                        c.lineTo(b.x, b.y)
                        c.stroke()
                      }
                    }
                  }
                  c.fillStyle = 'rgba(125, 137, 153, 0.9)'
                  for (const p of particles) {
                    c.beginPath()
                    c.arc(p.x, p.y, DOT_R, 0, Math.PI * 2)
                    c.fill()
                  }
                }

                draw()

                let reduce = false
                try {
                  reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                } catch (e) { /* ignore */ }
                if (reduce) return

                let timer = null
                const stop = () => {
                  if (timer !== null) {
                    timer()
                    timer = null
                  }
                }
                const start = () => {
                  if (timer === null) timer = ctx.interval(draw, 33)
                }
                const onVisibility = () => {
                  if (document.hidden) stop()
                  else start()
                }
                document.addEventListener('visibilitychange', onVisibility)
                if (!document.hidden) start()
                return () => {
                  document.removeEventListener('visibilitychange', onVisibility)
                  stop()
                }
              }, [canvasNode])

              return React.createElement('div', {
                style: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 },
                'aria-hidden': true,
              }, React.createElement('canvas', {
                ref: setCanvasNode,
                style: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' },
              }))
            },
          ))
        },
      }
    },
  })
}
