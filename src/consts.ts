// 站点全局常量配置；基础品牌与联系方式可通过 /admin 修改。
import siteSettings from './data/site-settings.json';

export const SITE = {
  name: 'HiDREAM',
  brand: siteSettings.brand,
  slogan: '与爱宠同行，从 HiDREAM 开始',
  title: siteSettings.title,
  description: siteSettings.description,
  url: 'https://hidream-pet.com',
  defaultOgImage: siteSettings.defaultOgImage,
} as const;

export const CONTACT = {
  whatsapp: siteSettings.whatsapp,
  whatsappDisplay: `+${siteSettings.whatsapp}`,
  email: siteSettings.email,
  phone: `+${siteSettings.whatsapp}`,
  address: 'HiDREAM Pet Products Co., Ltd. · China',
  web3formsKey: 'YOUR_ACCESS_KEY',
} as const;

export interface CategoryInfo {
  slug: string;
  name: string;
  nameCn: string;
  description: string;
  tagline: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: 'new-arrivals',
    name: 'New Arrivals',
    nameCn: '新品推荐',
    description: 'Latest designs from the valley series — carriers, harnesses and travel gear crafted for comfort and style.',
    tagline: 'Fresh from the valley',
  },
  {
    slug: 'carrier-bags',
    name: 'Carrier Bags',
    nameCn: '猫狗外出包',
    description: 'Airline-approved and everyday pet carriers. Backpacks, totes, sling bags and travel carriers for cats and dogs.',
    tagline: 'Carry your companion',
  },
  {
    slug: 'cat-products',
    name: 'Cat Products',
    nameCn: '猫产品专区',
    description: 'Cat harnesses, leashes, recovery suits and interactive toys — designed for feline comfort and safety.',
    tagline: 'Made for cats',
  },
  {
    slug: 'dog-travel',
    name: 'Dog Travel',
    nameCn: '狗狗出行产品',
    description: 'Dog harnesses, leashes, head collars and travel accessories. Valley series and Bobo series collections.',
    tagline: 'Adventure together',
  },
  {
    slug: 'functional',
    name: 'Functional Gear',
    nameCn: '其他功能产品',
    description: 'Pet strollers, recovery collars, travel bowls, car seats and bath accessories for every journey.',
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
