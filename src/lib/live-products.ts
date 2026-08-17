import { getEmDashCollection, getEmDashEntry } from 'emdash';
import type { Locale } from '../i18n/utils';
import { CATEGORIES } from '../consts';
import type { Product, Variant } from './products';

function clean(value: unknown): string {
  return String(value ?? '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function mediaUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const media = value as Record<string, unknown>;
    const nested = media.$media;
    if (typeof nested === 'object' && nested !== null) {
      const item = nested as Record<string, unknown>;
      if (typeof item.url === 'string') return item.url;
      if (typeof item.file === 'string') return item.file;
    }
    if (typeof media.url === 'string') return media.url;
  }
  return null;
}

function normalizeVariants(value: unknown, fallbackSku = ''): Variant[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const v = (item || {}) as Record<string, unknown>;
    const colorClean = clean(v.color);
    return {
      sku: clean(v.sku) || fallbackSku,
      color: colorClean,
      size: clean(v.size),
      specs: clean(v.specs),
      wholesale_price: String(v.wholesale_price ?? ''),
      retail_price: String(v.retail_price ?? ''),
      colorClean,
      colorEn: colorClean,
    };
  });
}

function toProduct(entry: any): Product {
  const data = (entry?.data || {}) as Record<string, any>;
  const variants = normalizeVariants(data.variants, data.sku);
  const firstSku = clean(data.sku) || variants[0]?.sku || '';
  const gallery = Array.isArray(data.gallery)
    ? data.gallery.map(mediaUrl).filter(Boolean) as string[]
    : [];
  const image = mediaUrl(data.image) || mediaUrl(data.featured_image) || gallery[0] || null;
  const category = clean(data.category) || 'functional';
  const nameCn = clean(data.name_cn) || clean(data.name) || firstSku || entry?.slug || 'Product';
  const nameEn = clean(data.name_en) || clean(data.name) || nameCn;

  return {
    id: String(entry?.id || entry?.slug || firstSku),
    name: nameCn,
    nameEn,
    nameCn,
    description: clean(data.short_description) || clean(data.description),
    category,
    categoryName: CATEGORIES.find((c) => c.slug === category)?.name || category,
    slug: String(entry?.slug || data.slug || firstSku).toLowerCase(),
    variants,
    image,
    gallery,
    firstSku,
    moq: data.moq == null ? undefined : String(data.moq),
    oem: Boolean(data.oem),
    seoTitle: clean(data.seo_title) || undefined,
    seoDescription: clean(data.seo_description) || undefined,
    draft: data.status === 'draft',
  };
}

export async function getLiveProducts(): Promise<Product[]> {
  const { entries, error } = await getEmDashCollection('products', { status: 'published' });
  if (error) {
    console.error('[HiDREAM] Failed to load EmDash products', error);
    return [];
  }
  return entries.map(toProduct).filter((product) => product.variants.length > 0);
}

export async function getLiveProductsByCategory(category: string): Promise<Product[]> {
  const products = await getLiveProducts();
  return products.filter((product) => product.category === category);
}

export async function getLiveProductBySlug(category: string, slug: string): Promise<Product | undefined> {
  const { entry, error } = await getEmDashEntry('products', slug);
  if (error || !entry) return undefined;
  const product = toProduct(entry);
  return product.category === category && !product.draft ? product : undefined;
}

export async function getLiveCategoryCounts() {
  const products = await getLiveProducts();
  return CATEGORIES.map((category) => ({
    ...category,
    count: products.filter((product) => product.category === category.slug).length,
    cover: products.find((product) => product.category === category.slug)?.image || null,
  }));
}

export function getLiveProductName(product: Product, locale: Locale): string {
  return locale === 'zh' ? product.nameCn : product.nameEn || product.nameCn;
}
