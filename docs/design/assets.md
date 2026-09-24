# 第一版素材记录

全部人物与场景插画使用内置 image_gen 生成。人物参考本仓库已选定的 `characters-v1.png`；没有取用演员照片。历史服饰为艺术表现，不宣称精确复原。色彩与表情不表示忠奸。

| 素材 | 用途 | 原始尺寸 |
|---|---|---|
| `public/assets/wanli.png` | 青年万历、启动图标 | 1254 × 1254 |
| `public/assets/zhang.png` | 张四维 | 1254 × 1254 |
| `public/assets/shen.png` | 申时行 | 768 × 768 |
| `public/assets/feng.png` | 冯保 | 1254 × 1254 |
| `public/assets/qi.png` | 戚继光 | 1254 × 1254 |
| `public/assets/landscape.png` | 奏报页淡墨山川 | 2172 × 724 |

后继架空人物复用职官示意画像并标注；第一版没有动态生成人像。

## 生成提示词记录

共用规格：独立方形头肩像，完整帽翼或头盔留在画面内，暖米色纸底，细腻写实的传统彩墨绘画，柔和自然光，适合缩小为头像。无文字、标签、评分、边框、水印或道德暗示。各人身份约束如下：

- **万历**：Use ONLY the LEFTMOST young Wanli emperor in the attached character sheet as the approved face identity, clothing, and painterly style reference. One young adult Wanli circa 1582, clean-shaven youthful oval face, calm attentive neutral expression, black Ming imperial hat with understated gold ornament and side wings, ochre-gold Ming imperial robe and white/red collar. Entire hat and both wings inside with comfortable margins. No actor likeness.
- **张四维**：Use exclusively the SECOND person from the left, Zhang Siwei. Chinese Ming official in his fifties, long lean face, narrow grey beard and mustache, black Ming wushamao official hat with both wide horizontal wings, dark vermilion red embroidered official robe. Match reference face and restrained realistic painterly ink-and-mineral-pigment style.
- **申时行**：Use ONLY the third man from the left, Shen Shixing. Chinese Ming court minister circa age 48, broad oval face, full moustache and moderately abundant pointed beard, black hair. Dark wine-red Ming official robe, white collar, black Ming wusha hat with BOTH long sideways wings completely visible and unclipped. Face subtly looking to viewer left, composed natural expression without moral coding.
- **冯保**：Use ONLY the FOURTH figure, Feng Bao. One middle-aged Chinese Ming court eunuch official circa 1582. Preserve his clean-shaven broad face, composed neutral attentive expression, black rounded Ming palace-official cap with subtle gold seams and small ornament, dark muted teal robe with understated woven pattern and pale inner collar. No villain glare, sneer, heroic grandeur, or dramatic lighting.
- **戚继光**：Use exclusively the FIFTH person, Qi Jiguang. Chinese Ming general in his fifties, weathered broad face, short black-grey mustache and beard, dark iron Ming helmet with subdued gold engraved fittings and dark red plume, dark historic Ming lamellar armor over shoulders. Entire helmet and plume fully inside square with safe margins. Neutral composed human expression.
- **山川**：Standalone wide landscape decorative raster asset, approximately 3:1 horizontal. Fine classical Chinese ink landscape painting on very pale warm ivory paper, distant softly layered misty mountains, one modest section of the Great Wall with a gatehouse along a ridge. Muted warm gray ink, restrained pale ochre, low contrast. Large nearly empty upper half; details weighted toward lower third. No people, text, calligraphy, seals, borders, UI, letters, numbers, watermark, or dramatic dark areas.

以上为逐资产保存的生成约束摘录，完整调用提示词也保留于本次制作任务历史。

## 字体与图标

- Noto Serif SC：npm `@fontsource/noto-serif-sc`，SIL Open Font License，字体随包离线提供。许可副本：`public/licenses/noto-serif-sc.txt`。
- Phosphor Icons：npm `@phosphor-icons/react`，MIT。许可副本：`public/licenses/phosphor.txt`。
- LZ-String：MIT，本机存档压缩。许可副本：`public/licenses/lz-string.txt`。
