# 使用 systemd 实现自动登陆

systemd 是一个 Linux 系统基础组件的集合，提供了一个系统和服务管理器，运行为 PID 1 并负责启动其它程序。使用 systemd 实现自动登录，其实就是开机自启 getty 服务，但默认的服务需要进行修改才能实现该功能。

## 使用systemd实现自动登陆

1. 执行命令：

```bash
sudo systemctl edit getty@tty1
```

2. 找到该行：`ExecStart=-/sbin/agetty --noclear %I $TERM`
3. 修改后：`ExecStart=-/sbin/agetty -a USERNAME %I $TERM`
4. `USERNAME` 为登录用户名
5. 可能还会删除`-o '-p -- \\u'`（当前Arch安装中存在），因为这将启动登录名，USERNAME但仍要求输入密码。
6. 重新启动后，您将自动登录。
