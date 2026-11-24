#!/usr/bin/env node
/**
 * Generates the app icons from code so they can never go missing again.
 *
 * Mark: three white rounded bars of rising height on the app's near-black
 * canvas — a neutral "counting up" glyph that gives nothing away to someone
 * glancing at the phone. It matches the three-bar mark in the app header.
 *
 * Usage: node scripts/generate-icons.mjs
 *
 * Always writes the PWA icons into public/assets. When android/ exists (after
 * `npx cap add android`) it also paints the launcher mipmaps — the legacy
 * square/round icons plus the adaptive-icon foreground layer — and pins the
 * adaptive-icon background to the same near-black.
 */
import { deflateSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'assets');
const ANDROID_RES = join(ROOT, 'android', 'app', 'src', 'main', 'res');

const INK = 0x0a; // near-black canvas, like the app background
const BAR = 0xff; // white bars

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const tag = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])), 0);
  return Buffer.concat([length, tag, data, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Signed distance to a rounded rectangle; negative inside. */
function roundedRectDistance(px, py, cx, cy, halfW, halfH, radius) {
  const qx = Math.abs(px - cx) - (halfW - radius);
  const qy = Math.abs(py - cy) - (halfH - radius);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    radius
  );
}

/**
 * Draws the mark.
 * @param size pixel size
 * @param contentScale 1 fills a normal icon; <1 keeps everything inside the
 *        adaptive-icon safe zone (66 of 108dp).
 * @param background paint the near-black canvas (false = transparent layer)
 * @param round clip the canvas to a circle (legacy round icon)
 */
function drawMark(size, { contentScale = 1, background = true, round = false } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  const span = size * contentScale;
  const barWidth = span * 0.115;
  const gap = span * 0.055;
  const totalWidth = barWidth * 3 + gap * 2;
  const left = (size - totalWidth) / 2;
  const baseline = size / 2 + span * 0.175;
  const heights = [0.2, 0.3, 0.42].map((fraction) => span * fraction);
  const radius = barWidth / 2;
  const discRadius = size / 2 - 0.5;
  const centre = size / 2;
  const samplesPerAxis = 4;
  const samples = samplesPerAxis * samplesPerAxis;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let barCoverage = 0;
      let discCoverage = 0;

      for (let sy = 0; sy < samplesPerAxis; sy += 1) {
        for (let sx = 0; sx < samplesPerAxis; sx += 1) {
          const px = x + (sx + 0.5) / samplesPerAxis;
          const py = y + (sy + 0.5) / samplesPerAxis;

          if (round && Math.hypot(px - centre, py - centre) <= discRadius) {
            discCoverage += 1;
          }

          for (let bar = 0; bar < 3; bar += 1) {
            const barLeft = left + bar * (barWidth + gap);
            const barTop = baseline - heights[bar];
            const cx = barLeft + barWidth / 2;
            const cy = (barTop + baseline) / 2;
            if (
              roundedRectDistance(
                px,
                py,
                cx,
                cy,
                barWidth / 2,
                (baseline - barTop) / 2,
                radius,
              ) <= 0
            ) {
              barCoverage += 1;
              break;
            }
          }
        }
      }

      barCoverage /= samples;
      discCoverage /= samples;

      const index = (y * size + x) * 4;
      if (background) {
        const alpha = round ? discCoverage : 1;
        const value = Math.round(INK + barCoverage * (BAR - INK));
        pixels[index] = value;
        pixels[index + 1] = value;
        pixels[index + 2] = value;
        pixels[index + 3] = Math.round(255 * alpha);
      } else {
        pixels[index] = BAR;
        pixels[index + 1] = BAR;
        pixels[index + 2] = BAR;
        pixels[index + 3] = Math.round(255 * barCoverage);
      }
    }
  }

  return pixels;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const size of [192, 512]) {
  const file = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, encodePng(size, drawMark(size)));
  console.log(`wrote ${file} (${size}x${size})`);
}

// Apple touch icon must be opaque with no transparency.
writeFileSync(join(OUT_DIR, 'apple-touch-icon.png'), encodePng(180, drawMark(180)));
console.log('wrote apple-touch-icon.png (180x180)');

// ---------------------------------------------------------------------------
// Android launcher icons. Only when the platform folder exists: in CI this
// runs again from scripts/add-widget.sh after `npx cap add android`.
// ---------------------------------------------------------------------------
const mipmapRoot = join(ANDROID_RES, 'mipmap-mdpi');
if (!existsSync(mipmapRoot)) {
  console.log('android/ not present — skipped launcher mipmaps');
} else {
  const densities = [
    ['mdpi', 48],
    ['hdpi', 72],
    ['xhdpi', 96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192],
  ];

  for (const [density, legacySize] of densities) {
    const dir = join(ANDROID_RES, `mipmap-${density}`);
    mkdirSync(dir, { recursive: true });

    const square = encodePng(legacySize, drawMark(legacySize));
    writeFileSync(join(dir, 'ic_launcher.png'), square);
    writeFileSync(join(dir, 'ic_launcher_round.png'), encodePng(legacySize, drawMark(legacySize, { round: true })));

    // Adaptive foreground: 108dp canvas, mark kept inside the safe zone.
    const foregroundSize = Math.round(legacySize * (108 / 48));
    writeFileSync(
      join(dir, 'ic_launcher_foreground.png'),
      encodePng(foregroundSize, drawMark(foregroundSize, { contentScale: 0.78, background: false })),
    );
  }

  // Adaptive background colour must match the canvas, or white bars vanish.
  const valuesDir = join(ANDROID_RES, 'values');
  mkdirSync(valuesDir, { recursive: true });
  const backgroundFile = join(valuesDir, 'ic_launcher_background.xml');
  const backgroundXml =
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<resources>\n' +
    '    <color name="ic_launcher_background">#0A0A0A</color>\n' +
    '</resources>\n';
  if (existsSync(backgroundFile)) {
    const current = readFileSync(backgroundFile, 'utf8');
    const next = current.replace(
      /(<color\s+name="ic_launcher_background"\s*>)#[0-9A-Fa-f]{3,8}(<\/color>)/,
      '$1#0A0A0A$2',
    );
    writeFileSync(backgroundFile, next);
  } else {
    writeFileSync(backgroundFile, backgroundXml);
  }

  console.log('wrote Android launcher mipmaps (square, round and adaptive foreground)');
}
