# OhMyChiikawa

<a id="中文"></a>

**语言 / Language:** [中文](#中文) | [English](#english)

OhMyChiikawa 是一个轻量的桌面宠物。启动后，默认角色 **乌萨奇** 会出现在桌面上，你也可以在右键菜单里随时切换到 **吉伊（Chiikawa）**。两个角色都可以拖动、点击互动、跟随鼠标、偶尔自己走动，也会在待机时眨眼和轻微摆动耳朵。

## 示例

| 桌面展示 | 互动动作 |
| --- | --- |
| ![乌萨奇桌面展示](docs/images/example_01.png) | ![乌萨奇互动动作](docs/images/example_02.png) |

## 功能

- 多角色形象：内置 **乌萨奇** 和 **吉伊** 两个形象，右键菜单可随时切换，并自动记住上次的选择。
- 中英文切换：右键菜单可切换界面语言（中文 / English），菜单文字与角色台词随之变化，并记住上次选择。
- 透明、无边框、默认置顶显示。
- 拖动摆放：按住角色即可拖到屏幕任意位置。
- 分部位点击互动：点身体会跳一下，点耳朵会单只耳朵抖动，点脸会点头；点手会转手约 2 秒（转手为乌萨奇专属动作）。
- 随机对话：角色会不定时冒出一句话，点击也会触发；不同角色有各自的台词，乌萨奇转手时固定喊“噜噜噜噜噜！”。
- 待机动画：呼吸、轻微上下浮动、眨眼、耳朵摆动。
- 鼠标跟随：角色会朝鼠标方向看，可在右键菜单中开关。
- 自动走动：角色会不定时在桌面上散步，可在右键菜单中开关。乌萨奇散步时会播放跑步动画，并随移动方向左右转向。
- 透明区域穿透：角色周围的透明区域不会挡住后面的窗口。
- 小、中、大三种显示尺寸；不同角色在同一尺寸档下视觉大小保持一致。

## 安装与启动

OhMyChiikawa 目前仅支持 macOS。推荐使用 Releases 页面提供的 DMG 安装包，这是面向日常使用的方式。

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

如果不想安装应用，也可以直接拉取本开源项目，在项目根目录运行：

```bash
npm install # 仅第一次安装时要运行
```

```bash
npm start
```

源码运行需要 Node.js 18+ 和 npm 9+。如果不确定是否满足依赖要求，可以尝试直接使用源码 CLI：

```bash
node chiikawa.js
node chiikawa.js --size small
```

脚本会先检查本地依赖；如果依赖缺失，会提示并尝试自动执行 `npm install`。如果本机没有 npm，或依赖安装失败，终端会给出对应的处理提示。

## 基本用法

| 操作          | 效果              |
| ----------- | --------------- |
| 拖动角色        | 移动到桌面任意位置       |
| 单击身体        | 跳一下，并随机说一句话     |
| 单击耳朵        | 单只耳朵抖动          |
| 单击脸         | 头部点头            |
| 单击手臂        | 播放转手动作（乌萨奇专属）   |
| 双击角色        | 播放转手动作约 2 秒（乌萨奇专属） |
| 右键角色        | 打开功能菜单          |
| 菜单：角色       | 在乌萨奇和吉伊之间切换（记住选择） |
| 菜单：语言       | 切换中文 / English（记住选择） |
| 菜单：跟随鼠标     | 开启或关闭鼠标跟随       |
| 菜单：四处走动     | 开启或关闭自动散步       |
| 菜单：总在最前     | 开启或关闭置顶显示       |
| 菜单：大小       | 切换小、中、大尺寸       |
| 菜单：跳一下 / 转手 | 手动触发动作（转手仅乌萨奇）  |
| 菜单：退出       | 关闭 OhMyChiikawa |

## 平台说明

OhMyChiikawa 目前支持 macOS，Windows 版本正在准备中。

## 未来计划

后续版本会陆续加入更多 Chiikawa 形象，并持续补充现有形象的动画表现和互动内容。

下一版本计划包含：

- 为吉伊补充更多专属动作与互动。
- 为更多形象加入移动、互动动画。

## 常见问题

**为什么安装包首次打开会被拦截？**

macOS 对未从 App Store 下载的应用会有额外确认。首次打开请右键 OhMyChiikawa 选择「打开」，或执行：

```bash
xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
```

**乌萨奇挡住了桌面点击？**

只有乌萨奇本体可交互，透明区域会穿透点击。如果需要降低干扰，可以右键关闭“总在最前”，或把乌萨奇拖到屏幕边缘。

**怎么退出？**

右键乌萨奇，选择退出菜单。

## 授权

项目代码使用 MIT License。

项目内的「吉伊（Chiikawa）」和「乌萨奇（Usagi）」形象均来自日本动画《Chiikawa》，形象版权归属 Chiikawa。内置图片仅用于个人桌面宠物使用；替换或分发图片时，请确保你拥有对应使用权。

***

<a id="english"></a>

**Language / 语言:** [中文](#中文) | [English](#english)

# OhMyChiikawa

OhMyChiikawa is a lightweight desktop pet. After launch, the default character **usagi** appears on your desktop, and you can switch to **Chiikawa** anytime from the right-click menu. Both characters can be dragged around, clicked on different body parts, follow the cursor, wander occasionally, and play idle animations such as blinking and subtle ear movement.

## Preview

| Desktop view | Interaction |
| --- | --- |
| ![usagi desktop view](docs/images/example_01.png) | ![usagi interaction](docs/images/example_02.png) |

## Features

- Multiple characters: **usagi** and **Chiikawa** are both built in; switch anytime from the context menu, and your last choice is remembered.
- Language toggle: switch the interface between 中文 / English from the context menu — menu text and character speech follow, and the choice is remembered.
- Transparent, frameless, and always on top by default.
- Drag to place the pet anywhere on the desktop.
- Part-aware clicks: body hops, ears wiggle, face nods, and paws trigger a hand-rolling action for about 2 seconds (hand-rolling is usagi-only).
- Random speech bubbles with per-character lines; usagi's rolling action always says “噜噜噜噜噜！”.
- Idle animations: breathing, floating, blinking, and ear movement.
- Cursor following, toggled from the context menu.
- Random wandering, toggled from the context menu. Usagi plays a run animation while wandering and turns to face its direction of travel.
- Click-through transparent area around the pet.
- Small, medium, and large display sizes; characters keep a consistent on-screen size at the same setting.

## Install and Launch

OhMyChiikawa currently supports macOS only. The recommended path for everyday use is the DMG installer from the Releases page.

1. Open the project Releases page and download the installer for your Mac:
   - Apple Silicon: `OhMyChiikawa-<version>-arm64.dmg`
   - Intel: `OhMyChiikawa-<version>-x64.dmg`
2. Open the installer and drag **OhMyChiikawa** into **Applications**.
3. After installation, launch **OhMyChiikawa** from Applications. On first launch, macOS may ask for extra confirmation. Right-click **OhMyChiikawa**, choose **Open**, then confirm **Open**. This is usually needed only once.

   If it still cannot open, run:
   ```bash
   xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
   ```

The installer also includes two helper files:

- `READ-ME-FIRST.txt`: installation and first-launch instructions.
- `install-cli.command`: an optional command-line launcher installer. Double-click it only if you want to start OhMyChiikawa from Terminal with the `chiikawa` command.

If you prefer launching from Terminal, double-click `install-cli.command` in the installer first. Then you can use:

```bash
chiikawa
chiikawa --scale=small
chiikawa --scale=medium
chiikawa --scale=large
```

If you do not want to install the app, you can also clone this open-source project and run it from the project root:

```bash
npm install # only needed for the first setup
```

```bash
npm start
```

Running from source requires Node.js 18+ and npm 9+. You can also use the source CLI directly:

```bash
node chiikawa.js
node chiikawa.js --size small
```

The script checks local dependencies before launch. If dependencies are missing, it explains what is happening and tries to run `npm install`. If npm is unavailable or installation fails, the terminal output gives the next manual step.

## Basic Usage

| Action                 | Result                                           |
| ---------------------- | ------------------------------------------------ |
| Drag the pet           | Move it anywhere on the desktop                  |
| Click body             | Hop and say a random line                        |
| Click ear              | Wiggle that ear                                  |
| Click face             | Nod the head                                     |
| Click arm              | Play the hand-rolling action (usagi only)        |
| Double-click pet       | Play the hand-rolling action for ~2s (usagi only)|
| Right-click pet        | Open the context menu                            |
| Menu: Character        | Switch between usagi and Chiikawa (remembered)   |
| Menu: Language         | Switch 中文 / English (remembered)               |
| Menu: Follow cursor    | Toggle cursor following                          |
| Menu: Wander           | Toggle random walking                            |
| Menu: Always on top    | Toggle always-on-top                             |
| Menu: Size             | Switch small, medium, or large size              |
| Menu: Hop / Roll hands | Trigger actions manually (rolling is usagi only) |
| Menu: Quit             | Close OhMyChiikawa                               |

## Platform Notes

OhMyChiikawa currently supports macOS. Windows support is in progress.

## Roadmap

Future releases will introduce more Chiikawa characters and continue expanding animations and interactions for the current characters.

Planned for the next version:

- Add more dedicated actions and interactions for Chiikawa.
- Bring movement and interaction animations to more characters.

## FAQ

**Why does macOS block the app on first launch?**

macOS adds extra confirmation for apps downloaded outside the App Store. Right-click OhMyChiikawa and choose **Open**, or run:

```bash
xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
```

**Does the pet block desktop clicks?**

Only the pet body is interactive. Transparent areas click through to windows behind it. You can also disable “Always on top” from the context menu or drag the pet to the screen edge.

**How do I quit?**

Right-click usagi and choose the quit menu item.

## License

Project code is licensed under the MIT License.

The characters in this project, Chiikawa and Usagi, come from the Japanese animation Chiikawa. The character copyright belongs to Chiikawa. Bundled image assets are for personal desktop-pet use; make sure you have the right to use any assets you replace or redistribute.
