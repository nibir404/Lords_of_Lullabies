import { DITHER_GLSL, NOISE_GLSL } from './noise'

export const POST_MODES = { none: 0, pixel: 1, ascii: 2, dither: 3, halftone: 4, glitch: 5 } as const
export const TRANSITION_KINDS = { fade: 0, fragment: 1, dissolve: 2, pixelate: 3, ink: 4, glitch: 5, flash: 6 } as const

export const POST_VERTEX = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

export const POST_FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D tScene;
uniform sampler2D tGlyphs;
uniform vec2 uRes;
uniform float uTime;
uniform float uMode;
uniform float uAmount;
uniform float uPixelSize;
uniform float uColorLimit;
uniform float uDither;
uniform float uNoise;
uniform float uAsciiCell;
uniform float uContrast;
uniform float uCharset;
uniform float uStage;
uniform float uThreshold;
uniform float uPattern;
uniform float uGlitch;
uniform float uTear;
uniform float uSort;
uniform float uTransit;
uniform float uTransKind;
uniform float uGrain;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform vec3 uAccent;
varying vec2 vUv;

${NOISE_GLSL}
${DITHER_GLSL}

vec3 toSRGB(vec3 c){
  c = max(c, 0.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
vec3 scene(vec2 uv){ return toSRGB(texture2D(tScene, clamp(uv, 0.001, 0.999)).rgb); }

vec3 pixelate(vec2 uv, float size, float levels, float dith, float noiseAmt){
  vec2 cell = floor(uv * uRes / size);
  vec2 cuv = (cell + 0.5) * size / uRes;
  vec3 c = scene(cuv);
  float d = (bayer4(cell) - 0.5) * dith;
  float n = (hash21(cell + floor(uTime * 8.0)) - 0.5) * noiseAmt;
  float L = max(levels - 1.0, 1.0);
  return clamp(floor(c * L + 0.5 + d + n) / L, 0.0, 1.0);
}

vec3 asciiArt(vec2 uv){
  float cell = max(uAsciiCell, 4.0);
  vec2 px = uv * uRes;
  vec2 cid = floor(px / cell);
  vec3 c = scene((cid + 0.5) * cell / uRes);
  float l = clamp((luma(c) - 0.5) * uContrast + 0.5, 0.0, 1.0);
  if (luma(uPaper) > 0.5) l = 1.0 - l;
  float gi = floor(l * 15.999);
  vec2 local = fract(px / cell);
  // Atlas: 16 glyph columns (dark→bright) × 4 character-set rows, canvas flipped on upload.
  vec2 guv = vec2((gi + local.x) / 16.0, (3.0 - uCharset + local.y) / 4.0);
  float g = texture2D(tGlyphs, guv).r;
  vec3 tint = mix(uInk, c * 1.25 + 0.08, 0.55);
  return mix(uPaper, tint, g);
}

float halftoneMono(vec2 uv, float freq){
  vec2 px = uv * uRes;
  mat2 R = mat2(0.7071, -0.7071, 0.7071, 0.7071);
  mat2 Rt = mat2(0.7071, 0.7071, -0.7071, 0.7071);
  vec2 p = R * px / freq;
  vec2 cc = floor(p) + 0.5;
  float lc = luma(scene((Rt * cc * freq) / uRes));
  float rad = sqrt(max(1.0 - lc, 0.0)) * 0.68;
  return smoothstep(rad - 0.07, rad + 0.07, length(fract(p) - 0.5));
}

vec4 toCMYK(vec3 c){
  float k = 1.0 - max(c.r, max(c.g, c.b));
  vec3 cmy = (1.0 - c - k) / max(1.0 - k, 0.001);
  return vec4(cmy, k);
}
// One screen of a four-colour halftone: rotate the grid, sample the source at each cell centre.
float screenDot(vec2 px, float ang, float freq, vec4 sel){
  float s = sin(ang), co = cos(ang);
  mat2 R = mat2(co, -s, s, co);
  mat2 Rt = mat2(co, s, -s, co);
  vec2 p = R * px / freq;
  vec2 cc = floor(p) + 0.5;
  float v = dot(toCMYK(scene((Rt * cc * freq) / uRes)), sel);
  float rad = sqrt(clamp(v, 0.0, 1.0)) * 0.72;
  return 1.0 - smoothstep(rad - 0.09, rad + 0.09, length(fract(p) - 0.5));
}
vec3 cmykHalftone(vec2 uv){
  vec2 px = uv * uRes;
  float f = 7.0;
  float c = screenDot(px, 0.2618, f, vec4(1.0, 0.0, 0.0, 0.0));
  float m = screenDot(px, 1.309, f, vec4(0.0, 1.0, 0.0, 0.0));
  float y = screenDot(px, 0.0, f, vec4(0.0, 0.0, 1.0, 0.0));
  float k = screenDot(px, 0.7854, f, vec4(0.0, 0.0, 0.0, 1.0));
  vec3 col = uPaper;
  col.r *= 1.0 - c * 0.92;
  col.g *= 1.0 - m * 0.92;
  col.b *= 1.0 - y * 0.92;
  return col * (1.0 - k * 0.9);
}

vec3 ditherEngine(vec2 uv){
  vec3 col = scene(uv);
  float l = luma(col);
  vec3 gray = vec3(l);
  vec2 dp = floor(uv * uRes / 2.0);
  float thr = mix(bayer8(dp), ign(dp), step(0.5, uPattern));
  vec3 dith = mix(uInk, uPaper, step(thr, l + (uThreshold - 0.5)));
  vec3 halfT = mix(uInk, uPaper, halftoneMono(uv, 8.0));
  vec2 cell = floor(uv * uRes / 7.0);
  float lp = luma(scene((cell + 0.5) * 7.0 / uRes));
  float q = floor(lp * 3.0 + bayer4(cell) * 0.99) / 3.0;
  vec3 pix = mix(uInk, uPaper, q);
  vec3 a = col;
  a = mix(a, gray, clamp(uStage, 0.0, 1.0));
  a = mix(a, dith, clamp(uStage - 1.0, 0.0, 1.0));
  a = mix(a, halfT, clamp(uStage - 2.0, 0.0, 1.0));
  a = mix(a, pix, clamp(uStage - 3.0, 0.0, 1.0));
  return a;
}

vec3 glitchArt(vec2 uv, float amt){
  float t = floor(uTime * 12.0);
  float band = floor(uv.y * 26.0 + hash11(t) * 5.0);
  float bandOn = step(1.0 - amt * 0.38, hash21(vec2(band, t)));
  float shift = (hash21(vec2(band, t + 1.7)) - 0.5) * 0.14 * uTear * bandOn;
  vec2 guv = uv + vec2(shift, 0.0);
  vec2 blk = floor(uv * vec2(18.0, 10.0));
  float corrupt = step(1.0 - amt * 0.07, hash21(blk + t * 0.37));
  guv = mix(guv, fract(guv + hash22(blk) * 0.25), corrupt);
  float off = (0.003 + 0.014 * amt) * (0.6 + 0.4 * sin(uTime * 2.3));
  vec3 col = vec3(scene(guv + vec2(off, 0.0)).r, scene(guv).g, scene(guv - vec2(off, 0.0)).b);
  float row = floor(uv.y * uRes.y / 3.0);
  if (hash21(vec2(row, floor(uTime * 1.5))) > 1.0 - uSort * amt * 0.3) {
    // Pixel sorting approximation: carry the brightest sample leftward along the row.
    vec3 best = col;
    for (int i = 1; i < 10; i++) {
      vec3 s = scene(guv - vec2(float(i) * 0.011, 0.0));
      if (luma(s) > luma(best)) best = s;
    }
    col = mix(col, best, 0.85);
  }
  col *= 0.9 + 0.1 * sin(uv.y * uRes.y * 3.14159);
  col += (hash21(uv * uRes + uTime) - 0.5) * 0.09 * amt;
  return col;
}

vec3 stylise(vec2 uv){
  if (uMode < 0.5) return scene(uv);
  if (uMode < 1.5) return pixelate(uv, uPixelSize, uColorLimit, uDither, uNoise);
  if (uMode < 2.5) return asciiArt(uv);
  if (uMode < 3.5) return ditherEngine(uv);
  if (uMode < 4.5) return mix(scene(uv), cmykHalftone(uv), 0.9);
  return glitchArt(uv, uGlitch);
}

void main(){
  vec2 uv = vUv;
  float T = uTransit;
  if (uTransKind > 0.5 && uTransKind < 1.5 && T > 0.001) {
    vec2 cell = floor(uv * vec2(9.0, 6.0));
    uv += (hash22(cell) - 0.5) * 0.09 * T;
  }
  vec3 base = scene(uv);
  vec3 styled = stylise(uv);
  vec3 col = mix(base, styled, uAmount);

  if (T > 0.001) {
    if (uTransKind < 0.5) col = mix(col, uPaper, T * 0.45);
    else if (uTransKind < 2.5 && uTransKind > 1.5) {
      float n = snoise(vec3(uv * 6.0, uTime * 0.4)) * 0.5 + 0.5;
      col = mix(col, pixelate(uv, 14.0, 5.0, 0.8, 0.0), step(n, T * 0.9));
    }
    else if (uTransKind < 3.5 && uTransKind > 2.5) col = pixelate(uv, 1.0 + T * 26.0, mix(32.0, 5.0, T), 0.6, 0.0);
    else if (uTransKind < 4.5 && uTransKind > 3.5) {
      float d = length((uv - 0.5) * vec2(uRes.x / uRes.y, 1.0));
      float edge = fbm(vec3(uv * 4.0, uTime * 0.2)) * 0.15;
      col = mix(col, uInk, smoothstep(0.95 - T * 0.75, 1.05 - T * 0.75, d + edge));
    }
    else if (uTransKind < 5.5 && uTransKind > 4.5) col = mix(col, glitchArt(uv, T), T);
    else if (uTransKind > 5.5) col = mix(col, uPaper, T * T * 0.7);
  }

  vec2 q = vUv - 0.5;
  col *= 1.0 - dot(q, q) * 0.35;
  col += (hash21(vUv * uRes + fract(uTime) * 91.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}
`
