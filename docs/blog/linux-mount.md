# Linux 磁盘挂载

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

## 挂载smb

1. 需要先安装包：

```bash
yay -S cifs-utils smbclient
```

2. 首先使用 smbclient 看看服务器有哪些目录，若你已知道目录可跳过此步骤：

```bash
smbclient -L //192.168.1.220 -U guo
```

3. 最后挂载：

```bash
sudo mount -t cifs //192.168.1.220/share ~/fn -o username=guo,password=<password> -o uid=$UID -o gid=`id -g $USER`
```
