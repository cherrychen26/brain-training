# 发布与日常更新

仓库：https://github.com/cherrychen26/brain-training
网站：https://cherrychen26.github.io/brain-training/
发布分支：main；GitHub Pages Source：GitHub Actions。

## 构建方式

- 本机开发：`npm ci` 后运行 `npm run dev`。
- 本机正式版：`npm run build` → dist，`npm run preview`。
- Pages：`npm run build:pages` → dist-pages，资源前缀 `/brain-training/`。
- 预览 Pages：`npm run preview:pages -- --port 4175 --strictPort`，打开 `http://127.0.0.1:4175/brain-training/`。

PWA manifest 的 start_url、scope、图标及 Service Worker 范围均跟随 base。原有 hash 路由保留，例如 `#/reports`，直接进入或刷新不会请求服务器子路由。页面、训练算法和存档机制不变。

## 自动部署

推送 main 后，Actions 执行依赖安装、单元测试、构建与浏览器验收，通过后才部署。拉取请求只做检查。请到仓库 Actions 查看 Test and deploy GitHub Pages，必须 build 和 deploy 都成功才代表网页发布成功。失败时打开对应步骤查看原因，修复后提交即可再次触发，不要强制推送。

GitHub Actions 用 Node.js 22 与 Chromium；Windows 本机浏览器测试默认使用 Edge。部署仅用 GitHub 自动提供的权限，不需在源码放入个人 Token。

## 以后修改

```powershell
git pull --ff-only
# 修改并保存文件
npm test
npm run build:pages
git status
git add <已确认要提交的文件>
git diff --cached
git commit -m "说明本次修改"
git push origin main
```

等待 Actions 成功，再打开网站。已安装 PWA 的旧页面可能需要接受更新提示并刷新。

## 本地数据与手机

首次在线访问后，等设置页显示离线资源已就绪，再按浏览器菜单安装。手机可用浏览器打开目标网址；真实设备安装入口由浏览器决定。

个人成绩只在浏览器 IndexedDB，不会随源码上传。localhost 与 GitHub Pages 不同源，不能自动共享历史。先在本机导出 JSON，再到线上设置页导入；切勿将个人 JSON 放进仓库。切换电脑、手机和浏览器也需要手动导入，不提供云同步。浏览器清理站点数据会影响本地存档。

构建产物、依赖、日志、密钥及备份由 .gitignore 排除。保留源文件和 package-lock.json，以便每次自动构建。
