---
title: 使用zram创建swap分区
date: 2022-08-23 18:33:27
tags:
  - Linux
categories:
  - Linux
cover: https://pic.3gbizhi.com/2020/1020/20201020112257666.jpg
feature: false
---
# {{ $frontmatter.title }}

zram 通过在 RAM 内的压缩块设备上分页，直到必须使用硬盘上的交换空间，以避免在磁盘上进行分页，从而提高性能。<br>
由于 zram 可以用内存替代硬盘为系统提供交换空间的功能，zram 可以在需要交换/分页时让 Linux 更好利用 RAM，在物理内存较少的旧电脑上尤其如此。<br>
以下是一个简单的脚本用来创建 zram swap 设备，注意，这个脚本假设你还没有使用 zram，并提供了启动的 systemd 配置:

1. 创建文件：

   ```shell
   /usr/local/bin/zramswap-on
   ```

   ```shell
   #!/bin/bash
   # Disable zswap
   echo 0 > /sys/module/zswap/parameters/enabled

   # Load zram module
   modprobe zram

   # use zstd compression
   echo zstd > /sys/block/zram0/comp_algorithm

   # echo 512M > /sys/block/zram0/disksize
   echo 2G > /sys/block/zram0/disksize

   mkswap /dev/zram0

   # Priority can have values between -1 and 32767
   swapon /dev/zram0 -p 32767
   ```

2. 创建文件：

   ```shell
   /usr/local/bin/zramswap-on
   ```

   ```shell
   #!/bin/bash
   swapoff /dev/zram0
   echo 0 > /sys/class/zram-control/hot_remove

   # Not required, but creating a blank uninitalzed drive
   # after removing one may be desired
   cat /sys/class/zram-control/hot_add
   ```

3. 创建文件：

   ```shell
   /etc/systemd/system/create-zram-swap.service
   ```

   ```shell
   [Unit]
   Description=Configures zram swap device
   After=local-fs.target

   [Service]
   Type=oneshot
   ExecStart=/usr/local/bin/zramswap-on
   ExecStop=/usr/local/bin/zramswap-off
   RemainAfterExit=yes

   [Install]
   WantedBy = multi-user.target
   ```

然后执行服务配置加载和激活:

```shell
sudo chmod +x /usr/local/bin/zramswap-on
```

```shell
sudo chmod +x /usr/local/bin/zramswap-off
```

```shell
sudo systemctl daemon-reload
```

```shell
sudo systemctl enable --now create-zram-swap.service
```

_参考_：[https://cloud-atlas.readthedocs.io/zh_CN/latest/linux/redhat_linux/kernel/zram.html](https://cloud-atlas.readthedocs.io/zh_CN/latest/linux/redhat_linux/kernel/zram.html)
