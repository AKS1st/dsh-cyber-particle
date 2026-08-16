/**
 * Cyber Particle Network — node half.
 *
 * 为 Web 设置页提供粒子背景参数的可持久化存储：通过 webServer 注册
 * /__cyber-particle 路由（GET 返回当前配置，POST 合并更新 / action=reset
 * 重置），配置写入 $DSH_HOME/cyber-particle.json，进程重启后自动恢复。
 * 浏览器端 client 半部通过 fetch 调用该路由。
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

export const name = 'cyber-particle'
// webServer 由 web 组合保证提供；声明为硬依赖使 apply 等待其就绪后再运行，
// 避免启动时序抖动导致路由未注册。
export const inject = ['webServer']

// 与 client.js 中 DEFAULTS 保持一致：默认值即原「27 寸 2K 参考」观感。
const DEFAULTS = {
  count: 52, // 粒子数量（基准值，绘制时按视口面积缩放）
  dotRadius: 2.2, // 粒子半径（px）
  lineWidth: 1.2, // 线条粗细（px）
  linkDist: 180, // 连线距离阈值（px）
  speed: 3.0, // 移动速度基准（实际取 speed*2/3 ~ speed*1.4 随机）
  particleColor: '#7d8999', // 粒子颜色（hex）
  lineColor: '#6e7a8c', // 线条颜色（hex）
}

// 数值字段的取值范围（越界时按边界截断）。
const LIMITS = {
  count: [10, 120],
  dotRadius: [0.5, 6],
  lineWidth: [0.2, 4],
  linkDist: [40, 400],
  speed: [0.5, 8],
}

const NUM_KEYS = Object.keys(LIMITS)
const COLOR_KEYS = ['particleColor', 'lineColor']

function clamp(value, lo, hi) {
  const n = Number(value)
  if (!Number.isFinite(n)) return undefined
  return Math.min(hi, Math.max(lo, n))
}

function isHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

export function apply(ctx) {
  const webServer = ctx.webServer
  const dshHome = process.env.DSH_HOME || join(process.env.HOME || '', '.dsh')
  const dataFile = join(dshHome, 'cyber-particle.json')

  let config = { ...DEFAULTS }

  function normalize(raw) {
    const out = { ...DEFAULTS }
    if (!raw || typeof raw !== 'object') return out
    for (const key of NUM_KEYS) {
      const value = clamp(raw[key], LIMITS[key][0], LIMITS[key][1])
      if (value !== undefined) out[key] = value
    }
    for (const key of COLOR_KEYS) {
      if (isHexColor(raw[key])) out[key] = raw[key]
    }
    return out
  }

  function load() {
    try {
      if (!existsSync(dataFile)) return
      const raw = JSON.parse(readFileSync(dataFile, 'utf8'))
      config = normalize(raw)
    } catch {
      // 文件损坏时回退默认值，下次写入会覆盖。
    }
  }

  function persist() {
    try {
      mkdirSync(dshHome, { recursive: true })
      const tmp = dataFile + '.' + process.pid + '.tmp'
      writeFileSync(tmp, JSON.stringify(config, null, 2))
      renameSync(tmp, dataFile)
    } catch {
      // 写盘失败静默：保留内存态，下次变更再试。
    }
  }

  load()

  function sendJson(res, data, status) {
    const text = JSON.stringify(data)
    res.statusCode = status || 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Length', Buffer.byteLength(text))
    res.end(text)
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = []
      let size = 0
      let overflow = false
      req.on('data', (chunk) => {
        size += chunk.length
        if (size > 64 * 1024) {
          overflow = true
          return
        }
        chunks.push(chunk)
      })
      req.on('end', () => {
        if (overflow) {
          reject(new Error('body too large'))
          return
        }
        try {
          resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
        } catch (error) {
          reject(error)
        }
      })
      req.on('error', reject)
    })
  }

  const disposeRoute = webServer.register({
    kind: 'exact',
    path: '/__cyber-particle',
    handler: (req, res) => {
      if (req.method === 'GET') {
        sendJson(res, config)
        return
      }
      if (req.method !== 'POST') {
        sendJson(res, { ok: false, error: 'method not allowed' }, 405)
        return
      }
      readBody(req).then((body) => {
        if (body && body.action === 'reset') {
          config = { ...DEFAULTS }
          persist()
          sendJson(res, config)
          return
        }
        const patch = body && body.config && typeof body.config === 'object' ? body.config : body
        config = normalize({ ...config, ...patch })
        persist()
        sendJson(res, config)
      }).catch(() => {
        sendJson(res, { ok: false, error: 'bad request' }, 400)
      })
    },
  })

  ctx.on('dispose', () => {
    disposeRoute()
  })
}
