# ArchLinux 系统安装，保姆级教程

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

磁盘分区可以参考本人的专题[Linux 磁盘管理](/linux-disk-manager/index.md)。

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

虚拟机用户不需要安装`linux-firmware`

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

开启 network：

```shell
systemctl enable NetworkManager
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

虚拟机用户略过此步。

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

修改sudoers，将下面这一行取消注释：

```shell
%wheel ALL=(ALL:ALL) ALL
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

- 开启时间自动同步并修改时区

  ```shell
  timedatectl set-ntp true
  timedatectl set-timezone Asia/Shanghai
  ```
