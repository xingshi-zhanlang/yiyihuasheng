import type { Product, Variant } from './products';
import { allProducts } from './products';
import { CATEGORIES } from '../consts';

export type CatalogEnv = { DB?: D1Database };

type ProductRow = {
  id: string;
  slug: string;
  name_en: string;
  name_zh: string;
  category: string;
  description: string;
  image: string | null;
  gallery_json: string;
  variants_json: string;
  moq: string;
  oem: number;
  status: string;
  seo_title: string;
  seo_description: string;
};

type StoredVariant = {
  sku?: string;
  color?: string;
  colorClean?: string;
  colorEn?: string;
  size?: string;
  specs?: string;
};

function parseArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function rowToProduct(row: ProductRow): Product {
  const variants: Variant[] = parseArray<StoredVariant>(row.variants_json).map((item) => {
    const colorClean = String(item.colorClean ?? item.color ?? '').trim();
    return {
      sku: String(item.sku ?? ''),
      color: colorClean,
      size: String(item.size ?? ''),
      specs: String(item.specs ?? ''),
      wholesale_price: '',
      retail_price: '',
      colorClean,
      colorEn: String(item.colorEn ?? colorClean),
    };
  });

  const gallery = parseArray<string>(row.gallery_json).filter(Boolean);
  const category = row.category || 'functional';
  const categoryInfo = CATEGORIES.find((item) => item.slug === category);
  const firstSku = variants[0]?.sku || '';
  const displayName = row.name_en || row.name_zh || row.slug;

  return {
    id: row.id,
    name: row.name_zh || displayName,
    nameEn: row.name_en || displayName,
    nameCn: row.name_zh || displayName,
    description: row.description || '',
    category,
    categoryName: categoryInfo?.name || category,
    slug: row.slug,
    variants,
    image: row.image || gallery[0] || null,
    gallery,
    firstSku,
    moq: row.moq || undefined,
    oem: Boolean(row.oem),
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
  };
}

export async function getPublicProducts(env?: CatalogEnv): Promise<Product[]> {
  if (!env?.DB) return allProducts;

  try {
    const result = await env.DB.prepare(
      `SELECT id, slug, name_en, name_zh, category, description, image, gallery_json, variants_json, moq, oem, status, seo_title, seo_description
       FROM products WHERE status = 'published' ORDER BY updated_at DESC`,
    ).all<ProductRow>();
    if (!result.results?.length) return allProducts;
    return result.results.map(rowToProduct);
  } catch {
    return allProducts;
  }
}

export function getPublicProductsByCategory(products: Product[], category: string): Product[] {
  return products.filter((product) => product.category === category);
}
