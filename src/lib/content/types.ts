export interface ProductVariant {
  sku?: string;
  color?: string;
  size?: string;
  specs?: Record<string, string>;
}

export interface ProductContent {
  slug: string;
  name: string;
  nameZh?: string;
  sku: string;
  status?: 'draft' | 'published' | 'archived';
  category?: string;
  shortDescription?: string;
  description?: string;
  features?: string[];
  coverImage?: string;
  gallery?: string[];
  lifestyleImages?: string[];
  detailImages?: string[];
  variants?: ProductVariant[];
  moq?: string;
  oem?: boolean;
  odm?: boolean;
  leadTime?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
}

export interface ContentRepository {
  listProducts(): Promise<ProductContent[]>;
  getProductBySlug(slug: string): Promise<ProductContent | null>;
}
