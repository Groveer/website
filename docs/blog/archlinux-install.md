---
title: ArchLinux 系统安装，保姆级教程
date: 2022-07-27 12:06:03
tags:
  - Linux
categories:
  - ArchLinux
cover: https://pic.3gbizhi.com/2020/0925/20200925122821237.jpg
feature: true
---
# {{ $frontmatter.title }}

ArchLinux 安装不是最难的，但也不是傻瓜式难度安装（有手就行），安装 ArchLinux 不仅需要动动手指，还需要有一台电脑，有一个 U 盘，还必须有可以访问互联网的网络。
ArchLinux 的安装并不是很难，只要了解了 Linux 启动流程，就可以理解它的大部分安装步骤。
首先需要确认主板系统是 UEFI，这里使用 GPT 分区格式，关于究竟该使用 MBR 还是 GPT 请参考[这里](<https://wiki.archlinux.org/title/Partitioning_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E9%80%89%E6%8B%A9_GPT_%E8%BF%98%E6%98%AF_MBR>)。

## 下载 Arch Linux 镜像

[下载地址](https://www.archlinux.org/download/)

向下滚动到 China 下载，网易的节点就很快。

## 验证镜像完整性

:::details Linux/Unix

```shell
md5sum archlinux-x86_64.iso
```

:::

:::details MacOS

```shell
md5 archlinux-x86_64.iso
```

:::

:::details Windows

```shell
certutil -hashfile .\archlinux-x86_64.isop MD5
```

:::

将输出和下载页面提供的 md5 值对比一下，看看是否一致，不一致则不要继续安装，换个节点重新下载，直到一致为止。

## 将镜像写入 U 盘

:::details Linux/Unix

1. 确保插上电脑的 U 盘没有被挂载，某些桌面环境会自动挂载 U 盘。

   ```shell
   lsblk
   ```

   可能会显示以下内容：

   ```shell
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

   ```shell
   sudo umount /dev/sdb1
   ```

   > sdb 已挂载的分区要全部卸载。

2. 使用 dd 命令将镜像刻录到 U 盘中：

   ```shell
   sudo dd bs=4M if=path/to/archlinux-x86_64.iso of=/dev/sdb conv=fsync oflag=direct status=progress
   ```

   > if 参数是 iso 镜像的路径，of 参数是 U 盘的设备路径，可能会是 /dev/sdc 或其他路径，这里一定要指定正确的路径，错误的路径可能会破坏当前系统！

:::

:::details MacOS

1. 获取管理员权限

   ```shell
   sudo su - root
   ```

   输入开机密码

2. 查询 iso 镜像路径

   ```shell
   pwd
   ```

   我的在“/Users/guo/Desktop/archlinux-x86_64.iso”。

3. 查看 U 盘挂载点

   ```shell
   df -h
   ```

   我的是“/dev/disk2”。

4. 卸载 U 盘

   ```shell
   diskutil unmountDisk /dev/disk2
   ```

5. 刻录镜像

   ```shell
   dd if=/Users/guo/Desktop/archlinux-x86_64.iso of=/dev/disk2 bs=4m
   ```

   > 步骤大致与 Linux 相同，只是部分命令不同而已。

:::

:::details Windows

下载软件[USBWriter](https://sourceforge.net/projects/usbwriter/)

source file 选择 iso 镜像，Target device 选择 U 盘，点击 Write 进行刻录。

> 若 Windows 系统无法识别 U 盘，可能需要格式化。

:::

## 从 U 盘启动 Arch live 环境

在 BIOS 中设置启动磁盘为刚刚写入镜像的 U 盘，一般来说开机按`F12`即可选择启动盘，如果不行，则需`F2`或`DEL`进入 BIOS 修改 U 盘为优先启动，注意装完系统后将 U 盘启动改回后面去。
进入 U 盘的启动引导程序后，选择第一项即可。

### 连接网络

- 查看连接：

  ```shell
  ip link
  ```

- 连接
  对于有线网络，安装镜像启动的时候，会默认启动 dhcpcd，如果没有启动，可以手动启动：

  ```shell
  dhcpcd
  ```

  对于无线网络，官方推荐使用[iwctl](<https://wiki.archlinux.org/title/Iwd_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#iwctl>)

### 磁盘分区

- 查看磁盘设备

  ```shell
  lsblk -f
  ```

- 新建分区表：
  由于我的本子有两块硬盘（sda、sdb），一块固态，一块机械，所以我将固态盘作为系统分区，机械盘作为数据分区，即 root、boot、swap 分区在固态盘上，home 分区在机械盘上。

  ```shell
  fdisk /dev/sda
  ```

  1. 输入`g`，新建 GPT 分区表
  2. 输入`w`，保存修改，这个操作会抹掉磁盘所有数据，慎重执行！
  3. 对`/dev/sdb`做同样处理。

- 分区创建
  1 扇区 = 512 字节

  ```shell
  fdisk /dev/sda
  ```

  1. 新建 EFI System 分区（非 UEFI 引导可以省略此步）
     1. 输入`n`
     2. 选择分区区号，直接`Enter`，使用默认值，fdisk 会自动递增分区号
     3. 分区开始扇区号，直接`Enter`，使用默认值
     4. 分区结束扇区号，输入`+512M`（推荐大小）
     5. 输入`t`修改刚刚创建的分区类型
     6. 选择分区号，直接`Enter`， 使用默认值，fdisk 会自动选择刚刚新建的分区
     7. 输入`1`，使用 EFI System 类型
  2. 新建 Linux root (x86-64) 分区
     1. 输入`n`
     2. 选择分区区号，直接`Enter`，使用默认值，fdisk 会自动递增分区号
     3. 分区开始扇区号，直接`Enter`，使用默认值
     4. 分区结束扇区号，这里要考虑预留给 swap 分区空间，计算公式：root 分区结束扇区号 = 磁盘结束扇区号 - 分配给 swap 分区的空间 (GB) _1024_ 1024 \* 1024 / 512，输入后`Enter`
     5. 输入`t`修改刚刚创建的分区类型
     6. 选择分区号，直接`Enter`， 使用默认值，fdisk 会自动选择刚刚新建的分区
     7. 输入`23`，使用 Linux root (x86-64) 类型
  3. 新建 Linux swap 分区（使用[交换文件](<https://wiki.archlinux.org/title/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BA%A4%E6%8D%A2%E6%96%87%E4%BB%B6>)可以省略此步）
     1. 输入`n`
     2. 选择分区区号，直接`Enter`，使用默认值，fdisk 会自动递增分区号
     3. 分区开始扇区号，直接 Enter，使用默认值
     4. 分区结束扇区号，比如`+8G`，这里直接使用默认值，剩下的空间均给 swap 分区
     5. 输入`t`修改刚刚创建的分区类型
     6. 选择分区号，直接`Enter`， 使用默认值，fdisk 会自动选择刚刚新建的分区
     7. 输入`19`，使用 Linux swap 类型
  4. 保存新建的分区
     1. 输入`w`

- 机械盘进行分区：

  ```shell
  fdisk /dev/sdb
  ```

  1. 新建 Linux root (x86-64) 分区
     1. 输入`n`
     2. 选择分区区号，直接`Enter`，使用默认值，fdisk 会自动递增分区号
     3. 分区开始扇区号，直接`Enter`，使用默认值
     4. 分区结束扇区号，直接`Enter`，使用默认值，使用全部空间
     5. 输入`t`修改刚刚创建的分区类型
     6. 选择分区号，直接`Enter`， 使用默认值，fdisk 会自动选择刚刚新建的分区
     7. 输入`23`，使用 Linux root (x86-64) 类型
  2. 保存新建的分区
     1. 输入`w`

### 磁盘格式化

- 格式化 EFI System 分区：

  ```shell
  mkfs.fat -F32 /dev/sda1
  ```

  如果格式化失败，可能是磁盘设备存在 Device Mapper，一般来说使用了 lvm，会存在这种情况

  - 显示 dm 状态：

  ```shell
  dmsetup status
  ```

  - 删除 dm：

  ```shell
  dmsetup remove <dev-id>
  ```

- 格式化 Linux root 分区：

  ```shell
  mkfs.ext4 /dev/sda1
  mkfs.ext4 /dev/sdb2
  ```

- 格式化 Linux swap 分区：

  ```shell
  mkswap /dev/sda3
  swapon /dev/sda3
  ```

### 挂载文件系统

在这里需要将除 swap 分区外，其他分区都挂上去。

```shell
mount /dev/sda2 /mnt
mkdir -p /mnt/boot/efi
mkdir /mnt/home
mount /dev/sda1 /mnt/boot/efi
mount /dev/sdb1 /mnt/home
```

> 先后顺序不能错，要先挂载根分区，在根分区创建目录后才能挂载其他分区。

交换分区启用:

```shell
mkswap /dev/sda3
swapon /dev/sda3
```

### 配置 pacman mirror

一般来说，不需要进行修改，如果发现下载速度很慢，可以修改其中顺序或加入[中国节点](<https://wiki.archlinux.org/title/Mirrors_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%B8%AD%E5%9B%BD>)的地址

```shell
vim /etc/pacman.d/mirrorlist
```

或直接使用`reflector`对源速度进行排序：

```shell
reflector --country China --protocol http --protocol https --latest 5 --save /etc/pacman.d/mirrorlist
```

### 安装 Arch 和 Package Group

```shell
pacstrap /mnt base base-devel linux linux-firmware
```

### 生成 fstab 文件

```shell
genfstab -U /mnt >> /mnt/etc/fstab
```

### 切换至安装好的 Arch

```shell
arch-chroot /mnt
```

### 安装必备工具

```shell
pacman -S vim networkmanager sudo
```

### 本地化

- 修改`/etc/locale.gen`，取消注释下面这两行配置：

  ```shell
  en_US.UTF-8 UTF-8
  zh_CN.UTF-8 UTF-8
  ```

- 生成 locale 信息：

  ```shell
  locale-gen
  ```

- 创建`/etc/locale.conf`并写入：

  ```shell
  LANG=en_US.UTF-8
  ```

### 网络配置

- 修改 hostname，创建`/etc/hostname`并写入（可替换为其他名称）：

  ```shell
  Arch
  ```

- 配置 hosts，编辑`/etc/hosts`

  ```shell
  127.0.0.1 localhost
  ::1    localhost
  127.0.1.1 Arch.localdomain
  ```

### 安装 Microcode

- AMD CPU：

```shell
pacman -S amd-ucode
```

- Intel CPU：

```shell
pacman -S intel-ucode
```

### 安装 GRUB

MBR 引导：

```shell
pacman -S grub
grub-install --target=i386-pc /dev/sda
grub-mkconfig -o /boot/grub/grub.cfg
```

UEFI 引导：

```shell
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=grub
grub-mkconfig -o /boot/grub/grub.cfg
```

### 修改 root 密码

```shell
passwd
```

### 新建用户

```shell
useradd -m -g wheel <username>
```

修改密码：

```shell
passwd <username>
```

## 重新启动

```shell
exit    # 退出 chroot 环境，或按 Ctrl+D
reboot
```

### 重启后的设置

使用 root 账户登录后：

- 开启时间自动同步

  ```shell
  timedatectl set-ntp true
  timedatectl set-timezone Asia/Shanghai
  ```
