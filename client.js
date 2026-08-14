if (typeof window === 'undefined' || typeof window.__ModuleLoader__ === 'undefined') return

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

              const COUNT = 52
              const LINK = 180
              const rand = (a, b) => a + Math.random() * (b - a)

              let cw = 0
              let ch = 0

              const resize = () => {
                const rw = canvasNode.clientWidth
                const rh = canvasNode.clientHeight
                if (rw === 0 || rh === 0) return false
                cw = rw
                ch = rh
                canvasNode.width = cw
                canvasNode.height = ch
                return true
              }
              if (!resize()) return

              const spawn = (inside) => {
                let x, y, angle
                const w = cw
                const h = ch
                const edge = Math.floor(Math.random() * 4)
                if (edge === 0) { x = inside ? rand(0, w) : -24; y = rand(0, h); angle = rand(-1.1, 1.1) - Math.PI / 2 }
                else if (edge === 1) { x = inside ? rand(0, w) : w + 24; y = rand(0, h); angle = rand(-1.1, 1.1) + Math.PI / 2 }
                else if (edge === 2) { x = rand(0, w); y = inside ? rand(0, h) : -24; angle = rand(0.6, Math.PI - 0.6) }
                else { x = rand(0, w); y = inside ? rand(0, h) : h + 24; angle = rand(-Math.PI + 0.6, -0.6) }
                const speed = rand(2.0, 4.2)
                return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed }
              }

              let particles = []
              for (let i = 0; i < COUNT; i++) particles.push(spawn(true))

              const draw = () => {
                const rw = canvasNode.clientWidth
                const rh = canvasNode.clientHeight
                if (rw === 0 || rh === 0) return
                if (rw !== cw || rh !== ch) {
                  cw = rw
                  ch = rh
                  canvasNode.width = cw
                  canvasNode.height = ch
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
                c.lineWidth = 1.2
                for (let i = 0; i < particles.length; i++) {
                  for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i]
                    const b = particles[j]
                    const dx = a.x - b.x
                    const dy = a.y - b.y
                    const d2 = dx * dx + dy * dy
                    if (d2 < LINK * LINK) {
                      const t = 1 - Math.sqrt(d2) / LINK
                      c.strokeStyle = 'rgba(110, 122, 140, ' + (0.42 * t).toFixed(3) + ')'
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
                  c.arc(p.x, p.y, 2.2, 0, Math.PI * 2)
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
