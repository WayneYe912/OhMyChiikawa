# OhMyChiikawa

**语言:** [简体中文](README.md) | [English](README.en.md) | [日本語](README.ja.md)

OhMyChiikawa 是一个轻量的桌面宠物，支持 macOS 和 Windows。启动后，默认角色 **乌萨奇** 会出现在桌面上，你也可以在右键菜单里随时切换到 **吉伊（Chiikawa）** 或 **小八（Hachiware）**。三个角色都可以拖动、点击互动、跟随鼠标、偶尔自己走动，也会在待机时眨眼和轻微摆动耳朵。

## 示例

| 桌面展示 | 互动动作 |
| --- | --- |
| ![乌萨奇桌面展示](docs/images/example_01.png) | ![乌萨奇互动动作](docs/images/example_02.png) |

## 功能

- 多角色形象：内置 **乌萨奇**、**吉伊** 和 **小八** 三个形象，右键菜单可随时切换，并自动记住上次的选择。
- 三语言切换：右键菜单可切换界面语言（中文 / English / 日本語），菜单文字与角色台词随之变化，并记住上次选择。
- 透明、无边框、默认置顶显示。
- 拖动摆放：按住角色即可拖到屏幕任意位置。
- 分部位点击互动：点身体会跳一下，点耳朵会单只耳朵抖动，点脸会点头；点手会转手约 2 秒（转手为乌萨奇专属动作）。
- 随机对话：角色会不定时冒出一句话，点击也会触发；不同角色有各自的中英日台词，乌萨奇转手时会播放固定台词。
- 待机动画：呼吸、轻微上下浮动、眨眼、耳朵摆动。
- 鼠标跟随：角色会朝鼠标方向看，可在右键菜单中开关。
- 自动走动：角色会不定时在桌面上散步，可在右键菜单中开关。乌萨奇散步时会播放跑步动画，并随移动方向左右转向。
- 透明区域穿透：角色周围的透明区域不会挡住后面的窗口。
- 小、中、大三种显示尺寸；不同角色在同一尺寸档下视觉大小保持一致。

## 安装与启动

### macOS

推荐使用 Releases 页面提供的 DMG 安装包，这是面向日常使用的方式。

1. 打开项目 Releases 页面，下载适合你电脑的安装包：
   - Apple 芯片：`OhMyChiikawa-<版本>-arm64.dmg`
   - Intel 芯片：`OhMyChiikawa-<版本>-x64.dmg`
2. 双击打开安装包，把 **OhMyChiikawa** 拖到 **Applications / 应用程序**。
3. 安装后可以在「应用程序」里双击 **OhMyChiikawa** 启动。首次打开时，macOS 可能会提示无法确认开发者，请右键点击 **OhMyChiikawa**，选择「打开」，再确认「打开」。这一步通常只需要做一次。

   如果仍打不开，可以在终端执行：

   ```bash
   xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
   ```

安装包里还包含两个辅助文件：

- `READ-ME-FIRST.txt`：安装和首次打开说明。
- `install-cli.command`：可选的命令行启动器安装脚本。只有当你希望在终端使用 `chiikawa` 命令启动应用时，才需要双击它。

如果你希望从终端启动，请先双击安装包里的 `install-cli.command`，之后可以使用：

```bash
chiikawa
chiikawa --scale=small
chiikawa --scale=medium
chiikawa --scale=large
```

### Windows

推荐使用 Releases 页面提供的 NSIS 安装包。

1. 打开项目 Releases 页面，下载 Windows 安装包：
   - `OhMyChiikawa-<版本>-win-x64.exe`（安装版）
   - `OhMyChiikawa-<版本>-portable-x64.exe`（便携版，无需安装）
2. 双击安装包，按照安装向导完成安装。
3. 安装完成后，从开始菜单或桌面快捷方式启动 **OhMyChiikawa**。

安装目录中包含两个辅助文件：

- `READ-ME-FIRST.txt`：安装和首次打开说明。
- `install-cli.bat`：命令行启动器安装脚本。双击它可以将 `chiikawa` 命令添加到系统 PATH。

如果你希望从命令行启动，请先运行安装目录中的 `install-cli.bat`，之后打开**新的**命令提示符或 PowerShell 窗口，即可使用：

```batch
chiikawa
chiikawa --size=small
chiikawa --size=medium
```

### 源码运行（macOS / Windows 通用）

```bash
npm install # 仅第一次安装时要运行
```

```bash
npm start
```

源码运行需要 Node.js 18+ 和 npm 9+。如果不确定是否满足依赖要求，可以尝试直接使用源码 CLI：

```bash
# macOS / Linux
node chiikawa.js
node chiikawa.js --size small

# Windows（命令提示符或 PowerShell）
node chiikawa.js
node chiikawa.js --size small
```

脚本会先检查本地依赖；如果依赖缺失，会提示并尝试自动执行 `npm install`。如果本机没有 npm，或依赖安装失败，终端会给出对应的处理提示。

## 基本用法

| 操作 | 效果 |
| --- | --- |
| 拖动角色 | 移动到桌面任意位置 |
| 单击身体 | 跳一下，并随机说一句话 |
| 单击耳朵 | 单只耳朵抖动 |
| 单击脸 | 头部点头 |
| 单击手臂 | 播放转手动作（乌萨奇专属） |
| 双击角色 | 播放转手动作约 2 秒（乌萨奇专属） |
| 右键角色 | 打开功能菜单 |
| 菜单：角色 | 在乌萨奇、吉伊和小八之间切换（记住选择） |
| 菜单：语言 | 切换中文 / English / 日本語（记住选择） |
| 菜单：跟随鼠标 | 开启或关闭鼠标跟随 |
| 菜单：四处走动 | 开启或关闭自动散步 |
| 菜单：总在最前 | 开启或关闭置顶显示 |
| 菜单：大小 | 切换小、中、大尺寸 |
| 菜单：跳一下 / 转手 | 手动触发动作（转手仅乌萨奇） |
| 菜单：退出 | 关闭 OhMyChiikawa |

## 平台说明

OhMyChiikawa 支持 macOS 和 Windows。

- **macOS**：提供 DMG 安装包（arm64 / x64），推荐直接从 Releases 页面下载安装。安装包内包含首次打开说明和可选 CLI 安装脚本，支持 `chiikawa` 命令行启动。
- **Windows**：提供 NSIS 安装包和便携版（均 x64），支持 `chiikawa` 命令行启动（运行安装目录中的 `install-cli.bat` 添加至 PATH）。
- **打包命令**：
  - macOS：`npm run dist:mac`
  - Windows：`npm run dist:win`（需在 Windows 环境下运行，或交叉编译）
  - Windows NSIS：`npm run dist:win:nsis`
  - Windows 便携版：`npm run dist:win:portable`

## 未来计划

后续版本会陆续加入更多 Chiikawa 形象，并持续补充现有形象的动画表现和互动内容。

下一版本计划包含：

- 为吉伊和小八补充更多专属动作与互动。
- 为更多形象加入移动、互动动画。

## 常见问题

**为什么安装包首次打开会被拦截？**

macOS 对未从 App Store 下载的应用会有额外确认。首次打开请右键 OhMyChiikawa 选择「打开」，或执行：

```bash
xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
```

**角色挡住了桌面点击？**

只有角色本体可交互，透明区域会穿透点击。如果需要降低干扰，可以右键关闭「总在最前」，或把角色拖到屏幕边缘。

**怎么退出？**

右键角色，选择退出菜单。

## 授权

项目代码使用 MIT License。

项目内的「吉伊（Chiikawa）」「乌萨奇（Usagi）」和「小八（Hachiware）」形象均来自日本动画《Chiikawa》，形象版权归属 Chiikawa。内置图片仅用于个人桌面宠物使用；替换或分发图片时，请确保你拥有对应使用权。
