# Linux 创建 aria2 systemd 服务

1. 创建所需目录：

```bash
mkdir -p ~/.config/aria2
mkdir -p ~/Downloads
```

2. 创建配置文件 `~/.config/aria2/aria2.conf`，并添加以下内容：

```conf
# filepath: ~/.config/aria2/aria2.conf
# 下载目录
dir=~/Downloads

# 启用断点续传
continue=true

# 启用文件分片下载
min-split-size=25M

# 最大同时下载任务数
max-concurrent-downloads=5

# 每个服务器最大连接数
max-connection-per-server=5

# 启用 RPC
enable-rpc=true
rpc-listen-all=false
rpc-allow-origin-all=true
rpc-listen-port=6800

# 日志文件
log-level=notice
```

3. 创建 systemd 服务文件 `~/.config/systemd/user/aria2.service`，并添加以下内容：

```ini
# filepath: ~/.config/systemd/user/aria2.service
[Unit]
Description=Aria2c download manager
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/aria2c --conf-path=%h/.config/aria2/aria2.conf
Restart=on-failure

[Install]
WantedBy=default.target
```

4. 重新加载 systemd 用户服务：

```bash
systemctl --user daemon-reload
systemctl --user enable --now aria2.service
```

> [!NOTE]
> 如果想查看全部配置项，可以参考[这篇博客](https://pengs.top/aria2-config/)
