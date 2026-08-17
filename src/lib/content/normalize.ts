import type { ProductContent, ProductVariant } from './types';

export function mediaUrl(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ['src', 'url', 'previewUrl']) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

export function mediaUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(mediaUrl).filter((item): item is string => Boolean(item));
}

export function variantList(value: unknown): ProductVariant[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .map((item) => {
      const record = item as Record<string, unknown>;
      const sku = typeof record.sku === 'string' ? record.sku.trim() : '';
      const color = typeof record.color === 'string' ? record.color.trim() : '';
      const size = typeof record.size === 'string' ? record.size.trim() : '';
      const specs = typeof record.specs === 'string' ? record.specs.trim() : '';
      return { sku, color, size, specs };
    });
}

export function productFromCmsEntry(entry: { id?: string; data?: unknown }): ProductContent {
  const data = entry.data && typeof entry.data === 'object' ? (entry.data as Record<string, unknown>) : {};
  const slug = typeof entry.id === 'string' ? entry.id : String(data.slug || '');
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const nameZh = typeof data.name_cn === 'string' ? data.name_cn.trim() : name;
  const sku = typeof data.sku === 'string' ? data.sku.trim() : '';
  const category = typeof data.category === 'string' ? data.category.trim() : undefined;
  const shortDescription = typeof data.short_description === 'string' ? data.short_description.trim() : undefined;
  const description = typeof data.description === 'string' ? data.description.trim() : undefined;
  const moq = data.moq === undefined || data.moq === null ? undefined : String(data.moq);
  const status = data.status === 'published' || data.status === 'archived' || data.status === 'draft' ? data.status : undefined;

  return {
    slug,
    name,
    nameZh,
    sku,
    status,
    category,
    shortDescription,
    description,
    coverImage: mediaUrl(data.cover_image),
    gallery: mediaUrls(data.gallery),
    lifestyleImages: mediaUrls(data.lifestyle_images),
    detailImages: mediaUrls(data.detail_images),
    variants: variantList(data.variants),
    moq,
    oem: data.oem === undefined ? undefined : Boolean(data.oem),
    odm: data.odm === undefined ? undefined : Boolean(data.odm),
    leadTime: typeof data.lead_time === 'string' ? data.lead_time : undefined,
    seoTitle: typeof data.seo_title === 'string' ? data.seo_title : undefined,
    seoDescription: typeof data.seo_description === 'string' ? data.seo_description : undefined,
    ogImage: mediaUrl(data.og_image),
  };
}
