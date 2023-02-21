---
title: 使用 systemd 实现自动登陆
date: 2022-09-16 15:59:35
tags:
  - Linux
categories:
  - Linux
cover: https://pic.3gbizhi.com/2019/0909/20190909043921431.jpg
feature: false
---
# {{ $frontmatter.title }}

systemd 是一个 Linux 系统基础组件的集合，提供了一个系统和服务管理器，运行为 PID 1 并负责启动其它程序。使用 systemd 实现自动登录，其实就是开机自启 getty 服务，但默认的服务需要进行修改才能实现该功能。

## 使用systemd实现自动登陆

1. 修改文件`/etc/systemd/system/getty.target.wants/getty@tty1.service`
2. 追加`-a/--autologin USERNAME`到该行：`ExecStart=-/sbin/agetty --noclear %I $TERM`
3. 修改后：`ExecStart=-/sbin/agetty -a USERNAME %I $TERM`
4. 可能还会删除`-o '-p -- \\u'`（当前Arch安装中存在），因为这将启动登录名，USERNAME但仍要求输入密码。
5. 重新启动后，您将自动登录。

## 防止systemd更新导致配置被重置

1. 查看软链到哪个配置文件：`ls -l /etc/systemd/system/getty.target.wants/getty@tty1.service`
2. 结果为：`/usr/lib/systemd/system/getty@.service`
3. 修改文件属性：`sudo chattr +i /usr/lib/systemd/system/getty@.service`
