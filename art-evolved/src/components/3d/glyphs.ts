import { CanvasTexture, LinearFilter } from 'three'

export const CHARSETS = [
  { name: 'Classic', chars: ' .,:;-~=+*ox%#&@' },
  { name: 'Blocks', chars: ' ··░░░▒▒▒▓▓▓████' },
  { name: 'Binary', chars: ' ..::0101010110█' },
  { name: 'Letters', chars: ' .-aertvoldEVOLA' },
]

const CELL = 32

function draw(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 16 * CELL, 4 * CELL)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `600 ${CELL * 0.86}px "JetBrains Mono", ui-monospace, monospace`
  CHARSETS.forEach((set, row) => {
    ;[...set.chars.padEnd(16, '@')].slice(0, 16).forEach((ch, col) => {
      ctx.fillText(ch, col * CELL + CELL / 2, row * CELL + CELL / 2 + 1)
    })
  })
}

/** Builds the ASCII glyph atlas procedurally — 16 density-ordered glyphs × 4 character sets. */
export function createGlyphAtlas() {
  const canvas = document.createElement('canvas')
  canvas.width = 16 * CELL
  canvas.height = 4 * CELL
  const ctx = canvas.getContext('2d')!
  draw(ctx)
  const tex = new CanvasTexture(canvas)
  tex.minFilter = LinearFilter
  tex.magFilter = LinearFilter
  tex.generateMipmaps = false
  document.fonts?.ready.then(() => {
    draw(ctx)
    tex.needsUpdate = true
  })
  return tex
}
