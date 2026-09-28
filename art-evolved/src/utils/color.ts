import { Color } from 'three'

export function hexToRgbTriplet(hex: string) {
  const c = new Color(hex)
  return `${Math.round(c.r * 255)} ${Math.round(c.g * 255)} ${Math.round(c.b * 255)}`
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
