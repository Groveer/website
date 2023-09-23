# 在WSL2中安装ArchLinux

## 1.启用WSL

用管理员打开powershell输入:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

## 2.启用虚拟平台

用管理员打开powershell输入:

```powershell
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

## 3.更新WSL2

用管理员打开powershell输入:

```powershell
wsl --set-default-version 2
```

```powershell
wsl --update
```

## 4.安装LxRunOffline

[下载地址](https://github.com/DDoSolitary/LxRunOffline/releases)

选择最新版下载，解压后将LxRunOffline.exe放入任意一个path文件夹下（比如C:/Windows/）

## 5.下载Archlinux

[下载地址](https://mirrors.tuna.tsinghua.edu.cn/archlinux/iso/latest/)

找到`archlinux-bootstrap-x86_64.tar.gz`，注意是`tar.gz`文件

## 6.安装Archlinux到WSL

命令1：

```powershell
LxRunOffline i -n <自定义名称> -f <Arch镜像位置> -d <安装系统的位置> -r root.x86_64
```

比如：

```powershell
LxRunOffline i -n Arch -f C:\Users\groveer\Downloads\archlinux-bootstrap-x86_64.tar.gz -d C:\WSL\Arch -r root.x86_64
```

命令2：

```powershell
wsl --set-version <名称> 2
```

比如：

```powershell
wsl --set-version Arch 2
```

## 7.进入WSL系统

命令：

```powershell
wsl -d <名字>
```

比如:

```powershell
wsl -d Arch
```

若是第一次安装或者只有一个WSL系统，可以直接输入`wsl`进入系统。

## 8.配置系统

在Arch中执行命令：

```bash
cd /etc/
```

```bash
explorer.exe .
```

注意后面的点，执行这条命令后会用windows的文件管理器打开/etc目录，然后找到pacman.conf，在这个文件最后加入：

```ini
[archlinuxcn]
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinuxcn/$arch
```

然后进入下一级目录`pacman.d`,编辑里面的`mirrolist`文件，将`China`的源注释去掉（选择部分即可）。

然后回到Arch，执行：

```bash
pacman -Syy
```

```bash
pacman-key --init
```

```bash
pacman-key --populate
```

```bash
pacman -S archlinuxcn-keyring
```

```bash
pacman -S neovim sudo yay
```

语言配置：

```bash
nvim /etc/locale.gen
```

将下面两个注释取消：

```txt
en_US.UTF-8 UTF-8
zh_CN.UTF-8 UTF-8
```

然后别忘了给当前的root设置密码：

```bash
passwd
```

然后新建一个管理员用户：

```bash
useradd -m -G wheel <用户名>
```

同样要改密码：

```bash
passwd <用户名>
```

将文件`/etc/sudoers`中的`%wheel ALL=(ALL) ALL`那一行前面的注释去掉：

```bash
nvim /etc/sudoers
```

查看当前用户id：

```bash
id -u <用户名>
```

按`Ctrl+D`或输入`exit`退出。

在powershell中执行：

```powershell
LxRunOffline su -n <你的arch名字> -v <账户id>
```

比如：

```powershell
LxRunOffline su -n Arch -v groveer
```

再次进入系统，输入`wsl`，开始享受吧！

> 文章来源：[https://zhuanlan.zhihu.com/p/266585727](https://zhuanlan.zhihu.com/p/266585727)
