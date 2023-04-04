# Windows 开发环境搭建

本文使用 Qt6 + MSVC 2019 64-bit 环境，也是撰写本文时最新的开发环境，对于想编译 32 位程序的同学，可以选择安装 Qt5。

## 安装 VC++ 开发环境

1. 下载[Visual Studio 2022 /生成工具](https://visualstudio.microsoft.com/zh-hans/downloads/)
2. 安装方式有两种，一种是带 IDE，一种是不带 IDE：
   1. 如果是习惯使用 Visual Studio 进行开发，可直接下载`Visual Studio 2022`
   2. 如果是使用其他 IDE 或编辑器，可将页面拉到下方，展开`用于 Visual Studio 的工具`，选择最后一个`Visual Studio 2022 生成工具`进行下载。
3. 双击下载好的 exe 文件进行安装。
4. 在弹出的界面，左侧勾选`使用 C++ 的桌面开发`，右侧勾选：
   - MSVCv143- VS 2022 C++ x64/x86 生成工具
   - 用于 Windows 的 C++ CMake 工具
   - C++ AddressSanitizer
   - 适用于 Windows 的 C++ Clang 工具
   - Windows 10/11 SDK (Win10 就选 10，Win11 就选 11，任选一个就行，不要多选)

## 安装 Qt

1. 进入 Qt 在线[下载](https://download.qt.io/archive/online_installers/)页面
2. 选择最高的版本，进入目录
3. 选择`qt-unified-windows-x64-4.5.2-online.exe`进行下载（版本可能会更新，撰写本文时，官网上最新的是 4.5.2 版本，若有更新，选择最新的版本即可）
4. 双击 exe 文件，登录 Qt 账户，等待元信息检索完成
5. 勾选展开 Qt 对应版本，勾选`MSVC 2019 64-bit`
6. 其他默认勾选的选项可取消勾选，若习惯使用 qtcreator，可以将其勾选上
7. 最后点击右下角的安装，等待安装完成。
8. 若安装一直报错，可使用[fiddler](https://www.telerik.com/fiddler)工具替换国内源，再进行安装，参考这篇[文章](https://zhuanlan.zhihu.com/p/561274793)
   ```powershell
   urlreplace download.qt.io mirrors.tuna.tsinghua.edu.cn/qt
   ```

## 环境变量

1. 关于如何在 Windows 中设置环境变量，这里不在过多讲解，可自行搜索教程。
2. 在环境变量中，`Path`变量需添加一行：`C:\Qt\6.5.0\msvc2019_64\bin`，注意需改为自己的安装路径。
3. 当 VC++ 开发环境安装完成后，开始菜单会有`Developer PowerShell for VS 2022`终端，后续的所有命令在其中执行，若使用 Visual Studio 或 qtcreator 可忽略`3`和`4`条。
4. 推荐使用 Windows terminal + PowerShell7 来执行命令，在 Windows terminal 设置中：
   1. 启动设置选择`Developer PowerShell for VS 2022`
   2. `Developer PowerShell for VS 2022`配置文件：
      1. 命令行中`powershell.exe`改为`pwsh.exe`
      2. 启动目录可改为自己的项目目录，如：`D:\Project`
5. 后续直接打开 Windows terminal 即可进入开发环境，可忽略第`3`条，后续所有命令在终端中执行即可。
6. 若想使用与本人一致的 IDE，可参考[这里](../blog/windows-neovim-c)，（注意需要一定的使用门槛，若是初学者，建议老老实实的使用 Visual Studio 或 qtcreator）
