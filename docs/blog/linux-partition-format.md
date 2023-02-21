---
title: Linux 环境下分区和格式化
date: 2023-02-18 20:26:23
tags:
  - Linux
  - Partition
categories:
  - Linux
cover: https://pic.3gbizhi.com/2020/0828/20200828064600253.jpg
feature: false
---
# {{ $frontmatter.title }}

很多小伙伴对 Linux 环境下分区和格式化不是很熟悉，本篇文章将教大家如何在 Linux 环境下进行分区和格式化。

在 Linux 环境下，一切皆文件，包括磁盘设备，也会被映射为设备文件，所以若想正常使用一块磁盘，需要先找到磁盘设备文件，然后对其进行分区和格式化，最后才能进行存储和使用。

### 分区

在 Linux 环境下进行分区，本人喜欢使用 gnu 工具集里面的 fdisk，如果喜欢使用其他工具，可自行查看文档。

1. 首先查找当前的设备：

   ```shell
   lsblk -f
   ```

### 格式化
