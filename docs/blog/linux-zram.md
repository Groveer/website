# 使用zram创建swap分区

使用 zram 作为交换空间，与常规的基于分区或基于文件的交换空间做的事情相同。当内存压力过大时，一些最近使用最少的数据会被移到交换空间。平均来说，它会被压缩到其原始大小的 50% 左右，并被放置在内存的 zram 空间中。这比将这些内存页存储在硬盘上要快得多，并可以释放出它所使用的内存用于其他用途。

:::tip 提示
因为使用的是物理内存，所以 zram 的大小不能超过物理内存大小，具体大小建议可以参考下面的公式：
| ram > 8G | 8G |
|-----------|----|
| ram <= 8G | ram \* 95% |
:::

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
   echo 8G > /sys/block/zram0/disksize

   mkswap /dev/zram0

   # Priority can have values between -1 and 32767
   swapon /dev/zram0 -p 32767
   ```

2. 创建文件：

   ```shell
   /usr/local/bin/zramswap-off
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
