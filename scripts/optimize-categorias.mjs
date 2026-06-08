import sharp from 'sharp';
import { stat, mkdir } from 'node:fs/promises';

const SRC = 'C:/Users/Ecommerce07/Downloads/Design sem nome (4) (1).png';
const OUT_DIR = 'C:/Users/Ecommerce07/Documents/landing-page-cp/public/images/produtos';
const SLUGS = ['compressores', 'valvulas', 'controles', 'filtros', 'trocadores', 'motores'];

await mkdir(OUT_DIR, { recursive: true });

const base = sharp(SRC).resize(1000, 625, { fit: 'cover', position: 'center' });

for (const slug of SLUGS) {
  const jpgPath = `${OUT_DIR}/${slug}.jpg`;
  const webpPath = `${OUT_DIR}/${slug}.webp`;

  await base.clone().jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(jpgPath);
  await base.clone().webp({ quality: 78, effort: 6 }).toFile(webpPath);

  const [jpg, webp] = await Promise.all([stat(jpgPath), stat(webpPath)]);
  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
  console.log(`✓ ${slug}  →  jpg: ${kb(jpg.size)}  ·  webp: ${kb(webp.size)}`);
}

const original = await stat(SRC);
console.log(`\nOriginal: ${(original.size / 1024).toFixed(0)} KB  ·  6 categorias geradas em ${OUT_DIR}`);
