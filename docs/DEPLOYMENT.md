# GitHub Pages 发布

在线游玩：<https://RainbowLion0320.github.io/RealSimulator/>。

项目以公开仓库的 GitHub Pages 托管 `dist` 静态文件，不需要游戏服务器或大模型接口。浏览器首次打开需要下载网页、字体和画像；当前没有离线缓存服务，不保证断网重新打开网站可用。需要完整离线运行时使用本地网页发行包或 APK。

## 自动更新

仓库 Settings → Pages → Build and deployment 的 Source 选择 **GitHub Actions**。`.github/workflows/pages.yml` 在推送 `main` 或手动执行时运行：

1. 使用 Node.js 22 和 `npm ci` 安装锁定依赖。
2. `npm run check` 完成模拟器测试、TypeScript 检查和生产构建。
3. 测试与构建通过后，将 `dist` 上传并发布到 `github-pages` 环境。

在仓库 Actions 中查看运行结果。构建失败不会替换已上线版本；修复后重新推送即可。也可以在 Actions → Deploy game to GitHub Pages → Run workflow 手动重发。部署使用 GitHub 自动提供的令牌，不需要保存个人访问令牌。

Vite 保持 `base: "./"`，图片也使用相对地址，以适配 `/RealSimulator/` 子路径。首页不存在服务器路由依赖。不要把 Android 签名文件、本地存档、环境变量文件或整个工作目录上传为网站内容。

## 存档与访问

存档保存在当前浏览器的本地存储中，不上传 GitHub，不自动跨设备同步。清除网站数据会删除本机存档，建议定期导出备份。不同网址的存储互相独立：从 `localhost` 或 `127.0.0.1` 转到公网版，需要在旧版导出，再从新版皇帝头像菜单导入。

网页更新不会主动清空存档。若出现旧界面，可先备份存档再刷新页面。访问速度受所在网络到 GitHub Pages 的连通性影响。

## 许可

项目采用 MIT 许可，第三方字体、图标和软件保留各自许可，见根目录 `LICENSE` 与 `THIRD_PARTY_NOTICES.md`。网站发布包同时携带 `licenses/` 许可副本。
