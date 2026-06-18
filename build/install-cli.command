#!/bin/bash
#
# 安装 MyBuddy 命令行工具
# 把 `mybuddy` 命令链接到已安装的 MyBuddy.app。装好后可在终端使用:
#   mybuddy                   启动桌面兔子
#   mybuddy --pet=usagi-roll  无缝转手版
#   mybuddy --scale=large     大尺寸
#
set -e
APP="/Applications/MyBuddy.app/Contents/MacOS/MyBuddy"
BINDIR="/usr/local/bin"
DEST="$BINDIR/mybuddy"

echo "== 安装 MyBuddy 命令行工具 =="
echo ""

if [ ! -x "$APP" ]; then
  echo "✗ 没找到 MyBuddy.app。"
  echo "  请先把 MyBuddy 拖到「应用程序 / Applications」,然后再双击运行本脚本。"
  echo ""
  read -n 1 -s -r -p "按任意键关闭…"; echo; exit 1
fi

make_wrapper() {   # $1 = 目标路径
  cat > "$1" <<EOF
#!/bin/sh
# MyBuddy launcher — 后台启动已安装的 App 并透传参数 (--pet / --scale)
nohup "$APP" "\$@" >/dev/null 2>&1 &
EOF
  chmod +x "$1"
}

if mkdir -p "$BINDIR" 2>/dev/null && [ -w "$BINDIR" ]; then
  make_wrapper "$DEST"
else
  echo "写入 $BINDIR 需要管理员权限,请输入登录密码:"
  sudo mkdir -p "$BINDIR"
  TMP="$(mktemp)"; make_wrapper "$TMP"
  sudo mv "$TMP" "$DEST"; sudo chmod +x "$DEST"
fi

echo ""
echo "✅ 完成!已安装命令: mybuddy  ($DEST)"
echo ""
echo "用法:"
echo "  mybuddy                              启动桌面兔子"
echo "  mybuddy --pet=usagi-roll             无缝转手版"
echo "  mybuddy --scale=small|medium|large   切换尺寸"
echo ""
read -n 1 -s -r -p "按任意键关闭…"; echo
