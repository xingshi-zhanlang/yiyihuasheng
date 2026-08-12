// 产品数据辅助层：解析 products.json，使用精确的SKU-图片映射，生成 slug
// 所有文件系统操作均在构建时（SSG）执行
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

// SKU -> 图片列表的映射（从xlsx drawing XML精确解析得到）
const skuImageMap = imageMapping as Record<string, { images: string[]; category: string; product_name: string }>;

// 用 import.meta.glob 批量导入 src/assets/products 下的所有图片
// eager: true 表示立即导入，返回 { path: ImageMetadata }
const productImageGlob = import.meta.glob('../assets/products/**/*.{png,jpg,jpeg,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, ImageMetadata>;

// 建立 文件名 -> ImageMetadata 的映射，方便按文件名查找
const imageByName: Record<string, ImageMetadata> = {};
for (const [path, meta] of Object.entries(productImageGlob)) {
  const filename = path.split('/').pop() || '';
  if (filename) {
    imageByName[filename] = meta;
  }
}

// 原始产品类型
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

// 解析后的产品类型
export interface Variant extends RawVariant {
  colorClean: string;
  colorEn: string; // 英文颜色名
}

export interface Product {
  id: string;
  name: string; // 产品名（第一行，中文）
  nameEn: string; // 英文产品名
  nameCn: string; // 同 name（中文产品名）
  description: string; // 产品描述（剩余行）
  category: string;
  categoryName: string;
  slug: string;
  variants: Variant[];
  image: ImageMetadata | null; // 主图（Astro ImageMetadata）
  gallery: ImageMetadata[]; // 图集
  firstSku: string;
}

// 翻译辅助函数：根据 locale 返回产品名
export function getProductName(p: Product, locale: Locale): string {
  return locale === 'zh' ? p.nameCn : (p.nameEn || p.nameCn);
}

// 翻译辅助函数：根据 locale 返回颜色名
export function getVariantColor(v: Variant, locale: Locale): string {
  return locale === 'zh' ? v.colorClean : (v.colorEn || v.colorClean);
}

const products = rawProducts as RawProduct[];

// 清理字符串：去除首尾空白与多余换行
function clean(s: string): string {
  return (s || '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

// 由 SKU 生成 URL slug；无 SKU 时回退到名称 + 索引
function slugify(sku: string, name: string, index: number): string {
  if (sku) {
    return sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'item'}-${index}`;
}

// 根据产品的变体SKU列表，从映射表中查找所有对应的图片
// 返回 ImageMetadata 数组（Astro可优化的图片对象）
function getImagesForProduct(variants: RawVariant[]): ImageMetadata[] {
  const images: ImageMetadata[] = [];
  const seen = new Set<string>();
  for (const v of variants) {
    const mapping = skuImageMap[v.sku];
    if (mapping && mapping.images) {
      for (const img of mapping.images) {
        if (!seen.has(img)) {
          seen.add(img);
          const meta = imageByName[img];
          if (meta) {
            images.push(meta);
          }
        }
      }
    }
  }
  return images;
}

// 解析全部产品
export const allProducts: Product[] = products.map((p, idx) => {
  const lines = (p.name || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const name = lines[0] || `Product ${idx + 1}`;
  const description = lines.slice(1).join(' ') || p.description || '';

  // 查找英文产品名翻译
  const nameEn = translations.products[name] || name;

  const variants: Variant[] = (p.variants || []).map((v) => ({
    ...v,
    colorClean: clean(v.color),
    colorEn: translations.colors[v.color?.trim()] || clean(v.color),
  }));

  const firstSku = variants[0]?.sku || '';
  const slug = slugify(firstSku, name, idx);

  // 使用精确的SKU-图片映射为产品分配图片
  const productImages = getImagesForProduct(p.variants || []);

  const image = productImages.length > 0 ? productImages[0] : null;

  // 图集：使用该产品所有变体对应的图片（最多8张）
  const gallery = productImages.slice(0, 8);

  return {
    id: `p-${idx}`,
    name,
    nameEn,
    nameCn: name,
    description,
    category: p.category,
    categoryName: p.category_name,
    slug,
    variants,
    image,
    gallery,
    firstSku,
  };
});

// 按品类分组
export function getProductsByCategory(category: string): Product[] {
  return allProducts.filter((p) => p.category === category);
}

// 根据 category + slug 获取单个产品
export function getProductBySlug(
  category: string,
  slug: string,
): Product | undefined {
  return allProducts.find((p) => p.category === category && p.slug === slug);
}

// 品类信息 + 产品数 + 封面图
export interface CategoryWithCount {
  slug: string;
  name: string;
  nameCn: string;
  description: string;
  tagline: string;
  count: number;
  cover: ImageMetadata | null;
}

export function getCategoriesWithCounts(): CategoryWithCount[] {
  return CATEGORIES.map((c) => {
    const items = getProductsByCategory(c.slug).filter((p) => p.variants.length > 0);
    const cover = items[0]?.image || null;
    return {
      ...c,
      count: items.length,
      cover,
    };
  });
}

// 精选产品：每个品类取前 N 个（有变体的）
export function getFeaturedProducts(perCategory = 2): Product[] {
  const featured: Product[] = [];
  for (const c of CATEGORIES) {
    const items = getProductsByCategory(c.slug).filter(
      (p) => p.variants.length > 0,
    );
    featured.push(...items.slice(0, perCategory));
  }
  return featured;
}

// 有效品类 slug 集合（用于 getStaticPaths 校验）
export function getValidCategorySlugs(): string[] {
  return CATEGORIES.map((c) => c.slug);
}
