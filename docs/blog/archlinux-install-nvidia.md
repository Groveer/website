---
title: ArchLinux 安装 Nvidia 驱动
date: 2022-08-05 14:46:32
tags:
  - Linux
categories:
  - ArchLinux
cover: https://pic.3gbizhi.com/2020/1011/20201011011357445.jpg
feature: false
---
# {{ $frontmatter.title }}

Nvidia 的开源驱动(nouveau)是作为逆向工程开发的，性能毕竟比不上闭源驱动，本篇教程将教大家在 ArchLinux 上安装闭源驱动。

### 安装闭源驱动

1. 不同的内核，所用的驱动版本不同，安装前先确认自己的内核版本

    官方标准内核(linux)所用驱动：

    ```shell
    nvidia
    ```

    lts内核(linux-lts)所用驱动：

    ```shell
    nvidia-lts
    ```

    若系统中没有对应的内核的驱动，可以使用[dkms](https://wiki.archlinux.org/title/Dynamic_Kernel_Module_Support):

    ```shell
    nvidia-dkms
    ```

    还需要注意安装对应内核的内核头文件才能正常编译！

### 生成 initramfs

1. 编辑配置文件：

    ```shell
    sudo vim /etc/mkinitcpio.conf
    ```

2. 在`MODULES`字段里添加：

    ```shell
    nvidia nvidia_modeset nvidia_uvm nvidia_drm
    ```

3. 为防止内核加载开源驱动，在`HOOKS`字段里删除：

    ```shell
    kms
    ```

3. 生成新的 initramfs：

    ```shell
    mkinitcpio -P
    ```

## 配置内核启动参数

1. 编辑`grub`配置文件：

    ```shell
    sudo /etc/default/grub
    ```

2. 在`GRUB_CMDLINE_LINUX`字段中添加以下参数：

    ```shell
    ibt=off nvidia_drm.modeset=1
    ```

    ibt=off 参数是为了防止新的硬件导致无法开机问题，此问题在11代以上 Intel CPU 出现，参考[这里](https://wiki.archlinux.org/title/NVIDIA#Installation)

3. 最后重新生成 grub.cfg：

    ```shell
    sudo grub-mkconfig -o /boot/grub/grub.cfg
    ```

### 检查驱动是否正常

1. 重启电脑后检查：

   ```shell
   nvidia-smi
   ```

2. 如果出现以下输出，则为正常启动：

    ```shell
    Sat Feb 18 19:49:22 2023
    +-----------------------------------------------------------------------------+
    | NVIDIA-SMI 525.89.02    Driver Version: 525.89.02    CUDA Version: 12.0     |
    |-------------------------------+----------------------+----------------------+
    | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
    | Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
    |                               |                      |               MIG M. |
    |===============================+======================+======================|
    |   0  NVIDIA GeForce ...  Off  | 00000000:01:00.0 Off |                  N/A |
    | 34%   25C    P0    27W / 125W |    468MiB /  6144MiB |      6%      Default |
    |                               |                      |                  N/A |
    +-------------------------------+----------------------+----------------------+

    +-----------------------------------------------------------------------------+
    | Processes:                                                                  |
    |  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
    |        ID   ID                                                   Usage      |
    |=============================================================================|
    |    0   N/A  N/A     34440      G   Hyprland                          126MiB |
    |    0   N/A  N/A     34519      G   Xwayland                            2MiB |
    |    0   N/A  N/A     34773      G   /usr/lib/firefox/firefox          168MiB |
    |    0   N/A  N/A     36147      G   alacritty                          89MiB |
    |    0   N/A  N/A     37749      G   alacritty                          48MiB |
    +-----------------------------------------------------------------------------+
    ```
