# HiDREAM CMS 重构方案（2026-08）

## 目标

把当前 HiDREAM 独立站从“代码维护型静态站”升级为“Cloudflare 无服务器 Headless Commerce / Brand CMS”，同时保留现有品牌视觉、SEO、双语和 WhatsApp 询盘体验。

## 核心决策

- CMS 基础：EmDash（Astro 原生、D1 + R2 + Admin + Media + RBAC）
- 前端：继续使用 Astro，迁移现有 HiDREAM 视觉组件，而不是套用 EmDash 默认主题
- 运行方式：Cloudflare Workers，而不是 Cloudflare Pages。EmDash 官方要求现有 Astro 项目从 Pages 迁移到 Workers
- 数据：Cloudflare D1
- 图片：Cloudflare R2
- 域名：一个主域名 `hidream-pet.com`
- 询盘：保留本地 Inquiry Cart + WhatsApp deep link，不接在线支付
- 内容：Products / Collections / Homepage sections / Site settings / SEO 进入 CMS
- 认证：优先使用 EmDash 原生 Passkey（WebAuthn）。不启用 GitHub OAuth。若业务上必须使用“用户名 + 密码”，作为独立 auth provider 实现，而不是绕过 EmDash session/RBAC
- 插件：第一阶段不启用 Dynamic Worker plugins，以避免额外付费依赖和扩大攻击面

## 为什么不是继续自写 CMS

当前项目已经出现自定义登录、session、admin API、内容配置逐步叠加的趋势。继续自写会把维护面扩大到认证、CSRF、RBAC、媒体上传、审计、schema、revision 等高风险模块。EmDash 已提供这些基础能力，因此本次只自定义业务内容模型和品牌前台。

## 内容模型

### Product

- slug
- name
- nameCn
- sku
- category
- status
- shortDescription
- description
- coverImage
- gallery
- lifestyleImages
- detailImages
- variants
- specifications
- moq
- oem
- odm
- leadTime
- seoTitle
- seoDescription
- ogImage

### Collection

- slug
- name / nameCn
- description / descriptionCn
- coverImage
- featured
- sortOrder

### HomepageSection

- sectionType
- enabled
- sortOrder
- title / subtitle / description
- desktopImage
- mobileImage
- products
- collection
- cta
- richContent

### SiteSettings

- brand
- title
- description
- logo
- favicon
- defaultOgImage
- whatsapp
- email
- navigation
- social links

## 图片策略

原始高清图片进入 R2；前台通过 Astro image pipeline / CDN 使用合适尺寸和格式。GitHub 不再承担商品原图存储。

建议目录语义：

- `products/{product-slug}/`
- `collections/{collection-slug}/`
- `homepage/`
- `brand/`
- `blog/`

## 前台策略

保留：

- HiDREAM 当前视觉体系
- 中英文路由
- Product detail
- Product listing
- WhatsApp inquiry cart
- JSON-LD / canonical / hreflang / sitemap
- 响应式移动端

替换：

- `src/data/products.json` 作为生产数据源
- `src/data/site-settings.json` 作为生产配置源
- 自写 admin/auth/session
- 本地商品图片作为生产媒体源

## 发布与缓存

CMS 内容存 D1，媒体存 R2。公开页面采用 SSR + Cloudflare caching；Admin/API 明确 `private, no-store`。不再依赖“修改内容必须 Git commit + build”才能上线。

## 成本与限制

EmDash 当前为 beta preview。Cloudflare 部署可以使用 D1 + R2 + Workers；但其插件 sandbox 的 Dynamic Workers 需要 Cloudflare 付费计划。第一阶段关闭插件加载，因此不依赖该能力。正式上线前必须完成真实 Cloudflare Worker 构建、D1 migration、R2 upload、Admin 登录和缓存回归测试。

## 迁移原则

1. 先建独立分支，不直接修改 main
2. 先完成运行时骨架和数据库/媒体绑定
3. 再建立内容模型
4. 再迁移现有产品数据
5. 再迁移首页与产品前台
6. 最后切换域名
7. 任何一步构建失败都不合并 main

## 验收标准

- `/`、`/products`、产品详情、`/zh/*` 正常
- `/_emdash/admin` 可登录
- Product 可新增/编辑/发布
- R2 高清图可上传并在前台显示
- 修改产品后无需 Git commit 即可在前台生效
- Inquiry Cart 可跨页面保存
- WhatsApp 消息包含产品名称、SKU、数量、URL、国家、备注
- canonical / hreflang / sitemap / JSON-LD 正常
- Admin/API 不被公共缓存
- Cloudflare Worker build 与 deployment 成功
- 原 main 分支保持可回滚
