// Generate PWA PNG icons from the SVG source.
// Run with: node scripts/generate-icons.mjs
// Requires `sharp` (npm i -D sharp) — kept out of the main dependency tree to avoid a slow install on Vercel.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Install sharp first: pnpm add -D sharp');
    process.exit(1);
  }
  const svg = await readFile(path.resolve('public/icons/icon.svg'));
  const out = path.resolve('public/icons');
  await mkdir(out, { recursive: true });
  for (const size of [192, 512]) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer();
    await writeFile(path.join(out, `icon-${size}.png`), buf);
    console.log(`wrote icon-${size}.png`);
  }
  // Maskable: add padding so the safe area covers most of the icon.
  const maskBuf = await sharp(svg)
    .resize(360, 360)
    .extend({ top: 76, bottom: 76, left: 76, right: 76, background: { r: 30, g: 58, b: 95, alpha: 1 } })
    .png()
    .toBuffer();
  await writeFile(path.join(out, 'icon-maskable-512.png'), maskBuf);
  console.log('wrote icon-maskable-512.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
