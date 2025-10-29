# 在 WSL2 中安装 ArchLinux

## 1.启用 WSL

用管理员打开 powershell 输入:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

## 2.启用虚拟平台

用管理员打开 powershell 输入:

```powershell
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

## 3.更新 WSL2

用管理员打开 powershell 输入:

```powershell
wsl --set-default-version 2
```

```powershell
wsl --update
```

> [!TIP]
> 如果更新报错，可以重启下机器在尝试！有些时候在开启了系统功能后需要重启更新下系统才能正常使用。

## 4.安装Archlinux

1. 在线安装一般都很慢，所以可以选择使用国内镜像源安装，可选择[阿里源](https://mirrors.aliyun.com/archlinux/wsl/latest)下载`archlinux.wsl`文件。
2. 在Windows上创建一个目录，用于安装，比如这里使用：`C:\WSL`。
3. 下载完成后，可以用下面的命令安装：

```powershell
wsl --import Arch C:\WSL C:\User\Administrator\Downloads\archlinux.wsl
```

上面的`Arch`表示发行版名称，`C:\WSL`是安装路径，最后一个参数就是 wsl 文件了。

4. 安装完成后直接输入`wsl`命令进入系统，此时是以`root`用户身份登录，还需要进行适当的配置才能正常使用。

> [!TIP]
> 如果有多个系统，可以用`wsl -d <名称>`来启动不同的系统。

## 5.配置系统

1. 先安装一些基础所需的命令：

```bash
pacman -S nano sudo
```

2. 改为国内源，可用`nano`打开文件，修改完文件后，按`Ctrl+S`保存，`Ctrl+x`退出，后面改文件都可以这样处理：

```ini
# filepath: /etc/pacman.d/mirrorlist

Server = https://mirrors.ustc.edu.cn/archlinux/$repo/os/$arch
Server = https://mirrors.xjtu.edu.cn/archlinux/$repo/os/$arch
Server = https://mirrors.jlu.edu.cn/archlinux/$repo/os/$arch
```

3. 新增`archlinuxcn`源，并且配置`pacman`：

```ini
# filepath: /etc/pacman.d/mirrorlistcn

Server = https://mirrors.ustc.edu.cn/archlinuxcn/$arch
```

修改配置：

```ini
# filepath: /etc/pacman.conf

UseSyslog
Color
#NoProgressBar
```

新增配置：

```ini
# filepath: /etc/pacman.conf

[archlinuxcn]
Include = /etc/pacman.d/mirrorlistcn
```

添加`aur`功能：

```bash
pacman -Syy
pacman-key --init
pacman-key --populate
pacman -S archlinuxcn-keyring
pacman -S yay
```

4. 语言配置：

```bash
nano /etc/locale.gen
```

将下面两个注释取消：

```text
en_US.UTF-8 UTF-8
zh_CN.UTF-8 UTF-8
```

然后执行命令：

```bash
locale-gen
```

> [!IMPORTANT]
> 这里有一个坑，如果只运行一些 cli 或者 tui 的程序，可以不装字体，但是一定要设置环境变量：
> ```bash
> export LANG=zh_CN.UTF-8
> export LC_ALL=zh_CN.UTF-8
> export LANGUAGE=zh_CN.UTF-8
> ```
> 如何需要运行 gui 程序，还需要安装中文字体：
> ```bash
> pacman -S noto-fonts-cjk
> ```

5. 账户设置：

新建一个管理员用户：

```bash
useradd -m -G wheel <用户名>
```

修改密码：

```bash
passwd <用户名>
```

将文件`/etc/sudoers`中的`%wheel ALL=(ALL) ALL`那一行前面的注释去掉：

```bash
nano /etc/sudoers
```

设置默认登录账户，添加以下内容:

```
# filepath: /etc/wsl.conf

[user]
default=<用户名>
```

6. wsl 设置（可选）：

```ini
[boot]
systemd=true
[automount]
enabled=false
[user]
default=guo
[interop]
enabled=false
appendWindowsPath=false
```

逐行解释：
- 启用 systemd 服务
- 取消自动挂载 c 盘 d 盘等
- 切换默认用户为 guo
- 不支持在 wsl 直接启动 Windows 进程
- 不将 Windows 路径变量加到 $PATH 中

完整的配置，可以参考微软[官方文档](https://learn.microsoft.com/zh-cn/windows/wsl/wsl-config)。

## 扩展配置

刚装好的 archlinux 可能没有 GPU 加速，需要添加两个环境变量：

```bash
# filepath: /etc/profile.d/gpu.sh

export GALLIUM_DRIVER=d3d12
export LIBVA_DRIVER_NAME=d3d12
```

默认使用核显，按官方所说，核显的性能损耗更低，若想使用独显，可添加环境变量：

```bash
# filepath: /etc/profile.d/gpu.sh

export MESA_D3D12_DEFAULT_ADAPTER_NAME=NVIDIA
```

参考[Archlinux 官方文档](https://wiki.archlinux.org/title/Install_Arch_Linux_on_WSL)。
