---
title: Linux 磁盘挂载
date: 2022-09-10 16:06:43
tags:
  - Linux
categories:
  - Linux
cover: https://pic.3gbizhi.com/2014/0504/20140504053231302.jpg
feature: false
---
# {{ $frontmatter.title }}

这里提供一些在 Linux 环境下磁盘挂载小技巧。

## 将U盘挂载到普通用户目录

创建挂载点：

```bash
mkdir $HOME/usb
```

将`/dev/sdb1` 挂载到 usb 目录：

```bash
sudo mount /dev/sdb1 $HOME/usb -o uid=$UID -o gid=`id -g $USER`
```
