# 大明王朝1582

以明朝皇帝的有限视角，经营一条可以改变历史的王朝时间线。1582 年张居正去世后开始亲政，跨代延续，存续三百年完成一局。

你看到的是奏折、册报与臣下的说法。库存、地方账本和上报数字分别计算，正常游玩没有真假、腐败或忠诚评分；直到结算才公开实际数据。

## 直接开始

- **在线游玩**：[打开《大明王朝1582》](https://RainbowLion0320.github.io/RealSimulator/)，电脑和手机浏览器均可，无需安装。
- **Windows 网页版**：双击 `start.bat`，浏览器自动打开 `http://127.0.0.1:5187/`。
- **Android**：安装 `output/apk/Ming-Dynasty-1582-0.2.0.apk`。最低 Android 7，竖屏，离线运行。
- 预编译安装包见 [GitHub Releases](https://github.com/RainbowLion0320/RealSimulator/releases/latest)；源码首次构建需要 Node.js 22.12+。网页发行包自带构建结果，启动只用 Windows 自带 PowerShell。

在线版存档保存在当前浏览器，不会自动跨设备同步。从本地版迁移时，请先导出存档，再在在线版点击皇帝头像导入。

新局默认进入亲政引导：先读军饷奏折、作批示，再逐步认识诏令、召见、时间、档案与舆图。底部固定显示当前下一步，可随时跳过。旧存档继续正常游玩；点击皇帝头像 → 开启新王朝可以体验引导，原局先备份到存档 3。

引导结束后，批阅候旨奏报再点击右上角继续时间。新请示送达时自动暂停。点击皇帝头像可以保存、读取、导出和导入存档。

## v0.2.0 内容

五个主页面：案头、召见、诏令、档案、舆图。包含万历和四位首批臣下画像、现代中文奏折与预设对话，保留户部、内阁、军饷等时代称谓。不调用大模型。

可批准赈济、查验、军饷、边防、进攻、议和、互市、水利、税制、学馆、军器、人事与迁驻；官员执行需要时间、钱粮和实际条件。自动与三个手动存档支持长期游玩，网页和 APK 用相同的存档文件。

首版以八个合并区域和综合边境关系建模。制度、派系、外交国家及历史事件还需要进一步细化；当前参数是经过守恒与长期对照测试的游戏标定，不冒充真实史料统计。

## 设计与验证

- [共识与完整设计讨论](docs/game-design.md)
- [数值、信息边界与校准规则](docs/NUMERICAL-MODEL.md)
- [现代中文文案标准](docs/COPY-GUIDE.md)
- [亲政引导与开放节奏](docs/ONBOARDING.md)
- [构建、启动与存档说明](docs/BUILD.md)
- [GitHub Pages 自动发布与存档迁移](docs/DEPLOYMENT.md)
- [运行验证记录](docs/QA.md)
- [视觉验收](docs/design/design-qa.md)
- [素材与许可](docs/design/assets.md)

```powershell
npm ci
npm run check
npm run android:apk
```

项目：[RainbowLion0320/RealSimulator](https://github.com/RainbowLion0320/RealSimulator)。设计与实现保留在同一仓库，通过 Git 记录历史。推送主分支后，GitHub Actions 自动测试、构建并更新在线版。

## 开源许可

采用 [MIT 许可](LICENSE)，允许使用、修改和再分发；保留版权与许可声明。第三方字体、图标及软件保留原许可，详见 [第三方许可说明](THIRD_PARTY_NOTICES.md)。
