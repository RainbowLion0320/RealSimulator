# 大明王朝1582

以明朝皇帝的有限视角，经营一条可以改变历史的王朝时间线。1582 年张居正去世后开始亲政，跨代延续，存续三百年完成一局。

你看到的是奏折、册报与臣下的说法。库存、地方账本和上报数字分别计算，正常游玩没有真假、腐败或忠诚评分；直到结算才公开实际数据。

## 直接开始

- **Windows 网页版**：双击 `start.bat`，浏览器自动打开 `http://127.0.0.1:5187/`。
- **Android**：安装 `output/apk/Ming-Dynasty-1582-0.1.0.apk`。最低 Android 7，竖屏，离线运行。
- 预编译安装包见 GitHub Releases；源码首次构建需要 Node.js 22.12+。网页发行包自带构建结果，启动只用 Windows 自带 PowerShell。

批阅候旨奏报后，点击右上角继续时间。新请示送达时自动暂停。点击皇帝头像可以保存、读取、导出和导入存档。

## v0.1.0 内容

五个主页面：案头、召见、诏令、档案、舆图。包含万历和四位首批臣下画像、现代中文奏折与预设对话，保留户部、内阁、军饷等时代称谓。不调用大模型。

可批准赈济、查验、军饷、边防、进攻、议和、互市、水利、税制、学馆、军器、人事与迁驻；官员执行需要时间、钱粮和实际条件。自动与三个手动存档支持长期游玩，网页和 APK 用相同的存档文件。

首版以八个合并区域和综合边境关系建模。制度、派系、外交国家及历史事件还需要进一步细化；当前参数是经过守恒与长期对照测试的游戏标定，不冒充真实史料统计。

## 设计与验证

- [共识与完整设计讨论](docs/game-design.md)
- [数值、信息边界与校准规则](docs/NUMERICAL-MODEL.md)
- [现代中文文案标准](docs/COPY-GUIDE.md)
- [构建、启动与存档说明](docs/BUILD.md)
- [运行验证记录](docs/QA.md)
- [视觉验收](docs/design/design-qa.md)
- [素材与许可](docs/design/assets.md)

```powershell
npm ci
npm run check
npm run android:apk
```

项目：[RainbowLion0320/RealSimulator](https://github.com/RainbowLion0320/RealSimulator)。设计与实现保留在同一仓库，通过 Git 记录历史。
