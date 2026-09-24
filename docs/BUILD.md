# 构建与运行

## 直接玩

Windows：双击仓库根目录 `start.bat`。已有 `dist` 时用 Windows 自带 PowerShell 启动本机静态服务，不需要安装 Node 或 Python。地址固定 `http://127.0.0.1:5187/`，存档保存在这个地址的浏览器存储里。

预编译网页包同样包含 `start.bat`、`scripts/`、`dist/`，解压后双击即可。不把开发服务器或 npm 安装作为已构建发行包的运行前提。服务仅监听回环地址，不向局域网公开。

源码首次运行若没有 `dist`，需要 Node.js 22.12+，启动脚本会执行 `npm ci` 与构建。手动开发：

```powershell
npm ci
npm run dev
npm run check
```

不要同时启动两个 5187 服务；构建后的静态服务支持直接读取新构建文件，网页刷新生效。

## Android

APK 应用 ID：`com.rainbowlion.ming`，显示名：大明王朝1582。竖屏，Android 7.0 / API 24 及以上；目标 API 36。游戏与图片、字体全部打入包中，运行不需要联网或模型服务。

```powershell
npm ci
npm run android:apk
```

本机脚本默认使用已安装工具目录 `G:\tools\tabletop-android`，未修改其他项目。可设置环境变量 `MING_ANDROID_TOOLS` 或给 `scripts/build-android.ps1` 传入 `-ToolsRoot`，目录需含：

- `jdk/jdk-21.0.12.1+1`
- `sdk/platforms/android-36`、`sdk/build-tools/36.0.0` 和 platform-tools
- `gradle/gradle-8.14.3`

其他机器可按 [Capacitor 官方环境说明](https://capacitorjs.com/docs/getting-started/environment-setup) 安装对应 Android 工具后调整脚本路径。依赖版本锁在 `package-lock.json`。

脚本运行网页构建、同步资源、Gradle release 构建、zipalign、apksigner 签名并验证，输出 `output/apk/Ming-Dynasty-1582-0.1.0.apk` 和 SHA-256 文件。不是只改扩展名的网页文件。

首次构建生成本项目独立的持久签名密钥，存于 `%LOCALAPPDATA%\RealSimulator\signing`，不会提交 Git。后续升级必须沿用同一个密钥和应用 ID；请私下备份此目录。测试安装使用 `adb install -r`，不清除已有存档。

## 存档

自动存档 + 三个手动槽。网页导出 JSON；Android 使用系统文件选择器保存文件；导入使用文件选择器。两端格式一致。导入会检查格式、版本、完整性与必需字段，失败不会覆盖现有王朝。

卸载 APK、清除应用数据或浏览器站点数据都会删除本机存档，应先导出。不同浏览器、不同本地端口之间也需要导出和导入。

## 校验与交付记录

`npm test` 验证引擎；`npm run build` 验证类型与网页构建。界面与 APK 的实测记录见 `docs/QA.md`，视觉核对见 `docs/design/design-qa.md`。

当前 npm 审计中的三个 moderate 项来自 Capacitor CLI 的 iOS 构建依赖 xcode → uuid，不打入网页或 Android 运行包。生产依赖应单独执行 `npm audit --omit=dev` 检查。未为消除提示而强制降级构建工具。
