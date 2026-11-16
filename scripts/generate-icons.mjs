#!/usr/bin/env node
/**
 * Generates the PWA icons from code so they can never go missing again.
 *
 * Mark: a thin white gauge ring with a gap at the top, on the app's near-black
 * canvas. It echoes the Rate Meter and stays inside the maskable safe zone
 * (content within 40% of the icon radius).
 *
 * Usage: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');

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

function drawMark(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const outer = size * 0.3;
  const inner = size * 0.238;
  const gapHalfWidth = 0.2; // radians either side of straight up
  const samples = [0.25, 0.75];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let coverage = 0;

      for (const oy of samples) {
        for (const ox of samples) {
          const dx = x + ox - center;
          const dy = y + oy - center;
          const radius = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);
          const inGap = Math.abs(angle + Math.PI / 2) < gapHalfWidth;
          if (radius <= outer && radius >= inner && !inGap) coverage += 1;
        }
      }

      coverage /= samples.length * samples.length;
      const value = Math.round(255 * coverage);
      const index = (y * size + x) * 4;
      pixels[index] = value;
      pixels[index + 1] = value;
      pixels[index + 2] = value;
      pixels[index + 3] = 255;
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
