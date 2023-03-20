# 使用 clash 的一些技巧

本篇文章主要介绍 clash 的一些使用技巧，因本人也不是很熟悉，大部分配置只做记录，无法给出解释。

## clash 透明代理

config.yaml 文件添加以下配置：

```yaml
tun:
  enable: true
  stack: system
  auto-route: true
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
  # ipv6: false # when the false, response to AAAA questions will be empty

  # These nameservers are used to resolve the DNS nameserver hostnames below.
  # Specify IP addresses only
  default-nameserver:
    - 223.5.5.5
  enhanced-mode: fake-ip # or redir-host (not recommended)
  fake-ip-range: 198.18.0.1/16 # Fake IP addresses pool CIDR
  # use-hosts: true # lookup hosts and return IP record

  # Hostnames in this list will not be resolved with fake IPs
  # i.e. questions to these domain names will always be answered with their
  # real IP addresses
  fake-ip-filter:
    - "*.lan"
    - "*.local"
    - dns.msftncsi.com
    - www.msftncsi.com
    - www.msftconnecttest.com
    - stun.*.*.*
    - stun.*.*
    - miwifi.com
    - music.163.com
    - "*.music.163.com"
    - "*.126.net"
    - api-jooxtt.sanook.com
    - api.joox.com
    - joox.com
    - y.qq.com
    - "*.y.qq.com"
    - streamoc.music.tc.qq.com
    - mobileoc.music.tc.qq.com
    - isure.stream.qqmusic.qq.com
    - dl.stream.qqmusic.qq.com
    - aqqmusic.tc.qq.com
    - amobile.music.tc.qq.com
    - "*.xiami.com"
    - "*.music.migu.cn"
    - music.migu.cn
    - netis.cc
    - router.asus.com
    - repeater.asus.com
    - routerlogin.com
    - routerlogin.net
    - tendawifi.com
    - tendawifi.net
    - tplinklogin.net
    - tplinkwifi.net
    - tplinkrepeater.net
    - "*.ntp.org.cn"
    - "*.openwrt.pool.ntp.org"
    - "*.msftconnecttest.com"
    - "*.msftncsi.com"
    - localhost.ptlogin2.qq.com
    - "*.*.*.srv.nintendo.net"
    - "*.*.stun.playstation.net"
    - xbox.*.*.microsoft.com
    - "*.ipv6.microsoft.com"
    - "*.*.xboxlive.com"
    - speedtest.cros.wr.pvp.net
    - "+.mtrx.nz"
    - "+.matrix.org"
    - "+.letsencrypt.org"
    - "+.justforlxz.com"
    - "+.mkacg.com"
    - "+.uniontech.com"
    - "+.deepin.com"
    - "+.deepin.org"

  # Supports UDP, TCP, DoT, DoH. You can specify the port to connect to.
  # All DNS questions are sent directly to the nameserver, without proxies
  # involved. Clash answers the DNS question with the first result gathered.
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query
    - https://dns.google/dns-query
    - https://223.5.5.5/dns-query
    # - '8.8.8.8#en0'

  # When `fallback` is present, the DNS server will send concurrent requests
  # to the servers in this section along with servers in `nameservers`.
  # The answers from fallback servers are used when the GEOIP country
  # is not `CN`.
  fallback:
    - tls://1.0.0.1:853
    - tls://8.8.4.4:853
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
    domain:
      - +.google.com
      - +.facebook.com
      - +.twitter.com
      - +.youtube.com
      - +.xn--ngstr-lra8j.com
      - +.google.cn
      - +.googleapis.cn
      - +.googleapis.com
      - +.gvt1.com
  # Lookup domains via specific nameservers
  nameserver-policy:
    "+.uniontech.com": "dhcp://en0"
    "+.deepin.org": "dhcp://en0"
    "+.deepin.com": "dhcp://en0"
```

最后三行设置哪些域名使用本地网口进行访问，而不是 tun 网口，注意，`en0` 需要改为你自己的网卡名：

```bash
ip a
```
