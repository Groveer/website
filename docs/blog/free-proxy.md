# 免费代理

这里使用的免费代理都是基于 clash-meta 来实现，关于 clas-meta 的配置，可以参考[clash](clash)。

**主要内容：**

1. 注册 cloudflare 账号（简称 cf），使用其免费提供的 workers 来搭建代理
2. 查找网络上其他的免费高质量代理
3. 将这些代理导入到 clash-meta 的配置中
4. 将 clash-meta 作为服务启动

## 注册 cf 账号，搭建 cf 代理

1. 打开网站[https://www.cloudflare-cn.com/](https://www.cloudflare-cn.com/)，根据提示注册账号
2. 点击左侧栏的`workers和pages`；
3. 点击`创建应用程序`；
4. 点击`创建 Worker`；
5. 随便修改下名字，如`proxy`或者`worker-proxy`
6. 点击`部署`
7. 点击`编辑代码`
8. 打开网站[https://github.com/cmliu/edgetunnel](https://github.com/cmliu/edgetunnel)
9. 将`_worker.js`中代码复制到 cf 网页中的代码
10. 生成一个`uuid`，Linux 中可以`lsblk -f`，随便复制一个 uuid 到代码中第 7 行，并且记住这个 uuid
11. 点击 cf 网页中的`保存并部署`
12. 点击`设置->触发器`，记住路由中的地址，一般是`https://proxy.xxx.workers.dev`
13. clash-meta 中的订阅地址就是`https://proxy.xxx.workers.dev/<uuid>`

## 查找网络上的高质量免费代理

1. 可以在这个网站上找[免费机场收集](https://askahh.com/archives/101/)
2. 建议使用[https://ikuuu.pw](https://ikuuu.pw/auth/register?code=Iqmy)
3. 邮箱注册，然后首页一般都会有 clash 订阅链接
4. 若需要翻墙才能访问订阅链接，或者订阅链接不稳定，可以使用[acl4ssr](https://acl4ssr-sub.github.io/)对订阅链接进行转换。

## clas-meta 设置

1. yaml 配置参考本人另一篇博客[clash](clash)
2. clash-meta 下载地址：[https://github.com/MetaCubeX/mihomo/releases](https://github.com/MetaCubeX/mihomo/releases)
3. clas-meta system service:

```ini
[Unit]
Description=Clash-Meta Daemon, Another Clash Kernel.
After=network.target NetworkManager.service systemd-networkd.service iwd.service

[Service]
Type=simple
User=clash-meta
Group=clash-meta
LimitNPROC=500
LimitNOFILE=1000000
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_RAW CAP_NET_BIND_SERVICE CAP_SYS_TIME CAP_SYS_PTRACE CAP_DAC_READ_SEARCH
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_RAW CAP_NET_BIND_SERVICE CAP_SYS_TIME CAP_SYS_PTRACE CAP_DAC_READ_SEARCH
Restart=always
ExecStartPre=/usr/bin/sleep 2s
ExecStart=/usr/bin/clash-meta -d /etc/clash-meta
ExecReload=/bin/kill -HUP $MAINPID

[Install]
WantedBy=multi-user.target
```

4. 二进制放在`/usr/bin/clash-meta`，配置文件放在`/etc/clash-meta/config.yaml`
