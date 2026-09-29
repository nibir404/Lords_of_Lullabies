import { Color, SRGBColorSpace } from 'three'

/** CSS "r g b" triplet. Color stores linear values, so read back in sRGB to match the palette hex. */
export function hexToRgbTriplet(hex: string) {
  const c = { r: 0, g: 0, b: 0 }
  new Color(hex).getRGB(c, SRGBColorSpace)
  return `${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)}`
}

/** WCAG contrast ratio between two colours. */
export function contrast(a: string, b: string) {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Moves `hex` toward `toward` until it reaches `min` contrast against `bg` (for accents used as text). */
export function ensureContrast(hex: string, bg: string, toward: string, min = 3) {
  let out = hex
  for (let t = 0.1; t <= 1 && contrast(out, bg) < min; t += 0.1) out = mixHex(hex, toward, t)
  return out
}

export function mixHex(a: string, b: string, t: number) {
  return '#' + new Color(a).lerp(new Color(b), t).getHexString()
}

export function luminance(hex: string) {
  const c = new Color(hex)
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
}

export function shiftHue(hex: string, amount: number) {
  const c = new Color(hex)
  const hsl = { h: 0, s: 0, l: 0 }
  c.getHSL(hsl)
  c.setHSL((hsl.h + amount + 1) % 1, hsl.s, hsl.l)
  return '#' + c.getHexString()
}

export function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(((h % 360) + 360) % 360)} ${Math.round(s)}% ${Math.round(l)}%)`
}
