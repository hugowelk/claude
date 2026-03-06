/**
 * Generates PWA icons (192x192 and 512x512 PNG) without external dependencies.
 * Uses Node.js built-in zlib to produce valid PNG files with a green
 * rounded-square background and a white dumbbell emoji-style shape.
 *
 * Run: node scripts/generate-icons.js
 */

import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dir, '../public')

// ── PNG encoder ────────────────────────────────────────────────────────────

function u32(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n)
  return b
}

function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = u32(data.length)
  const crcData = Buffer.concat([typeBuf, data])
  return Buffer.concat([len, typeBuf, data, u32(crc32(crcData))])
}

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA values, row by row
  const IHDR = chunk('IHDR', Buffer.concat([
    u32(width), u32(height),
    Buffer.from([8, 2, 0, 0, 0]) // 8-bit depth, RGB (we'll use RGBA via filter)
  ]))

  // Use RGBA (color type 6)
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 6   // color type: RGBA
  ihdrData[10] = 0  // compression
  ihdrData[11] = 0  // filter
  ihdrData[12] = 0  // interlace

  // Scanlines: each row has a filter byte (0 = None) followed by RGBA data
  const rowSize = width * 4
  const raw = Buffer.alloc((rowSize + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0 // filter type: None
    pixels.copy(raw, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize)
  }

  const compressed = deflateSync(raw, { level: 6 })
  const IDAT = chunk('IDAT', compressed)
  const IEND = chunk('IEND', Buffer.alloc(0))
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  return Buffer.concat([signature, chunk('IHDR', ihdrData), IDAT, IEND])
}

// ── Icon painter ───────────────────────────────────────────────────────────

function paintIcon(size) {
  const pixels = Buffer.alloc(size * size * 4)

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.42      // rounded square corner radius (approx via circle clipping)
  const bgR = 16, bgG = 185, bgB = 129  // #10b981 (brand-500)
  const fgR = 255, fgG = 255, fgB = 255  // white

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4

      // Rounded square background via distance to nearest corner
      const rx = size * 0.12  // corner radius for rounded rect
      const dx = Math.max(0, Math.abs(x - cx) - (size / 2 - rx))
      const dy = Math.max(0, Math.abs(y - cy) - (size / 2 - rx))
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > rx + 1) {
        // Transparent outside
        pixels[idx] = 0; pixels[idx+1] = 0; pixels[idx+2] = 0; pixels[idx+3] = 0
        continue
      }

      // Anti-alias edge
      const alpha = dist > rx ? Math.round(255 * (1 - (dist - rx))) : 255
      let r = bgR, g = bgG, b = bgB

      // Draw a simple dumbbell: two circles + connecting bar
      const s = size
      const barH = s * 0.12
      const barW = s * 0.55
      const plateR = s * 0.18
      const plateH = s * 0.30
      const plateW = s * 0.10
      const barY1 = cy - barH / 2
      const barY2 = cy + barH / 2
      const barX1 = cx - barW / 2
      const barX2 = cx + barW / 2

      // Left plate
      const lx1 = cx - barW / 2 - plateW
      const lx2 = cx - barW / 2
      const ly1 = cy - plateH / 2
      const ly2 = cy + plateH / 2

      // Right plate
      const rx1 = cx + barW / 2
      const rx2 = cx + barW / 2 + plateW

      const inBar = x >= barX1 && x <= barX2 && y >= barY1 && y <= barY2
      const inLeftPlate = x >= lx1 && x <= lx2 && y >= ly1 && y <= ly2
      const inRightPlate = x >= rx1 && x <= rx2 && y >= ly1 && y <= ly2

      if (inBar || inLeftPlate || inRightPlate) {
        r = fgR; g = fgG; b = fgB
      }

      pixels[idx] = r
      pixels[idx+1] = g
      pixels[idx+2] = b
      pixels[idx+3] = alpha
    }
  }

  return pixels
}

// ── Generate ───────────────────────────────────────────────────────────────

for (const size of [192, 512]) {
  const pixels = paintIcon(size)
  const png = encodePNG(size, size, pixels)
  const outPath = join(PUBLIC, `pwa-${size}x${size}.png`)
  writeFileSync(outPath, png)
  console.log(`✓ Generated ${outPath} (${png.length} bytes)`)
}

console.log('Icons generated successfully.')
