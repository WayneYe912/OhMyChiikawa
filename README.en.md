# OhMyChiikawa

**Language:** [简体中文](README.md) | [English](README.en.md) | [日本語](README.ja.md)

OhMyChiikawa is a lightweight desktop pet for macOS and Windows. After launch, the default character **Usagi** appears on your desktop, and you can switch to **Chiikawa** or **Hachiware** anytime from the right-click menu. All three characters can be dragged around, clicked on different body parts, follow the cursor, wander occasionally, and play idle animations such as blinking and subtle ear movement.

## Preview

| Desktop view | Interaction |
| --- | --- |
| ![Usagi desktop view](docs/images/example_01.png) | ![Usagi interaction](docs/images/example_02.png) |

## Features

- Multiple characters: **Usagi**, **Chiikawa**, and **Hachiware** are built in; switch anytime from the context menu, and your last choice is remembered.
- Three interface languages: switch between 中文 / English / 日本語 from the context menu; menu text and character speech follow the selected language, and the choice is remembered.
- Transparent, frameless, and always on top by default.
- Drag to place the pet anywhere on the desktop.
- Part-aware clicks: body hops, ears wiggle, face nods, and paws trigger a hand-rolling action for about 2 seconds (hand-rolling is Usagi-only).
- Random speech bubbles with per-character Chinese, English, and Japanese lines; Usagi's rolling action uses a fixed line.
- Idle animations: breathing, floating, blinking, and ear movement.
- Cursor following, toggled from the context menu.
- Random wandering, toggled from the context menu. Usagi plays a run animation while wandering and turns to face its direction of travel.
- Click-through transparent area around the pet.
- Small, medium, and large display sizes; characters keep a consistent on-screen size at the same setting.

## Install and Launch

### macOS

The recommended path for everyday use is the DMG installer from the Releases page.

Alternative download: [Baidu Netdisk](https://pan.baidu.com/s/1-G07TOu_xHGDuVjOOsOVew?pwd=wgd3).

1. Open the project Releases page and download the installer for your Mac:
   - Apple Silicon: `OhMyChiikawa-<version>-arm64.dmg`
   - Intel: `OhMyChiikawa-<version>-x64.dmg`
2. Open the installer and drag **OhMyChiikawa** into **Applications**.
3. After installation, launch **OhMyChiikawa** from Applications. On first launch, macOS may ask for extra confirmation. Right-click **OhMyChiikawa**, choose **Open**, then confirm **Open**. This is usually needed only once.

   If it still cannot open, run:

   ```bash
   xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
   ```

If the `chiikawa` command is enabled on your system, you can also launch from Terminal:

```bash
chiikawa
chiikawa --scale=small
chiikawa --scale=medium
chiikawa --scale=large
```

### Windows

The recommended path is the NSIS installer from the Releases page.

Alternative download: [Baidu Netdisk](https://pan.baidu.com/s/1-G07TOu_xHGDuVjOOsOVew?pwd=wgd3).

1. Open the project Releases page and download the Windows installer:
   - `OhMyChiikawa-<version>-win-x64.exe` (installer)
   - `OhMyChiikawa-<version>-portable-x64.exe` (portable, no install required)
2. Run the installer and follow the setup wizard.
3. After installation, launch **OhMyChiikawa** from the Start Menu or Desktop shortcut.

During installation, the setup wizard can add the `chiikawa` command to PATH. If enabled, open a **new** Command Prompt or PowerShell window and run:

```batch
chiikawa
chiikawa --size small
chiikawa --pet usagi
```

`chiikawa` is a lightweight launcher for `OhMyChiikawa.exe`; **Node.js is not required**.

### Run from source (macOS & Windows)

```bash
npm install # only needed for the first setup
```

```bash
npm start
```

Running from source requires Node.js 18+ and npm 9+. You can also use the source CLI directly:

```bash
# macOS / Linux
node chiikawa.js
node chiikawa.js --size small

# Windows (Command Prompt or PowerShell)
node chiikawa.js
node chiikawa.js --size small
```

The script checks local dependencies before launch. If dependencies are missing, it explains what is happening and tries to run `npm install`. If npm is unavailable or installation fails, the terminal output gives the next manual step.

## Basic Usage

| Action | Result |
| --- | --- |
| Drag the pet | Move it anywhere on the desktop |
| Click body | Hop and say a random line |
| Click ear | Wiggle that ear |
| Click face | Nod the head |
| Click arm | Play the hand-rolling action (Usagi only) |
| Double-click pet | Play the hand-rolling action for about 2 seconds (Usagi only) |
| Right-click pet | Open the context menu |
| Menu: Character | Switch between Usagi, Chiikawa, and Hachiware (remembered) |
| Menu: Language | Switch 中文 / English / 日本語 (remembered) |
| Menu: Follow cursor | Toggle cursor following |
| Menu: Wander | Toggle random walking |
| Menu: Always on top | Toggle always-on-top |
| Menu: Size | Switch small, medium, or large size |
| Menu: Hop / Roll hands | Trigger actions manually (rolling is Usagi-only) |
| Menu: Quit | Close OhMyChiikawa |

## Platform Notes

OhMyChiikawa supports macOS and Windows.

- **macOS**: DMG installer provided (arm64 / x64). Download from the Releases page.
- **Windows**: NSIS installer and portable edition provided (x64).

## Roadmap

Future releases will introduce more Chiikawa characters and continue expanding animations and interactions for the current characters.

Planned for the next version:

- Add more dedicated actions and interactions for Chiikawa and Hachiware.
- Bring movement and interaction animations to more characters.

## FAQ

**Why does macOS block the app on first launch?**

macOS adds extra confirmation for apps downloaded outside the App Store. Right-click OhMyChiikawa and choose **Open**, or run:

```bash
xattr -dr com.apple.quarantine /Applications/OhMyChiikawa.app
```

**Does the pet block desktop clicks?**

Only the pet body is interactive. Transparent areas click through to windows behind it. You can also disable **Always on top** from the context menu or drag the pet to the screen edge.

**How do I quit?**

Right-click the pet and choose the quit menu item.

## License

Project code is licensed under the MIT License.

The characters in this project, Chiikawa, Usagi, and Hachiware, come from the Japanese animation Chiikawa. The character copyright belongs to Chiikawa. Bundled image assets are for personal desktop-pet use; make sure you have the right to use any assets you replace or redistribute.
