/**
 * Cyber Particle Network — browser half.
 *
 * 全屏粒子网络背景（shell.overlay）+ Web 设置里的「粒子背景」设置页
 * （settings.section）：滑动条调节数量/半径/粗细/连线距离/速度，调色板
 * 调节粒子与线条颜色，支持一键重置。配置通过 /__cyber-particle 路由由
 * Host 半部持久化到 $DSH_HOME/cyber-particle.json。
 */
if (typeof window !== 'undefined' && typeof window.__ModuleLoader__ !== 'undefined') {
  window.__ModuleLoader__.load({
    id: 'cyber-particle',
    factory(require) {
      const React = require('react')
      const API = '/__cyber-particle'

      // 与 index.js 的 DEFAULTS 保持一致。
      const DEFAULTS = {
        count: 52,
        dotRadius: 2.2,
        lineWidth: 1.2,
        linkDist: 180,
        speed: 3.0,
        particleColor: '#7d8999',
        lineColor: '#6e7a8c',
      }

      const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

      function hexToRgb(hex) {
        const h = String(hex || '').replace('#', '')
        if (!/^[0-9a-fA-F]{6}$/.test(h)) return '0, 0, 0'
        return parseInt(h.slice(0, 2), 16) + ', ' + parseInt(h.slice(2, 4), 16) + ', ' + parseInt(h.slice(4, 6), 16)
      }

      function hexToRgba(hex, alpha) {
        return 'rgba(' + hexToRgb(hex) + ', ' + alpha + ')'
      }

      // ---------- 国际化字典 ----------
      const NS = 'cyber-particle'
      const zh = {
        title: '粒子背景',
        reset: '重置为默认',
        count: '粒子数量',
        dotRadius: '粒子半径',
        lineWidth: '线条粗细',
        linkDist: '连线距离',
        speed: '移动速度',
        particleColor: '粒子颜色',
        lineColor: '线条颜色',
        few: '少', many: '多',
        small: '小', large: '大',
        thin: '细', thick: '粗',
        near: '近', far: '远',
        slow: '慢', fast: '快',
        very: '极',
        medium: '适中',
        hint: '调整实时生效并自动保存。这里的多少是相对感受，插件会按屏幕尺寸与缩放自动归一化，让不同设备上看起来一致。',
      }
      const en = {
        title: 'Particle Background',
        reset: 'Reset to default',
        count: 'Particle count',
        dotRadius: 'Particle size',
        lineWidth: 'Line width',
        linkDist: 'Link distance',
        speed: 'Speed',
        particleColor: 'Particle color',
        lineColor: 'Line color',
        few: 'Few', many: 'Many',
        small: 'Small', large: 'Large',
        thin: 'Thin', thick: 'Thick',
        near: 'Near', far: 'Far',
        slow: 'Slow', fast: 'Fast',
        very: 'Very ',
        medium: 'Medium',
        hint: 'Adjustments apply live and save automatically. Levels are relative — the plugin normalizes across screen sizes and scaling so it looks consistent on different devices.',
      }

      return {
        inject: ['timer'],
        apply(ctx) {
          const slots = ctx.get('slots')
          if (slots === undefined) return

          // ---------- 国际化 ----------
          const locale = ctx.get('locale')
          let t = (key) => (zh[key] !== undefined ? zh[key] : key)
          if (locale !== undefined) {
            t = locale.bind(NS)
            const disposeLocale = locale.register(NS, { zh, en })
            ctx.on('dispose', () => { disposeLocale() })
          }

          // ---------- 共享配置 store ----------
          let config = { ...DEFAULTS }
          const listeners = new Set()
          const store = {
            get() { return config },
            set(next) {
              config = { ...config, ...next }
              for (const fn of listeners) fn(config)
            },
            subscribe(fn) {
              listeners.add(fn)
              return () => { listeners.delete(fn) }
            },
          }

          const postConfig = (patch) => {
            fetch(API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ config: patch }),
            }).catch(() => {})
          }

          const updateConfig = (patch) => {
            store.set(patch)
            postConfig(patch)
          }

          const resetConfig = () => {
            store.set({ ...DEFAULTS })
            fetch(API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'reset' }),
            }).catch(() => {})
          }

          // 启动时拉取持久化配置，失败静默（使用默认值）。
          fetch(API, { cache: 'no-store' })
            .then((res) => res.json())
            .then((data) => {
              if (data && typeof data === 'object') store.set(data)
            })
            .catch(() => {})

          // ---------- 粒子覆盖层 ----------
          function ParticleOverlay({ store }) {
            const [canvasNode, setCanvasNode] = React.useState(null)
            React.useEffect(() => {
              if (canvasNode === null) return
              const c = canvasNode.getContext('2d')
              if (c === null) return

              const REF_W = 2560
              const REF_H = 1440
              const REF_AREA = REF_W * REF_H
              const rand = (a, b) => a + Math.random() * (b - a)

              let frame = 0
              let cw = 0
              let ch = 0
              let dpr = 1
              let scale = 1
              let cfg = store.get()

              let COUNT = 52
              let LINK = 180
              let LINE_W = 1.2
              let DOT_R = 2.2
              let SPD_MIN = 2.0
              let SPD_MAX = 4.2
              let DOT_FILL = 'rgba(125, 137, 153, 0.9)'
              let LINK_STYLES = []

              const buildLinkStyles = (hex) => {
                const rgb = hexToRgb(hex)
                const styles = []
                for (let i = 0; i <= 20; i++) {
                  styles.push('rgba(' + rgb + ', ' + (0.42 * (1 - i / 20)).toFixed(3) + ')')
                }
                return styles
              }

              const applySize = () => {
                const rw = canvasNode.clientWidth
                const rh = canvasNode.clientHeight
                if (rw === 0 || rh === 0) return false
                const nextDpr = clamp(window.devicePixelRatio || 1, 1, 2)
                const nextScale = clamp(Math.sqrt((rw * rh) / REF_AREA), 0.55, 1.5)
                const nextCfg = store.get()
                if (rw === cw && rh === ch && nextDpr === dpr && nextScale === scale && nextCfg === cfg) return true
                cw = rw
                ch = rh
                dpr = nextDpr
                scale = nextScale
                cfg = nextCfg
                COUNT = Math.round(clamp(cfg.count * scale * scale, 8, 240))
                LINK = cfg.linkDist * scale
                LINE_W = cfg.lineWidth * scale
                DOT_R = cfg.dotRadius * scale
                SPD_MIN = cfg.speed * (2 / 3)
                SPD_MAX = cfg.speed * 1.4
                DOT_FILL = hexToRgba(cfg.particleColor, 0.9)
                LINK_STYLES = buildLinkStyles(cfg.lineColor)
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
                const speed = rand(SPD_MIN, SPD_MAX)
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
                c.fillStyle = DOT_FILL
                for (const p of particles) {
                  c.beginPath()
                  c.arc(p.x, p.y, DOT_R, 0, Math.PI * 2)
                  c.fill()
                }
              }

              draw()

              // 配置变化即时生效：重新派生尺寸/颜色并重建粒子池。
              const unsubscribe = store.subscribe(() => {
                if (applySize()) resizeParticles()
              })

              let reduce = false
              try {
                reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
              } catch (e) { /* ignore */ }

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
              if (!reduce && !document.hidden) start()
              return () => {
                unsubscribe()
                document.removeEventListener('visibilitychange', onVisibility)
                stop()
              }
            }, [canvasNode, store])

            return React.createElement('div', {
              style: { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 },
              'aria-hidden': true,
            }, React.createElement('canvas', {
              ref: setCanvasNode,
              style: { position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' },
            }))
          }

          // ---------- 设置页 ----------
          const SLIDER_FIELDS = [
            { key: 'count', labelKey: 'count', min: 10, max: 120, step: 1, lowKey: 'few', highKey: 'many' },
            { key: 'dotRadius', labelKey: 'dotRadius', min: 0.5, max: 6, step: 0.1, lowKey: 'small', highKey: 'large' },
            { key: 'lineWidth', labelKey: 'lineWidth', min: 0.2, max: 4, step: 0.1, lowKey: 'thin', highKey: 'thick' },
            { key: 'linkDist', labelKey: 'linkDist', min: 40, max: 400, step: 5, lowKey: 'near', highKey: 'far' },
            { key: 'speed', labelKey: 'speed', min: 0.5, max: 8, step: 0.1, lowKey: 'slow', highKey: 'fast' },
          ]
          const COLOR_FIELDS = [
            { key: 'particleColor', labelKey: 'particleColor' },
            { key: 'lineColor', labelKey: 'lineColor' },
          ]

          function useStore(store) {
            const [value, setValue] = React.useState(store.get())
            React.useEffect(() => store.subscribe(setValue), [store])
            return value
          }

          // 把数值映射成定性档位，避免不同屏幕尺寸下绝对数值引起歧义。
          function describe(t, value, min, max, lowKey, highKey) {
            const r = clamp((value - min) / (max - min), 0, 1)
            if (r < 0.2) return t('very') + t(lowKey)
            if (r < 0.4) return t(lowKey)
            if (r < 0.6) return t('medium')
            if (r < 0.8) return t(highKey)
            return t('very') + t(highKey)
          }

          function ParticleSettings({ store, updateConfig, resetConfig, t }) {
            const cfg = useStore(store)

            const sliderRows = SLIDER_FIELDS.map((field) => {
              const value = Number(cfg[field.key])
              const level = describe(t, value, field.min, field.max, field.lowKey, field.highKey)
              return React.createElement('div', { className: 'cp-field', key: field.key },
                React.createElement('div', { className: 'cp-field-label' }, t(field.labelKey)),
                React.createElement('span', { className: 'cp-cap' }, t(field.lowKey)),
                React.createElement('input', {
                  className: 'cp-range',
                  type: 'range',
                  min: field.min,
                  max: field.max,
                  step: field.step,
                  value,
                  onChange: (e) => updateConfig({ [field.key]: Number(e.target.value) }),
                }),
                React.createElement('span', { className: 'cp-cap' }, t(field.highKey)),
                React.createElement('div', { className: 'cp-badge' }, level))
            })

            const colorRows = COLOR_FIELDS.map((field) => {
              const value = String(cfg[field.key] || '')
              return React.createElement('div', { className: 'cp-field', key: field.key },
                React.createElement('div', { className: 'cp-field-label' }, t(field.labelKey)),
                React.createElement('input', {
                  className: 'cp-color',
                  type: 'color',
                  value,
                  onChange: (e) => updateConfig({ [field.key]: e.target.value }),
                }),
                React.createElement('div', { className: 'cp-hex' }, value))
            })

            return React.createElement('div', { className: 'cp-page' },
              React.createElement('div', { className: 'cp-head' },
                React.createElement('div', { className: 'cp-title' }, t('title')),
                React.createElement('button', { className: 'cp-btn', onClick: resetConfig }, t('reset'))),
              sliderRows,
              colorRows,
              React.createElement('div', { className: 'cp-hint' }, t('hint')))
          }

          // ---------- 样式 ----------
          const styleEl = document.createElement('style')
          styleEl.textContent = `
            .cp-page { padding: 2px 0 16px; font-size: 13px; color: var(--dsw-alias-label-primary); }
            .cp-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
            .cp-title { font-size: 15px; font-weight: 600; margin-right: auto; }
            .cp-btn { padding: 4px 12px; font-size: 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); cursor: pointer; }
            .cp-btn:hover { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }
            .cp-field { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
            .cp-field:last-of-type { border-bottom: none; }
            .cp-field-label { width: 84px; flex: none; font-size: 12px; color: var(--dsw-alias-label-secondary); }
            .cp-range { flex: 1; min-width: 0; accent-color: var(--dsw-alias-brand-primary); }
            .cp-cap { flex: none; width: 16px; text-align: center; font-size: 11px; color: var(--dsw-alias-label-secondary); }
            .cp-badge { flex: none; min-width: 40px; text-align: center; font-size: 12px; color: var(--dsw-alias-brand-primary); border: 1px solid var(--dsw-alias-border-l2); border-radius: 999px; padding: 1px 8px; background: var(--dsw-alias-bg-layer-2); }
            .cp-color { width: 42px; height: 26px; padding: 0; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: transparent; cursor: pointer; }
            .cp-hex { font-variant-numeric: tabular-nums; font-size: 12px; color: var(--dsw-alias-label-secondary); }
            .cp-hint { font-size: 11px; color: var(--dsw-alias-label-secondary); margin-top: 12px; line-height: 1.6; }
          `
          document.head.appendChild(styleEl)
          ctx.on('dispose', () => {
            if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl)
          })

          // ---------- 注册 Slot ----------
          slots.inject('shell.overlay', () => slots.register(
            { name: 'shell.overlay', id: 'cybergrid-hud', order: -100 },
            () => React.createElement(ParticleOverlay, { store }),
          ))

          slots.inject('settings.section', () => slots.register(
            { name: 'settings.section', id: 'cyber-particle', order: 35, label: () => t('title'), locale: NS },
            (props) => React.createElement(ParticleSettings, { store, updateConfig, resetConfig, t: props.t }),
          ))
        },
      }
    },
  })
}
