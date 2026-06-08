import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const DOWNLOADS = 'C:/Users/Ecommerce07/Downloads';
const OUT = 'C:/Users/Ecommerce07/Documents/landing-page-cp/public/images';

const jobs = [
  {
    src: `${DOWNLOADS}/loja-hero.jpg (2400×1200.png`,
    outJpg: `${OUT}/loja-hero.jpg`,
    outWebp: `${OUT}/loja-hero.webp`,
    width: 2400,
    height: 1200,
    jpgQ: 78,
    webpQ: 72,
  },
  {
    src: `${DOWNLOADS}/loja.jpg (1200×800).png`,
    outJpg: `${OUT}/loja.jpg`,
    outWebp: `${OUT}/loja.webp`,
    width: 1200,
    height: 800,
    jpgQ: 82,
    webpQ: 78,
  },
];

for (const j of jobs) {
  const base = sharp(j.src).resize(j.width, j.height, { fit: 'cover', position: 'center' });

  await base.clone().jpeg({ quality: j.jpgQ, mozjpeg: true, progressive: true }).toFile(j.outJpg);
  await base.clone().webp({ quality: j.webpQ, effort: 6 }).toFile(j.outWebp);

  const [origSize, jpgSize, webpSize] = await Promise.all([
    stat(j.src).then((s) => s.size),
    stat(j.outJpg).then((s) => s.size),
    stat(j.outWebp).then((s) => s.size),
  ]);

  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
  console.log(`✓ ${j.outJpg.split('/').pop()}  ${j.width}×${j.height}`);
  console.log(`  original: ${kb(origSize)}  →  jpg: ${kb(jpgSize)}  ·  webp: ${kb(webpSize)}`);
}
