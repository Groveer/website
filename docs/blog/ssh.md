# ssh 配置说明

```text
Host *
    ServerAliveInterval 240
    SetEnv TERM=xterm-256color
```

`Host *` 部分表示该配置适用于所有主机。以下是各个配置项的说明：
- `ServerAliveInterval 240`：该选项设置客户端向服务器发送保持活动消息的时间间隔（以秒为单位）。在此配置中，客户端每240秒发送一次消息，以防止连接因长时间不活动而被服务器关闭。
- `SetEnv TERM=xterm-256color`：该选项设置环境变量 `TERM` 的值为 `xterm-256color`。这告诉远程服务器使用支持256色的终端类型，从而改善终端显示效果，特别是在使用颜色丰富的应用程序时。
