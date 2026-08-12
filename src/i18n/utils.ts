// i18n 工具函数：locale 检测、翻译查询、路径生成
import en from './locales/en.json';
import zh from './locales/zh.json';

export const LOCALES = ['en', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const translations: Record<Locale, Record<string, any>> = {
  en: en as Record<string, any>,
  zh: zh as Record<string, any>,
};

// 从 URL 中提取 locale
export function getLocaleFromUrl(url: URL): Locale {
  const [, lang] = url.pathname.split('/');
  if (lang === 'zh') return 'zh';
  return 'en';
}

// 获取当前页面的 locale 前缀（英文为空，中文为 /zh）
export function getLocalePath(locale: Locale): string {
  return locale === 'en' ? '' : '/zh';
}

// 生成带 locale 前缀的路径
export function localizedPath(path: string, locale: Locale): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'en') return cleanPath;
  return `/zh${cleanPath === '/' ? '' : cleanPath}`;
}

// 获取切换语言后的对应路径
export function getSwitchPath(currentPath: string, targetLocale: Locale): string {
  // 移除现有的 /zh 前缀
  const pathWithoutLocale = currentPath.replace(/^\/zh(\/|$)/, '/').replace(/^\/zh$/, '/');
  return localizedPath(pathWithoutLocale, targetLocale);
}

// 翻译函数：t(locale, 'nav.home') => 'Home' 或 '首页'
export function t(locale: Locale, key: string, params?: Record<string, string>): string {
  const dict = translations[locale] || translations[DEFAULT_LOCALE];
  const parts = key.split('.');
  let value: any = dict;
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      // 回退到英文
      value = undefined;
      break;
    }
  }
  if (value === undefined) {
    // 尝试英文回退
    let fallback: any = translations[DEFAULT_LOCALE];
    for (const part of parts) {
      if (fallback && typeof fallback === 'object' && part in fallback) {
        fallback = fallback[part];
      } else {
        return key; // 找不到返回 key 本身
      }
    }
    value = fallback;
  }
  if (typeof value === 'string' && params) {
    // 简单的参数替换 {name} => params.name
    return value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
  }
  return typeof value === 'string' ? value : key;
}

// 获取翻译的品类名
export function getCategoryName(locale: Locale, categorySlug: string): string {
  return t(locale, `categories.${categorySlug}`);
}

// 获取 HTML lang 属性
export function getHtmlLang(locale: Locale): string {
  return locale === 'zh' ? 'zh-CN' : 'en';
}
