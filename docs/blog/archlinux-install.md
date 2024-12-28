# ArchLinux 系统安装

任何Linux系统的安装，都可以参考以下步骤：

1. 下载镜像
2. 将镜像刻录到U盘
3. BIOS设置U盘启动
4. 对磁盘进行分区以及格式化
5. 设置分区挂载点
6. 安装系统（网络安装或本地文件对拷）
7. 系统基本设置，完成安装

## 下载 Arch Linux 镜像

[下载地址](https://www.archlinux.org/download/)

向下滚动到 China 下载，网易的节点就很快。

## 验证镜像完整性

:::details Linux/Unix

```bash
md5sum archlinux-x86_64.iso
```

:::

:::details MacOS

```bash
md5 archlinux-x86_64.iso
```

:::

:::details Windows

```bash
certutil -hashfile .\archlinux-x86_64.isop MD5
```

:::

将输出和下载页面提供的 md5 值对比一下，看看是否一致，不一致则不要继续安装，换个节点重新下载，直到一致为止。

## 将镜像刻录到 U 盘

:::details Linux/Unix

1. 确保插上电脑的 U 盘没有被挂载，某些桌面环境会自动挂载 U 盘。

   ```bash
   lsblk
   ```

   可能会显示以下内容：

   ```bash
   NAME     MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
   sda      8:0    0 931.5G  0 disk
   └─sda1    8:1    0 931.5G  0 part /home
   sdb      8:16   1  29.9G  0 disk
   └─sdb1    8:17   1  29.9G  0 part /run/media/guo/Arch
   nvme0n1    259:0    0 238.5G  0 disk
   ├─nvme0n1p1 259:1    0   512M  0 part /boot
   └─nvme0n1p2 259:2    0   238G  0 part /
   ```

   其中 sdb 就是 U 盘，而 sdb1 就是其第一个分区，其他同理；下面的 nvme0n1 只是协议不同，将其一样看成一个硬盘就行。
   从上面打印出来的内容可以看出 sdb1 已经被挂载到“/run/media/guo/Arch”，可以使用 umount 命令将其卸载：

   ```bash
   sudo umount /dev/sdb1
   ```

   > sdb 已挂载的分区要全部卸载。

2. 使用 dd 命令将镜像刻录到 U 盘中：

   ```bash
   sudo dd bs=4M if=path/to/archlinux-x86_64.iso of=/dev/sdb conv=fsync oflag=direct status=progress
   ```

   > if 参数是 iso 镜像的路径，of 参数是 U 盘的设备路径，可能会是 /dev/sdc 或其他路径，这里一定要指定正确的路径，错误的路径可能会破坏当前系统！

:::

:::details MacOS

1. 获取管理员权限

   ```bash
   sudo su - root
   ```

   输入开机密码

2. 查询 iso 镜像路径

   ```bash
   pwd
   ```

   我的在“/Users/guo/Desktop/archlinux-x86_64.iso”。

3. 查看 U 盘挂载点

   ```bash
   df -h
   ```

   我的是“/dev/disk2”。

4. 卸载 U 盘

   ```bash
   diskutil unmountDisk /dev/disk2
   ```

5. 刻录镜像

   ```bash
   dd if=/Users/guo/Desktop/archlinux-x86_64.iso of=/dev/disk2 bs=4m
   ```

   > 步骤大致与 Linux 相同，只是部分命令不同而已。

:::

:::details Windows

下载软件[USBWriter](https://sourceforge.net/projects/usbwriter/)

source file 选择 iso 镜像，Target device 选择 U 盘，点击 Write 进行刻录。

> 若 Windows 系统无法识别 U 盘，可能需要格式化。

:::

:::tips 其他方式
也可以使用其他方式，比如[Ventoy](https://www.ventoy.net/cn/)
:::

## 从 U 盘启动 Arch live 环境

在 BIOS 中设置启动磁盘为刚刚写入镜像的 U 盘，一般来说开机按`F12`即可选择启动盘，如果不行，则需`F2`或`DEL`进入 BIOS 修改 U 盘为优先启动，注意装完系统后将 U 盘启动改回后面去。
进入 U 盘的启动引导程序后，选择第一项即可。

### 连接网络

- 查看连接：

  ```bash
  ip link
  ```

- 连接
  对于有线网络，安装镜像启动的时候，会默认启动 dhcpcd，如果没有启动，可以手动启动：

  ```bash
  dhcpcd
  ```

  对于无线网络，官方推荐使用[iwctl](<https://wiki.archlinux.org/title/Iwd_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#iwctl>)

### 磁盘分区

磁盘分区可以参考本人的专题[Linux 磁盘管理](/linux-disk-manager/index.md)。

### 配置 pacman mirror

一般来说，不需要进行修改，如果发现下载速度很慢，可以修改其中顺序或加入[中国节点](<https://wiki.archlinux.org/title/Mirrors_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%B8%AD%E5%9B%BD>)的地址

```bash
vim /etc/pacman.d/mirrorlist
```

或直接使用`reflector`对源速度进行排序：

```bash
reflector --country China --protocol https --latest 5 --save /etc/pacman.d/mirrorlist
```

### 安装 Arch 和 Package Group

虚拟机用户不需要安装`linux-firmware`

```bash
pacstrap /mnt base base-devel linux linux-firmware neovim
```

### 生成 fstab 文件

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

### 切换至安装好的 Arch

```bash
arch-chroot /mnt
```

### 安装网络工具

1. 若需要进行网络认证（不是密码认证，一般指公司内网认证），推荐使用`NetworkManager`：

```bash
pacman -S networkmanager
```

启用服务：

```bash
systemctl enable NetworkManager
```

2. 若是个人电脑，推荐使用`systemd-networkd`及`systemd-resolved`，不需要额外安装，基础包中附带：

启用服务：

```bash
systemctl enable systemd-networkd systemd-resolved
```

3. 若是个人笔记本，在`2`的基础上安装`iwd`：

```bash
pacman -S iwd
```

启用服务：

```bash
systemctl enable iwd
```

:::warning 注意

1. 使用`1`可以直接用`nmcli`命令进行网络设置
2. 使用`2`和`3`需要对`systemd`进行配置：

    1. 一般是在`/etc/systemd/network/`目录中添加`.network`文件，这里给两个示例，具体文档参考[Arch Wiki](https://wiki.archlinux.org/title/Systemd-networkd):
    ```ini
    [Match]
    Name=enp1s0

    [Network]
    DHCP=yes
    ```

    ```ini
    [Match]
    Name=wlp2s0

    [Network]
    DHCP=yes
    IgnoreCarrierLoss=3s
    ```

:::

### 本地化

- 修改`/etc/locale.gen`，取消注释下面这两行配置：

  ```bash
  en_US.UTF-8 UTF-8
  zh_CN.UTF-8 UTF-8
  ```

- 生成 locale 信息：

  ```bash
  locale-gen
  ```

- 创建`/etc/locale.conf`并写入：

  ```bash
  LANG=en_US.UTF-8
  ```

### 网络配置

- 修改 hostname，创建`/etc/hostname`并写入（可替换为其他名称）：

  ```bash
  Arch
  ```

- 配置 hosts，编辑`/etc/hosts`

  ```bash
  127.0.0.1 localhost
  ::1    localhost
  127.0.1.1 Arch.localdomain
  ```

### 安装 Microcode

虚拟机用户略过此步。

- AMD CPU：

```bash
pacman -S amd-ucode
```

- Intel CPU：

```bash
pacman -S intel-ucode
```

### 安装引导程序

正确的开机顺序是：

1. BIOS 先启动，然后搜索可用的引导
2. 引导程序负责启动系统内核

所以启动系统并不是 BIOS 直接启动的，而是有各中间程序来负责，而不同的引导程序设置不同，但最基本的设置就是设置内核参数，其他的设置都是无关紧要的。

这里有几个引导程序可供选择：

1. [GRUB](https://wiki.archlinux.org/title/GRUB)：使用人数最多，丰富的生态（主题）
2. [systemd-boot](https://wiki.archlinux.org/title/systemd-boot): 逻辑简单，没有花里胡哨的内容
3. [UKI(unified kernel image)](https://wiki.archlinux.org/title/Unified_kernel_image): 启动速度最快，将内核镜像直接打到 efi 文件里面

这里以 GRUB 为例，其他方式参考上方的官方 Wiki

MBR 引导：

```bash
pacman -S grub
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
```

UEFI 引导：

```bash
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=grub
grub-mkconfig -o /boot/grub/grub.cfg
```

### 修改 root 密码

```bash
passwd
```

### 新建用户

```bash
useradd -m -g wheel <username>
```

修改sudoers，将下面这一行取消注释：

```bash
%wheel ALL=(ALL:ALL) ALL
```

修改密码：

```bash
passwd <username>
```

## 重新启动

```bash
exit    # 退出 chroot 环境，或按 Ctrl+D
reboot
```

### 重启后的设置

使用 root 账户登录后：

- 开启时间自动同步并修改时区

  ```bash
  timedatectl set-ntp true
  timedatectl set-timezone Asia/Shanghai
  ```
