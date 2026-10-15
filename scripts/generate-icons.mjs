// Generates the app icons in assets/. Run with: node scripts/generate-icons.mjs
// Three phones piled up, the same drawing as the Logo component in src/components/ui.tsx.
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const BG_TOP = '#2A0E18';
const BG_BOTTOM = '#0F060A';

// Phones drawn on a 1024 canvas, centred, scaled by `scale`.
function phones(scale, mono = false) {
  const w = 300 * scale;
  const h = 492 * scale;
  const r = w * 0.22;
  const stroke = 16 * scale;
  const phone = (dx, rotate, fill) => `
    <g transform="translate(${512 + dx * scale} 512) rotate(${rotate})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${r}"
        fill="${mono ? '#FFFFFF' : fill}" stroke="${mono ? 'none' : BG_BOTTOM}" stroke-width="${stroke}"/>
    </g>`;
  return [phone(-84, -14, '#FFC145'), phone(84, 10, '#C2261A'), phone(0, 0, '#FF4D3D')].join('');
}

const background = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG_TOP}"/>
      <stop offset="1" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>`;

const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">${body}</svg>`);

const files = {
  'icon.png': svg(background + phones(1.15)),
  // Android crops adaptive icons to the inner ~66%, so the foreground art is smaller.
  'android-icon-foreground.png': svg(phones(0.8)),
  'android-icon-background.png': svg(background),
  'android-icon-monochrome.png': svg(phones(0.8, true)),
  'splash-icon.png': svg(phones(1.2)),
};

for (const [name, data] of Object.entries(files)) {
  await sharp(data).png().toFile(join(out, name));
  console.log(`wrote ${name}`);
}
await sharp(files['icon.png']).resize(48, 48).png().toFile(join(out, 'favicon.png'));
console.log('wrote favicon.png');
