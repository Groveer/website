# 使用 clash 的一些技巧

本篇文章主要介绍 clash 的一些使用技巧，因本人也不是很熟悉，大部分配置只做记录，无法给出解释。

## clash 基本设置

```yaml
mixed-port: 7890
allow-lan: true
mode: Rule
ipv6: true
log-level: warning
external-controller: :9090
external-ui: /usr/share/yacd/
```

## clash 使用数据集及规则集

```yaml
proxy-providers:
  # 从链接导入的配置文件
  proxy1:
    type: http
    path: ./proxies/proxy1.yaml
    url: "<http url>"
    interval: 3600
    health-check:
      enable: true
      url: http://www.gstatic.com/generate_204
      interval: 600
  chatgpt:
    type: http
    path: ./proxies/chatgpt.yaml
    url: "<http url>"
    interval: 3600
    filter: "chatGPT"
    health-check:
      enable: true
      url: http://www.gstatic.com/generate_204
      interval: 600
proxy-groups:
  - name: AUTO
    type: url-test
    interval: 3600
    url: http://www.gstatic.com/generate_204
    use:
      - proxy1
  - name: PROXY
    type: select
    use:
      - proxy1
    proxies:
      - AUTO
      - DIRECT
  - name: ChatGPT
    type: url-test
    interval: 3600
    url: http://www.gstatic.com/generate_204
    use:
      - chatgpt
rule-providers:
  reject:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt"
    path: ./rules/reject.yaml
    interval: 86400

  icloud:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt"
    path: ./rules/icloud.yaml
    interval: 86400

  apple:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt"
    path: ./rules/apple.yaml
    interval: 86400

  google:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt"
    path: ./rules/google.yaml
    interval: 86400

  proxy:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt"
    path: ./rules/proxy.yaml
    interval: 86400

  direct:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt"
    path: ./rules/direct.yaml
    interval: 86400

  private:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt"
    path: ./rules/private.yaml
    interval: 86400

  gfw:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt"
    path: ./rules/gfw.yaml
    interval: 86400

  tld-not-cn:
    type: http
    behavior: domain
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt"
    path: ./rules/tld-not-cn.yaml
    interval: 86400

  telegramcidr:
    type: http
    behavior: ipcidr
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt"
    path: ./rules/telegramcidr.yaml
    interval: 86400

  cncidr:
    type: http
    behavior: ipcidr
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt"
    path: ./rules/cncidr.yaml
    interval: 86400

  lancidr:
    type: http
    behavior: ipcidr
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt"
    path: ./rules/lancidr.yaml
    interval: 86400

  applications:
    type: http
    behavior: classical
    url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt"
    path: ./rules/applications.yaml
    interval: 86400
  ChatGPT:
    type: http
    behavior: classical
    url: "https://raw.githubusercontent.com/G4free/clash-ruleset/main/ruleset/ChatGPT.yaml"
    path: ./rules/ChatGPT.yaml
    interval: 86400
rules:
  - DOMAIN-SUFFIX,local,DIRECT
  - DOMAIN-SUFFIX,uniontech.com,DIRECT
  - DOMAIN-SUFFIX,deepin.com,DIRECT
  - DOMAIN-SUFFIX,kgithub.com,DIRECT
  - DOMAIN-SUFFIX,gitee.com,DIRECT
  - DOMAIN-SUFFIX,csdn.net,DIRECT
  - DOMAIN,clash.razord.top,DIRECT
  - DOMAIN,yacd.haishan.me,DIRECT
  - RULE-SET,ChatGPT,ChatGPT
  - RULE-SET,applications,DIRECT
  - RULE-SET,private,DIRECT
  - RULE-SET,reject,REJECT
  - RULE-SET,icloud,DIRECT
  - RULE-SET,apple,DIRECT
  - RULE-SET,google,DIRECT
  - RULE-SET,proxy,PROXY
  - RULE-SET,direct,DIRECT
  - RULE-SET,lancidr,DIRECT
  - RULE-SET,cncidr,DIRECT
  - RULE-SET,telegramcidr,PROXY
  - GEOIP,LAN,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,PROXY
```

## clash 透明代理

config.yaml 文件添加以下配置：

```yaml
tun:
  enable: true
  stack: system
  auto-route: true
  auto-redir: true
  auto-detect-interface: true
  dns-hijack:
    - any:53
    - tcp://any:53

# DNS server settings
# This section is optional. When not present, the DNS server will be disabled.
dns:
  enable: true
  listen: 0.0.0.0:53
  use-hosts: true
  enhanced-mode: fake-ip # or redir-host (not recommended)
  fake-ip-range:
    198.18.0.1/16 # Fake IP addresses pool CIDR
    #ipv6: true # when the false, response to AAAA questions will be empty

  # These nameservers are used to resolve the DNS nameserver hostnames below.
  # Specify IP addresses only
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
    - 180.76.76.76
    - 1.1.1.1

  # Hostnames in this list will not be resolved with fake IPs
  # i.e. questions to these domain names will always be answered with their
  # real IP addresses
  fake-ip-filter:
    - "*.lan"
    - "*.local"

  # Supports UDP, TCP, DoT, DoH. You can specify the port to connect to.
  # All DNS questions are sent directly to the nameserver, without proxies
  # involved. Clash answers the DNS question with the first result gathered.
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
    - https://cloudflare-dns.com/dns-query

  # When `fallback` is present, the DNS server will send concurrent requests
  # to the servers in this section along with servers in `nameservers`.
  # The answers from fallback servers are used when the GEOIP country
  # is not `CN`.
  fallback:
    - tls://1.0.0.1:853
    - tls://8.8.4.4:853
    - https://dns.google/dns-query
    - https://doh.opendns.com/dns-query

  # If IP addresses resolved with servers in `nameservers` are in the specified
  # subnets below, they are considered invalid and results from `fallback`
  # servers are used instead.
  #
  # IP address resolved with servers in `nameserver` is used when
  # `fallback-filter.geoip` is true and when GEOIP of the IP address is `CN`.
  #
  # If `fallback-filter.geoip` is false, results from `nameserver` nameservers
  # are always used if not match `fallback-filter.ipcidr`.
  #
  # This is a countermeasure against DNS pollution attacks.
  fallback-filter:
    geoip: true
    geoip-code: CN
    ipcidr:
      - 0.0.0.0/32
```

若配置内网走本地 dhcp，而不是通过代理访问，可以在`dns`配置加上：

```yaml
dns:
  # Lookup domains via specific nameservers
  nameserver-policy:
    "+.internal.com": "dhcp://eno1"
    "+.internal.org": "dhcp://eno1"
```

注意，`eno1` 需要改为你自己的网卡名：

```bash
ip a
```
