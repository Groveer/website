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
