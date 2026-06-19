# OhMyChiikawa

<a id="中文"></a>

**语言 / Language:** [中文](#中文) | [English](#english)

OhMyChiikawa 是一个轻量的桌面宠物。启动后，**乌萨奇** 会出现在桌面上：可以拖动、点击互动、跟随鼠标、偶尔自己走动，也会在待机时眨眼和轻微摆动耳朵。

## 功能

- 透明、无边框、默认置顶显示。
- 拖动摆放：按住乌萨奇即可拖到屏幕任意位置。
- 分部位点击互动：点身体会跳一下，点耳朵会单只耳朵抖动，点脸会点头，点手会转手约 2 秒。
- 随机对话：乌萨奇会不定时冒出一句话，点击也会触发；转手时固定喊“噜噜噜噜噜！”。
- 待机动画：呼吸、轻微上下浮动、眨眼、耳朵摆动。
- 鼠标跟随：乌萨奇会朝鼠标方向看，可在右键菜单中开关。
- 自动走动：乌萨奇会不定时在桌面上散步，可在右键菜单中开关。
- 透明区域穿透：乌萨奇周围的透明区域不会挡住后面的窗口。
- 小、中、大三种显示尺寸。

## 下载与安装

当前提供 macOS 安装包。

1. 打开项目 Releases 页面，下载适合你电脑的安装包：
   - Apple 芯片：`OhMyChiikawa-<版本>-arm64.dmg`
   - Intel 芯片：`OhMyChiikawa-<版本>-x64.dmg`

2. 双击打开安装包，把 **OhMyChiikawa** 拖到 **Applications / 应用程序**。

3. 首次打开时，macOS 可能会提示无法确认开发者。请在「应用程序」里右键点击 **OhMyChiikawa**，选择「打开」，再确认「打开」。这一步通常只需要做一次。

   如果仍打不开，可以在终端执行：

   ```bash
   xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
   ```

安装包里还包含两个辅助文件：

- `READ-ME-FIRST.txt`：安装和首次打开说明。
- `install-cli.command`：可选的命令行启动器安装脚本。只有当你希望在终端使用 `chiikawa` 命令启动应用时，才需要双击它。

## 启动方式

安装后可以直接双击 **OhMyChiikawa** 启动。

如果你希望在终端里启动，双击安装包里的 `install-cli.command`。之后可以使用：

```bash
chiikawa
chiikawa --scale=small
chiikawa --scale=medium
chiikawa --scale=large
```

## 基本用法

| 操作 | 效果 |
| --- | --- |
| 拖动乌萨奇 | 移动到桌面任意位置 |
| 单击身体 | 跳一下，并随机说一句话 |
| 单击耳朵 | 单只耳朵抖动 |
| 单击脸 | 头部点头 |
| 单击手臂 | 播放转手动作 |
| 双击乌萨奇 | 播放转手动作约 2 秒 |
| 右键乌萨奇 | 打开功能菜单 |
| 菜单：跟随鼠标 | 开启或关闭鼠标跟随 |
| 菜单：四处走动 | 开启或关闭自动散步 |
| 菜单：总在最前 | 开启或关闭置顶显示 |
| 菜单：大小 | 切换小、中、大尺寸 |
| 菜单：跳一下 / 转手 | 手动触发动作 |
| 菜单：退出 | 关闭 OhMyChiikawa |

## 平台说明

OhMyChiikawa 目前支持 macOS，Windows 版本正在准备中。

## 未来计划

后续版本会陆续加入更多 Buddy 形象，并持续补充现有形象的动画表现和互动内容。

下一版本计划很快发布，预计包含：

- 新增 Buddy 形象「吉伊（Chiikawa）」，并加入配套基础动作。
- 为乌萨奇在屏幕上移动时加入跑步动画，让移动表现更自然。

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

目前项目内的第一个 OhMyChiikawa 形象「乌萨奇」来自日本动画《Chiikawa》，形象版权归属 Chiikawa。内置图片仅用于个人桌面宠物使用；替换或分发图片时，请确保你拥有对应使用权。

---

<a id="english"></a>

**Language / 语言:** [中文](#中文) | [English](#english)

# OhMyChiikawa

OhMyChiikawa is a lightweight desktop pet. After launch, **usagi** appears on your desktop. You can drag it around, click different body parts, let it follow the cursor, watch it wander occasionally, and see idle animations such as blinking and subtle ear movement.

## Features

- Transparent, frameless, and always on top by default.
- Drag to place the pet anywhere on the desktop.
- Part-aware clicks: body hops, ears wiggle, face nods, and paws trigger a hand-rolling action for about 2 seconds.
- Random speech bubbles; the rolling action always says “噜噜噜噜噜！”.
- Idle animations: breathing, floating, blinking, and ear movement.
- Cursor following, toggled from the context menu.
- Random wandering, toggled from the context menu.
- Click-through transparent area around the pet.
- Small, medium, and large display sizes.

## Download and Install

macOS installers are currently provided.

1. Open the project Releases page and download the installer for your Mac:
   - Apple Silicon: `OhMyChiikawa-<version>-arm64.dmg`
   - Intel: `OhMyChiikawa-<version>-x64.dmg`

2. Open the installer and drag **OhMyChiikawa** into **Applications**.

3. On first launch, macOS may ask for extra confirmation. In Applications, right-click **OhMyChiikawa**, choose **Open**, then confirm **Open**. This is usually needed only once.

   If it still cannot open, run:

   ```bash
   xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
   ```

The installer also includes two helper files:

- `READ-ME-FIRST.txt`: installation and first-launch instructions.
- `install-cli.command`: an optional command-line launcher installer. Double-click it only if you want to start OhMyChiikawa from Terminal with the `chiikawa` command.

## Launch

After installation, double-click **OhMyChiikawa** to launch it.

If you prefer launching from Terminal, double-click `install-cli.command` in the installer. Then you can use:

```bash
chiikawa
chiikawa --scale=small
chiikawa --scale=medium
chiikawa --scale=large
```

## Basic Usage

| Action | Result |
| --- | --- |
| Drag the pet | Move it anywhere on the desktop |
| Click body | Hop and say a random line |
| Click ear | Wiggle that ear |
| Click face | Nod the head |
| Click arm | Play the hand-rolling action |
| Double-click pet | Play the hand-rolling action for about 2 seconds |
| Right-click pet | Open the context menu |
| Menu: Follow cursor | Toggle cursor following |
| Menu: Wander | Toggle random walking |
| Menu: Always on top | Toggle always-on-top |
| Menu: Size | Switch small, medium, or large size |
| Menu: Hop / Roll hands | Trigger actions manually |
| Menu: Quit | Close OhMyChiikawa |

## Platform Notes

OhMyChiikawa currently supports macOS. Windows support is in progress.

## Roadmap

Future releases will introduce more Buddy characters and continue expanding animations and interactions for the current characters.

Planned for the next version:

- Add a new Buddy character, Chiikawa, with a basic action set.
- Add a running animation for usagi so movement across the screen feels more natural.

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

The first OhMyChiikawa character in this project, usagi, comes from the Japanese animation Chiikawa. The character copyright belongs to Chiikawa. Bundled image assets are for personal desktop-pet use; make sure you have the right to use any assets you replace or redistribute.
