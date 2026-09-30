import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generateIconPNG(size) {
  // Scanlines: size lines, each line has 1 filter byte (0) + size * 4 bytes (RGBA)
  const rawData = Buffer.alloc(size * (1 + size * 4));

  const center = size / 2;
  const radius = size * 0.46;
  const innerRadius = size * 0.44;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 4);
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: Slate 900 (#0f172a)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // Rounded container / shield
      const cornerR = size * 0.22;
      const qx = Math.max(0, Math.abs(dx) - (center - cornerR));
      const qy = Math.max(0, Math.abs(dy) - (center - cornerR));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);

      if (cornerDist > cornerR) {
        // Outside rounded squircle: transparent
        a = 0;
        r = 0;
        g = 0;
        b = 0;
      } else if (cornerDist > cornerR - size * 0.035) {
        // Border: Sky 400 (#38bdf8) / Emerald 500 gradient
        const t = (x + y) / (size * 2);
        r = Math.round(56 * (1 - t) + 16 * t);
        g = Math.round(189 * (1 - t) + 185 * t);
        b = Math.round(248 * (1 - t) + 129 * t);
      } else {
        // Center Lambda 'λ' drawing
        // Normalizing coordinates to [-1, 1]
        const nx = dx / (size * 0.35);
        const ny = dy / (size * 0.35);

        // Main diagonal leg: from top-left (ny ~ -0.9, nx ~ -0.45) down to bottom-right (ny ~ 0.9, nx ~ 0.55)
        // Line equation: nx ~ ny * 0.55 + 0.05
        const leg1Dist = Math.abs(nx - (ny * 0.55 + 0.05));

        // Secondary leg: branches off main leg around ny ~ 0.0 to bottom-left (ny ~ 0.9, nx ~ -0.65)
        // Line equation: nx ~ -ny * 0.65 - 0.05 for ny >= -0.05
        const leg2Dist = ny >= -0.1 ? Math.abs(nx - (-ny * 0.7 - 0.02)) : 999;

        const strokeWidth = 0.22;

        if (
          (leg1Dist < strokeWidth && ny >= -0.85 && ny <= 0.85) ||
          (leg2Dist < strokeWidth && ny >= -0.05 && ny <= 0.85)
        ) {
          // Lambda glyph color: Sky 400 (#38bdf8) to Emerald 400 (#34d399)
          const grad = (ny + 1) / 2;
          r = Math.round(56 * (1 - grad) + 52 * grad);
          g = Math.round(189 * (1 - grad) + 211 * grad);
          b = Math.round(248 * (1 - grad) + 153 * grad);
        }
      }

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating icon-192.png...');
const icon192 = generateIconPNG(192);
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);

console.log('Generating icon-512.png...');
const icon512 = generateIconPNG(512);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

console.log('Generating favicon.ico (from 64x64 PNG)...');
const icon64 = generateIconPNG(64);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icon64);

console.log('Icons generated successfully in public/');
