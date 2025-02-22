# zram & swap

## 使用 zram 创建 swap 空间

使用 zram 作为交换空间，与常规的基于分区或基于文件的交换空间做的事情相同。当内存压力过大时，一些最近使用最少的数据会被移到交换空间。平均来说，它会被压缩到其原始大小的 50% 左右，并被放置在内存的 zram 空间中。这比将这些内存页存储在硬盘上要快得多，并可以释放出它所使用的内存用于其他用途。

:::tip 提示
因为使用的是物理内存，所以 zram 的大小不能超过物理内存大小，具体大小建议可以参考下面的公式：
| 物理内存大小| zram 大小|
|-----------|----|
| ram > 8G | ram \* 50% |
| ram <= 8G | ram \* 25% |
:::

以下是使用 udev 规则创建 zram 并作为 swap 空间，无需安装软件包：

1. 显示的在启动时加载内核模块：

```txt
/etc/modules-load.d/zram.conf
```

```txt
zram
```

2. 创建如下的 udev 规则（请按需调整 disksize 属性，调整公式参考前面的提示）：

```txt
/etc/udev/rules.d/99-zram.rules
```

```txt
ACTION=="add", KERNEL=="zram0", ATTR{initstate}=="0", ATTR{comp_algorithm}="zstd", ATTR{disksize}="8G", RUN="/usr/bin/mkswap -U clear %N", TAG+="systemd"
```

3. 将 /dev/zram 以一个高于默认值的优先度添加到 fstab：

```txt
/etc/fstab
```

```txt
/dev/zram0 none swap defaults,discard,pri=100 0 0
```

:::warning 注意
不能在 fstab 中使用 LABEL 或 UUID 对 zram 上的交换空间进行引用，因为 udev 不会为 zram 设备创建 /dev/disk/by-label/_ 和 /dev/disk/by-uuid/_ 的符号链接。
:::

## 使用 swapfile 创建 swap 空间

与创建完整分区相比，交换文件（swap file）支持实时动态调整大小，且能更便捷地彻底删除。这在磁盘空间紧张时（例如小容量固态硬盘）尤为实用。

以下是支持交换文件的文件系统：

| 文件系统 | 是否支持                              |
| -------- | ------------------------------------- |
| Bcachefs | <span style="color:#FFFF00">否</span> |
| Btrfs    | <span style="color:#00FF00">是</span> |
| F2FS     | <span style="color:#00FF00">是</span> |
| ext4     | <span style="color:#00FF00">是</span> |
| JFS      | <span style="color:#00FF00">是</span> |
| NILFS2   | <span style="color:#FFFF00">否</span> |
| NTFS3    | <span style="color:#00FF00">是</span> |
| ReiserFS | <span style="color:#00FF00">是</span> |
| XFS      | <span style="color:#00FF00">是</span> |
| ZFS      | <span style="color:#FFFF00">否</span> |

:::warning 注意
对于 Btrfs，请按照[Btrfs 创建 swapfile](#btrfs-创建-swapfile)中描述的步骤，而不是以下步骤。
:::

1. 使用 mkswap 创建自定义大小的交换文件。例如，创建一个 8GiB 的交换文件：

```shell
mkswap -U clear --size 8G --file /swapfile
```

2. 启用交换文件：

```shell
swapon /swapfile
```

3. 编辑 fstab 配置并且将交换文件配置加入其中：

```txt
/etc/fstab
```

```txt
/swapfile none swap defaults,pri=50 0 0
```

4. 如果要删除交换文件，必须先关闭使用：

```shell
swapoff /swapfile
```

```shell
sudo rm -f /swapfile
```

最后删除`/etc/fstab`中对应的条目。

## Btrfs 创建 swapfile

1. 为正确初始化交换文件（swap file），需先创建非快照子卷用于存放该文件，例如：

```shell
btrfs subvolume create /swap
```

2. 创建交换文件：

```shell
btrfs filesystem mkswapfile --size 4g --uuid clear /swap/swapfile
```

如果不提供`--size`参数，默认使用 2GiB。

3. 激活交换文件：

```shell
swapon /swap/swapfile
```

4. 编辑 fstab 配置并且将交换文件配置加入其中：

```txt
/etc/fstab
```

```txt
/swap/swapfile none swap defaults,pri=50 0 0
```

## 写在最后

细心的同学可能会发现，不管是 zram 或是 swapfile，在 fstab 中都设置了`pri`参数，这个参数用于设置优先级，取值范围为 0~32767，值越大优先级越高，在这篇文章中，zram 优先级为 100，swapfile为 50，所以当系统内存不足时，优先使用 zram，而这恰恰是我们所希望的结果。
