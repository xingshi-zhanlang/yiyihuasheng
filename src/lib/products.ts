// 产品数据辅助层：解析 products.json + CMS Markdown 产品，使用 SKU-图片映射生成静态产品目录。
import { getImage } from 'astro:assets';
import rawProducts from '../data/products.json';
import imageMapping from '../data/image-mapping.json';
import productTranslations from '../data/product-translations.json';
import { CATEGORIES } from '../consts';
import type { Locale } from '../i18n/utils';

// 翻译数据类型
type Translations = {
  products: Record<string, string>;
  colors: Record<string, string>;
  specs: Record<string, string>;
};
const translations = productTranslations as Translations;

// SKU -> 图片列表的映射（历史产品数据）
const skuImageMap = imageMapping as Record<string, { images: string[]; category: string; product_name: string }>;

// 用 import.meta.glob 批量导入历史产品图片
const productImageGlob = import.meta.glob('../assets/products/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, ImageMetadata>;

// 建立 文件名 -> ImageMetadata 的映射
const imageByName: Record<string, ImageMetadata> = {};
for (const [path, meta] of Object.entries(productImageGlob)) {
  const filename = path.split('/').pop() || '';
  if (filename) imageByName[filename] = meta;
}

export interface RawVariant {
  sku: string;
  color: string;
  size: string;
  specs: string;
  wholesale_price: string;
  retail_price: string;
}

export interface RawProduct {
  name: string;
  category: string;
  category_name: string;
  description: string;
  variants: RawVariant[];
}

export interface Variant extends RawVariant {
  colorClean: string;
  colorEn: string;
}

// image/galleries 同时支持 Astro ImageMetadata（历史素材）与 public 路径（CMS 新素材）。
export interface Product {
  id: string;
  name: string;
  nameEn: string;
  nameCn: string;
  description: string;
  category: string;
  categoryName: string;
  slug: string;
  variants: Variant[];
  image: ImageMetadata | string | null;
  gallery: Array<ImageMetadata | string>;
  firstSku: string;
  moq?: string;
  oem?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  draft?: boolean;
}

export function getProductName(p: Product, locale: Locale): string {
  return locale === 'zh' ? p.nameCn : (p.nameEn || p.nameCn);
}

export function getVariantColor(v: Variant, locale: Locale): string {
  return locale === 'zh' ? v.colorClean : (v.colorEn || v.colorClean);
}

const products = rawProducts as RawProduct[];

function clean(s: string): string {
  return (s || '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(sku: string, name: string, index: number): string {
  if (sku) return sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const base = name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'item'}-${index}`;
}

function getImagesForProduct(variants: RawVariant[]): ImageMetadata[] {
  const images: ImageMetadata[] = [];
  const seen = new Set<string>();
  for (const v of variants) {
    const mapping = skuImageMap[v.sku];
    if (mapping?.images) {
      for (const img of mapping.images) {
        if (!seen.has(img)) {
          seen.add(img);
          const meta = imageByName[img];
          if (meta) images.push(meta);
        }
      }
    }
  }
  return images;
}

const legacyProducts: Product[] = products.map((p, idx) => {
  const lines = (p.name || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const name = lines[0] || `Product ${idx + 1}`;
  const description = lines.slice(1).join(' ') || p.description || '';
  const nameEn = translations.products[name] || name;

  const variants: Variant[] = (p.variants || []).map((v) => ({
    ...v,
    colorClean: clean(v.color),
    colorEn: translations.colors[v.color?.trim()] || clean(v.color),
  }));

  const firstSku = variants[0]?.sku || '';
  const slug = slugify(firstSku, name, idx);
  const productImages = getImagesForProduct(p.variants || []);

  return {
    id: `legacy-${idx}`,
    name,
    nameEn,
    nameCn: name,
    description,
    category: p.category,
    categoryName: p.category_name,
    slug,
    variants,
    image: productImages[0] || null,
    gallery: productImages.slice(0, 8),
    firstSku: firstSku,
  };
});

// CMS 产品：每个条目都是一个 Markdown 文件，图片由 Decap CMS 上传到 public/images/uploads。
interface CmsProductFrontmatter {
  name?: string;
  nameEn?: string;
  sku?: string;
  category?: string;
  description?: string;
  image?: string;
  gallery?: string[];
  variants?: Array<{ sku?: string; color?: string; size?: string; specs?: string }>;
  moq?: string;
  oem?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  draft?: boolean;
}

type CmsModule = { frontmatter: CmsProductFrontmatter };
const cmsProductModules = import.meta.glob('../content/products/*.md', { eager: true }) as Record<string, CmsModule>;

const cmsProducts: Product[] = Object.entries(cmsProductModules)
  .map(([path, module], idx) => {
    const front = module.frontmatter || {};
    const fileName = path.split('/').pop()?.replace(/\.md$/, '') || `cms-${idx}`;
    const name = front.name?.trim() || fileName;
    const nameEn = front.nameEn?.trim() || name;
    const category = front.category || 'functional';
    const variants: Variant[] = (front.variants || []).map((v) => {
      const colorClean = clean(v.color || '');
      return {
        sku: v.sku || front.sku || '',
        color: colorClean,
        size: v.size || '',
        specs: v.specs || '',
        wholesale_price: '',
        retail_price: '',
        colorClean,
        colorEn: translations.colors[colorClean] || colorClean,
      };
    });

    const firstSku = variants[0]?.sku || front.sku || '';
    const slug = slugify(firstSku, name, idx);
    const gallery = (front.gallery || []).filter(Boolean);

    return {
      id: `cms-${fileName}`,
      name,
      nameEn,
      nameCn: name,
      description: front.description || '',
      category,
      categoryName: CATEGORIES.find((c) => c.slug === category)?.name || category,
      slug,
      variants,
      image: front.image || gallery[0] || null,
      gallery,
      firstSku,
      moq: front.moq,
      oem: front.oem,
      seoTitle: front.seoTitle,
      seoDescription: front.seoDescription,
      draft: Boolean(front.draft),
    } satisfies Product;
  })
  .filter((p) => !p.draft);

export const allProducts: Product[] = [...legacyProducts, ...cmsProducts];

export function getProductsByCategory(category: string): Product[] {
  return allProducts.filter((p) => p.category === category);
}

export function getProductBySlug(category: string, slug: string): Product | undefined {
  return allProducts.find((p) => p.category === category && p.slug === slug);
}

export interface CategoryWithCount {
  slug: string;
  name: string;
  nameCn: string;
  description: string;
  tagline: string;
  count: number;
  cover: ImageMetadata | string | null;
}

export function getCategoriesWithCounts(): CategoryWithCount[] {
  return CATEGORIES.map((c) => {
    const items = getProductsByCategory(c.slug).filter((p) => p.variants.length > 0);
    const cover = items[0]?.image || null;
    return { ...c, count: items.length, cover };
  });
}

export function getFeaturedProducts(perCategory = 2): Product[] {
  const featured: Product[] = [];
  for (const c of CATEGORIES) {
    const items = getProductsByCategory(c.slug).filter((p) => p.variants.length > 0);
    featured.push(...items.slice(0, perCategory));
  }
  return featured;
}

export function getValidCategorySlugs(): string[] {
  return CATEGORIES.map((c) => c.slug);
}
