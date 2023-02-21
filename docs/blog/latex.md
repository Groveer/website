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

:::details ArchLinux

```bash
yay -S plantuml inkscape python-pygments texlive-core texlive-bibtexextra texlive-latexextra texlive-langchinese texlive-langjapanese
```

可能需要一些字体：

```bash
yay -S noto-fonts-cjk
```

:::

:::details Deepin/Ubuntu

```bash
sudo apt install plantuml inkscape python3-pygments make texlive-latex-base texlive-lang-chinese texlive-luatex texlive-latex-recommended texlive-latex-extra
```

:::

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

:::details ArchLinux

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
sudo  patch --verbose /usr/share/texmf-dist/tex/lualatex/plantuml/plantuml.lua < patch
```

:::

:::details Deepin/Ubuntu

```pacth
--- /usr/share/texlive/texmf-dist/tex/lualatex/plantuml/plantuml.lua    2018-03-09 06:56:58.000000000 +0800
+++ /tmp/plantuml.lua   2022-08-10 15:19:58.000000000 +0800
@@ -21,8 +21,10 @@
     return
   end

+  local lang = os.getenv("LANG")
+
   texio.write("Executing PlantUML... ")
-  local cmd = "java -jar " .. plantUmlJar .. " -t"
+  local cmd = "LC_CTYPE=" .. lang .. " java -jar " .. plantUmlJar .. " -t"
   if (mode == "latex") then
     cmd = cmd .. "latex:nopreamble"
   else
```

```bash
sudo patch --verbose /usr/share/texlive/texmf-dist/tex/lualatex/plantuml/plantuml.lua < patch
```

:::

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

### 附件

* [plantuml 包](/rc/plantuml-1.2022.6.jar)
