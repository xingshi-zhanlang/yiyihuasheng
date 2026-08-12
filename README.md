# HiDREAM 宠生几何 — 官网源码

宠物用品 B2B 外贸独立站（询盘型，无在线支付）。

## 技术栈

- **框架**: Astro 5.18（纯静态生成 SSG）
- **样式**: Tailwind CSS 4
- **部署**: Cloudflare Pages
- **询盘**: WhatsApp + Web3Forms
- **多语言**: 内置 Astro i18n（英文 /zh/ 中文）

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
```

## 构建部署

```bash
npm run build    # 输出到 dist/（241页）
```

Cloudflare Pages:
- Build Command: `npm run build`
- Build Output Directory: `dist`
- Root Directory: `/`

## 域名项目名

根据"一一花生"，Cloudflare Pages 项目名：`yiyihuasheng`
Pages Dev 域名：`https://yiyihuasheng.pages.dev`

品牌 HiDREAM（宠物用品品牌），口号：宠生几何
