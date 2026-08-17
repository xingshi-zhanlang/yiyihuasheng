import rawProducts from '../../data/products.json';
import translations from '../../data/product-translations.json';
import type { ContentRepository, ProductContent, ProductVariant } from './types';

const translationMap = (translations as { products?: Record<string, string> }).products || {};

function clean(value: unknown): string {
  return String(value ?? '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function toProduct(item: any, index: number): ProductContent {
  const lines = String(item.name || '').split(/\r?\n/).map(clean).filter(Boolean);
  const nameZh = lines.shift() || `Product ${index + 1}`;
  const description = clean(lines.join(' '));
  const variants: ProductVariant[] = Array.isArray(item.variants)
    ? item.variants.map((variant: any) => ({
        sku: clean(variant.sku),
        color: clean(variant.color),
        size: clean(variant.size),
        specs: clean(variant.specs),
      }))
    : [];
  const sku = variants[0]?.sku || `legacy-${index + 1}`;
  const slug = sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `product-${index + 1}`;

  return {
    slug,
    name: translationMap[nameZh] || nameZh,
    nameZh,
    sku,
    status: 'published',
    category: clean(item.category),
    shortDescription: description.slice(0, 500),
    description,
    variants,
    moq: undefined,
    oem: true,
    odm: true,
  };
}

const products = (rawProducts as any[]).map(toProduct);

export const fixtureRepository: ContentRepository = {
  async listProducts() {
    return products;
  },
  async getProductBySlug(slug) {
    return products.find((product) => product.slug === slug) || null;
  },
};
