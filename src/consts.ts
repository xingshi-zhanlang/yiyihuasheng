// 站点全局常量配置

export const SITE = {
  name: 'HiDREAM',
  brand: 'HiDREAM® 宠生几何',
  slogan: '与爱宠同行，从 HiDREAM 开始',
  title: 'HiDREAM® 宠生几何 — 宠物出行用品 B2B 批发 | OEM/ODM',
  description:
    'HiDREAM® 宠生几何是宠物出行用品设计品牌，提供猫狗外出包、胸背牵引、车载出行、功能配件等全品类产品。支持 OEM/ODM 定制，品质质检，全球物流。欢迎批发询价。',
  url: 'https://hidream-pet.com',
  defaultOgImage: '/images/og-cover.jpg',
} as const;

// 联系方式（电话号码为占位符，部署前替换）
export const CONTACT = {
  whatsapp: '8613800138000',
  whatsappDisplay: '+86 138 0013 8000',
  email: 'sales@hidream-pet.com',
  phone: '+86 138-0013-8000',
  address: 'HiDREAM Pet Products Co., Ltd. · China',
  // Web3Forms access key（部署前替换为真实 key）
  web3formsKey: 'YOUR_ACCESS_KEY',
} as const;

// 品类配置：key 与 products.json 中的 category 字段对应
export interface CategoryInfo {
  slug: string;
  name: string; // 英文名（用于 URL 与导航）
  nameCn: string; // 中文名
  description: string;
  tagline: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: 'new-arrivals',
    name: 'New Arrivals',
    nameCn: '新品推荐',
    description:
      'Latest designs from the valley series — carriers, harnesses and travel gear crafted for comfort and style.',
    tagline: 'Fresh from the valley',
  },
  {
    slug: 'carrier-bags',
    name: 'Carrier Bags',
    nameCn: '猫狗外出包',
    description:
      'Airline-approved and everyday pet carriers. Backpacks, totes, sling bags and travel carriers for cats and dogs.',
    tagline: 'Carry your companion',
  },
  {
    slug: 'cat-products',
    name: 'Cat Products',
    nameCn: '猫产品专区',
    description:
      'Cat harnesses, leashes, recovery suits and interactive toys — designed for feline comfort and safety.',
    tagline: 'Made for cats',
  },
  {
    slug: 'dog-travel',
    name: 'Dog Travel',
    nameCn: '狗狗出行产品',
    description:
      'Dog harnesses, leashes, head collars and travel accessories. Valley series and Bobo series collections.',
    tagline: 'Adventure together',
  },
  {
    slug: 'functional',
    name: 'Functional Gear',
    nameCn: '其他功能产品',
    description:
      'Pet strollers, recovery collars, travel bowls, car seats and bath accessories for every journey.',
    tagline: 'Thoughtful essentials',
  },
];

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];
