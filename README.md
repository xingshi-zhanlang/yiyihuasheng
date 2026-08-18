# HiDREAM 宠生几何 — B2B 外贸独立站

HiDREAM 宠物用品品牌独立站，采用 **询盘型** 商业模式：不在线支付，客户把商品加入询盘清单后，通过 WhatsApp 发送商品名称、SKU、链接、数量、国家和备注。

## 生产架构

- Astro 7 + React
- Cloudflare Workers + Static Assets
- Cloudflare D1：商品、分类/变体、MOQ、OEM、发布状态、SEO
- GitHub Static Assets：零成本图片发布
- 自定义 `/admin`：用户名/密码登录、商品管理、媒体上传
- WhatsApp inquiry cart：浏览器本地持久化，不保存客户敏感信息到服务器
- 不使用 R2、不使用 EmDash runtime、不需要独立服务器

## Cloudflare Worker 配置

在 Worker 的 D1 binding 中绑定数据库：

- Binding: `DB`
- Database: `hidream-pet`

在 Cloudflare Worker Secrets 中配置：

- `ADMIN_USER`：后台用户名
- `ADMIN_PASSWORD`：后台复杂密码
- `ADMIN_SESSION_SECRET`：随机长字符串，用于签名管理员 Session
- `GITHUB_TOKEN`：GitHub fine-grained token，仅授予本仓库 Contents Read and write
- `GITHUB_REPO`：`xingshi-zhanlang/yiyihuasheng`
- `GITHUB_BRANCH`：`main`（可省略，默认就是 main）

**不要**把 GitHub token 写进 `wrangler.jsonc`、前端代码或 GitHub 仓库文件。

## 后台

- `/admin`：登录、商品新增/编辑、SKU/变体、MOQ、OEM、发布、SEO
- `/admin/media`：上传 PNG/JPG/WebP/GIF 到 `public/images/uploads/`

零成本媒体模式建议把单张商品图控制在约 1 MB 以内，优先使用 WebP。上传后由 GitHub Commit 触发 Cloudflare Build，随后成为 Worker Static Asset。

## 商品数据

后台发布后，公开的产品总览、分类页和详情页会运行时从 D1 读取；D1 为空或不可用时会自动回退到仓库里的 legacy catalog，确保网站仍可用。

## Cloudflare Workers Build

- Build command: `pnpm build`
- Deploy command: `npx wrangler deploy`
- Node: 22
- pnpm: 11.9.0

## 本地开发

```bash
pnpm install
pnpm dev
```

本地如果不提供 D1 binding，前台会使用仓库内的 legacy product catalog；需要测试后台时请配置对应的 Worker secrets 和 D1 环境。

## 域名

当前可以先使用 Cloudflare 提供的 `workers.dev` 地址。购买 `.com` 域名后，只需要把域名接到 Cloudflare Worker，不需要改变上述架构。
