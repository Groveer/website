---
title: 如何优雅的使用 qemu-kvm
date: 2022-06-08 19:16:16
tags:
  - Linux
  - Tool
categories:
  - Linux
cover: https://pic.3gbizhi.com/2020/1010/20201010015227581.jpg
feature: false
---
# {{ $frontmatter.title }}

作为开发人员，往往需要在各种环境中进行调试，由于硬件资源的限制，调试环境的配置，往往需要花费大量的时间，本篇文章旨在使用 qemu-kvm 来配置各种调试环境，并且合理使用快照功能来实现各个环境的切换。

## 名词解释

1. 宿主机：通常为用户使用的机器，通常称为主机
2. 虚拟机：顾名思义，就是虚拟机

## 虚拟机的安装

本篇文章希望读者可以理解 qemu 的运行原理，故不会介绍 gui 相关的操作，有兴趣的同学可以自行搜索相关知识。虚拟机的安装很简单，对于`Archlinux`，不需要图形界面的虚拟机，可以安装`qemu-base`，反之可以安装`qemu-desktop`。

## 创建硬盘镜像

1. 硬盘镜像是一个文件，存储虚拟机硬盘上的内容。
2. 一种硬盘镜像可能是`raw`镜像, 和主机上看到的内容一模一样，并且将始终使用主机上的硬盘驱动器的全部容量。此方法提供的 I/O 开销最小，但可能会浪费大量空间，因为虚拟机上未使用的空间无法在主机上使用。
3. 另外一种方式是`qcow2`格式，仅当主机实际写入内容的时候，才会分配镜像空间。对虚拟机来说，硬盘大小表现为完整大小，即使它可能仅占用主机系统上的非常小的空间。此映像格式还支持 QEMU 快照功能。但是，使用此格式可能会影响性能。
4. 在创建硬盘镜像之前，需要准备一个目录存放硬盘镜像文件，一般为用户`home`目录。需要注意的是，如果主机使用的是`btrfs`文件系统，那么需要关闭其写时复制功能：

   ```shell
   chattr +C dir
   ```

5. 准备好目录后，可以在当前目录执行下面命令来创建硬盘镜像，也可以使用`-f raw`来创建 raw 格式的硬盘镜像，但是该格式不支持快照功能。

   ```shell
   qemu-img create -f qcow2 <image_file> 80G
   ```

## UEFI 引导

1. 确保安装包：

   ```shell
   edk2-ovmf
   ```

2. 拷贝固件文件：

   ```shell
   cp /usr/share/edk2-ovmf/x64/OVMF_VARS.fd .
   ```

3. 启动参数加上以下参数：

   ```shell
   -drive if=pflash,format=raw,readonly=on,file=/usr/share/edk2-ovmf/x64/OVMF_CODE.fd -drive if=pflash,format=raw,file=OVMF_VARS.fd
   ```

## 安装系统

1. 准备好安装介质，一般是各个操作系统发行版发布的 iso 文件。
2. 第一次启动模拟器，为了在磁盘镜像上安装操作系统，必须同时将磁盘镜像与安装介质装载到虚拟机上，从安装介质中启动操作系统：

   ```shell
   qemu-system-x86_64 -drive file=<disk_image> -m 4G -smp 4 -enable-kvm -boot menu=on -cdrom <iso_image>
   ```

   1. -cdrom 参数指定安装介质。
   2. -boot 参数指定引导顺序，使用`menu=on`可以在虚拟机刚启动时按`esc`来手动选择启动顺序。
   3. -drive 参数指定硬盘镜像文件，该参数可以指定多个文件，但不同的文件有不同的用处，有兴趣的同学可以自行搜索相关资料。
   4. -m 参数指定虚拟机所使用的内存大小，可以自行调整，单位可以是 M 或 G。
   5. -smp 参数指定虚拟机所使用的 CPU 个数，可以自行调整。
   6. -enable-kvm 参数使用 kvm 内核模块，如果不使用，虚拟机性能会非常差，如果开启失败，请检查 bios 设置中的虚拟机技术支持是否开启。

3. 安装完成后，以后每次启动可以去掉`-cdrom`参数。

## 快照管理

在虚拟机关机状态下，使用`qemu-img snapshot`进行快照管理，可以使用`qemu-img snapshot --help`查看帮助，注意只有 qcow2 才能使用快照功能。

1. `qemu-img snapshot -c Tag disk_image`在`disk_image`文件中创建名为`Tag`的快照。
2. `qemu-img snapshot -l disk_image`查看`disk_image`文件中的快照信息。
3. `qemu-img snapshot -a Tag disk_image`将`disk_image`还原到`Tag`时。
4. `qemu-img snapshot -d Tag disk_image`将`disk_image`文件中的`Tag`快照删除。

## 硬盘镜像扩展

1. 当硬盘镜像不够使用时，可以对其进行扩展：`qemu-img resize disk_image +/-10G`。
2. 在磁盘映像扩容后，必须使用虚拟机内部系统的分区工具对该镜像进行分区并格式化后才能真正开始使用新空间。在收缩磁盘映像时，必须首先使用虚拟机内部系统的分区工具减少分该分区的大小，然后相应地收缩磁盘映像，否则收缩磁盘映像将导致数据丢失！
3. `注意`：调整包含 NTFS 引导文件系统的镜像将无法启动已安装的操作系统，推荐在操作之前进行备份。

## 总结

使用上述的技巧可以灵活的使用虚拟机，并且可以将`qcow2`文件放置在移动硬盘中进行携带，那么一个硬盘镜像文件几乎可以满足各种调试场景的需求了。
