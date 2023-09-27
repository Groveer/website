---
title: Latex 环境配置
date: 2023-01-17 18:52:54
tags:
  - Tool
categories:
  - Tool
cover: https://pic.3gbizhi.com/2020/0915/20200915093843136.jpg
feature: false
---

# {{ $frontmatter.title }}

## 安装基础软件

1. 参考texlive[官方文档](https://tug.org/texlive/quickinstall.html)进行安装：

```bash
cd /tmp # working directory of your choice
wget https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz # or curl instead of wget
zcat < install-tl-unx.tar.gz | tar xf -
cd install-tl-*
perl ./install-tl --scheme=basic --no-interaction -repository https://mirrors.tuna.tsinghua.edu.cn/CTAN/systems/texlive/tlnet # as root
```

这里只是安装了一个基本的latex，想要正常使用还需要进行配置和安装其他的包。

可以在环境变量中添加以下内容：

```bash
if [ -d "/usr/local/texlive/" ]; then
	export MANPATH=$MANPATH:/usr/local/texlive/2023/texmf-dist/doc/man
	export INFOPATH=$INFOPATH:/usr/local/texlive/2023/texmf-dist/doc/info
	export PATH=$PATH:/usr/local/texlive/2023/bin/x86_64-linux
fi
```

使用国内源速度更快：

```bash
sudo tlmgr option repository https://mirrors.tuna.tsinghua.edu.cn/CTAN/systems/texlive/tlnet
```

刷新环境变量皆可执行`lualatex`和`xelatex`命令了，在编译`tex`文件过程中若遇到`xxx`文件不存在时，可以先用`info`命令查询相关的包，然后用`install`命令安装该包。

```bash
tlmgr info ctexart.cls
```

找到这个文件在`ctex`包中，然后直接安装：

```
sudo tlmgr install ctex
```

2. 安装`python`的包`pygments`：

可以用`pip`安装：

```bash
pip install pygments
```

也可以使用系统中的包：

ArchLinux:

```bash
yay -S python-pygments
```

Debian/Ubuntu:

```bash
sudo apt install python3-pygments
```

## 安装模板

此模板为私有模板，无法访问不必纠结，可略过此节

:::details ArchLinux

```bash
git clone https://gitlabwh.uniontech.com/rd/latex/latex.git
cd latex
mkdir -p ~/texmf/tex/latex/
cp -r uniontech ~/texmf/tex/latex/
```

:::

:::details Deepin/Ubuntu

```bash
git clone https://gitlabwh.uniontech.com/rd/latex/latex.git
cd latex
sudo make install
```

:::

## 打中文支持补丁

这里是对plantuml打补丁，不需要plantuml支持可以略过此步：

```patch
--- /usr/share/texmf-dist/tex/lualatex/plantuml/plantuml.lua    2022-04-17 16:12:47.000000000 +0800
+++ /tmp/plantuml.lua   2022-10-25 11:19:18.203071671 +0800
@@ -21,8 +21,9 @@ function convertPlantUmlToTikz(jobname,
     return
   end

+  local lang = os.getenv("LANG")
   texio.write("Executing PlantUML... ")
-  local cmd = "java -Djava.awt.headless=true -jar " .. plantUmlJar .. " -charset UTF-8 -t"
+  local cmd = "LC_CTYPE=" .. lang .. " java -Djava.awt.headless=true -jar " .. plantUmlJar .. " -charset UTF-8 -t"
   if (mode == "latex") then
     cmd = cmd .. "latex:nopreamble"
   else
```

```bash
sudo patch --verbose /usr/local/texlive/2023/texmf-dist/tex/lualatex/plantuml/plantuml.lua < patch
```

## 构建

:::details ArchLinux

```bash
PLANTUML_JAR=/usr/share/java/plantuml/plantuml.jar \
lualatex "-shell-escape" \
    -synctex=1 \
    -interaction=nonstopmode \
    -file-line-error \
    {FILE_NEME}
```

:::

:::details Deepin/Ubuntu

```bash
PLANTUML_JAR=/usr/share/plantuml/plantuml.jar \
lualatex "-shell-escape" \
    -synctex=1 \
    -interaction=nonstopmode \
    -file-line-error \
    {FILE_NEME}
```

:::

> 需要注意的是，Deepin 系统下的 plantuml 版本可能比较老旧（/usr/share/plantuml/plantuml.jar），可在其他系统上拷贝较新的版本或使用本文章附件。

> 若需要`lmroman`字体，请在附件中自取。

### 附件

- [plantuml 包](./rc/plantuml-1.2022.6.jar)
- [lmroman 字体](./rc/lmroman.tar.gz)
