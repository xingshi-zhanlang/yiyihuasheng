import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const source = path.resolve('src/data/products.json');
const products = JSON.parse(fs.readFileSync(source, 'utf8'));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hidream-emdash-'));

const slugify = (value, index) => {
  const base = String(value || '')
    .split(/\r?\n/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return `${base || 'product'}-${index + 1}`;
};

const normalizeVariant = (variant) => ({
  sku: variant.sku || '',
  color: String(variant.color || '').replace(/\s+/g, ' ').trim(),
  size: String(variant.size || '').trim(),
  specs: String(variant.specs || '').trim(),
  wholesale_price: variant.wholesale_price ?? '',
  retail_price: variant.retail_price ?? '',
});

try {
  products.forEach((product, index) => {
    const lines = String(product.name || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const nameCn = lines.shift() || `Product ${index + 1}`;
    const description = lines.join('\n');
    const variants = Array.isArray(product.variants) ? product.variants.map(normalizeVariant) : [];
    const firstSku = variants[0]?.sku || '';

    const data = {
      name: nameCn,
      name_cn: nameCn,
      sku: firstSku,
      category: product.category || '',
      short_description: description.slice(0, 500),
      description: description ? [{ _type: 'block', style: 'normal', children: [{ _type: 'span', text: description }] }] : [],
      variants,
      specifications: variants.reduce((acc, variant) => {
        if (variant.sku && variant.specs) acc[variant.sku] = variant.specs;
        return acc;
      }, {}),
      moq: 0,
      oem: true,
      odm: true,
    };

    const file = path.join(tempDir, `${index}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    const slug = slugify(nameCn, index);
    console.log(`Migrating ${index + 1}/${products.length}: ${nameCn} (${slug})`);
    execFileSync('npx', ['emdash', 'content', 'create', 'products', '--file', file, '--slug', slug], {
      stdio: 'inherit',
      env: process.env,
    });
  });
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
