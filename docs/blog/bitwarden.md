# 使用 bitwarden 保存你的小秘密

在这个数字化时代，我们每天都要处理大量的密码和敏感信息。为了保护这些信息的安全，使用密码管理工具变得尤为重要。Bitwarden 是一款开源且功能强大的密码管理器，能够帮助你安全地存储和管理你的密码、笔记和其他敏感数据。

## 为什么选择 Bitwarden？

1. **开源和透明**：Bitwarden 是开源软件，任何人都可以查看其代码，确保没有后门或安全漏洞。
2. **跨平台支持**：Bitwarden 支持多种平台，包括 Windows、macOS、Linux、iOS 和 Android，还提供浏览器扩展，方便你随时随地访问你的密码。
3. **强大的加密**：Bitwarden 使用端到端加密，确保你的数据在传输和存储过程中始终保持安全。
4. **易于使用**：Bitwarden 提供直观的用户界面，使得管理密码变得简单方便。
5. **免费和付费选项**：Bitwarden 提供免费版本，满足大多数用户的需求，同时也有付费版本，提供更多高级功能。

## 什么是 Vaultwarden？

Vaultwarden 是 Bitwarden 的一个轻量级替代品，适合那些希望自行托管密码管理器的用户。它基于 Rust 语言开发，性能优越，占用资源少，非常适合在个人服务器或家庭网络中运行。

本章节将重点介绍 Bitwarden 的使用方法和 Vaultwarden 的部署技巧，若不需要自行托管，可以跳过 Vaultwarden 部分，直接使用 Bitwarden 的官方服务。

### 安装和部署

参考[Vaultwarden 官方文档](https://github.com/dani-garcia/vaultwarden），可使用 docker 或者 docker-compose 进行快速部署。

- 使用 Docker 部署 Vaultwarden：

```bash
docker pull vaultwarden/server:latest
docker run --detach --name vaultwarden \
  --env DOMAIN="https://vw.domain.tld" \
  --volume /vw-data/:/data/ \
  --restart unless-stopped \
  --publish 127.0.0.1:8000:80 \
  vaultwarden/server:latest
```

- 使用 Docker Compose 部署 Vaultwarden：

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    container_name: vaultwarden
    restart: unless-stopped
    environment:
      DOMAIN: "https://vw.domain.tld"
    volumes:
      - ./vw-data/:/data/
    ports:
      - 127.0.0.1:8000:80
```

> [!TIP]
> 注意域名改为你自己的域名，并确保配置好 HTTPS 证书以保障数据传输的安全。

## 使用 Bitwarden

Bitwarden 提供了非常多的平台支持，包括桌面应用、移动应用、支持多种浏览器的扩展以及CLI工具。你可以根据自己的需求选择合适的客户端进行安装和使用。

Bitwarden 客户端的安装方式在[官方文档](https://bitwarden.com/download)中有详细介绍。这里不再多做赘述。主要说明一下使用注意点和各个场景的主要用途：

1. 如果使用自建服务（Vaultwarden），在客户端登录时需要选择自托管方式（一般在登录界面下方）并且设置自定义服务器地址。
2. 浏览器扩展一般用于记录登录密码、passkey、官方付费或者自托管的 TOTP 以及自动填写表单等操作，功能和一些浏览器内置密码管理器类似，但功能更多。
3. 移动端应用可以方便地在手机上查看和使用密码，并且支持记录App的登录密码。
4. 桌面端使用的比较少，但是桌面端会内置 ssh-agent, 存储 SSH 私钥等信息，可以方便地在本地使用。

### Bitwarden CLI 工具

Bitwarden 还提供了命令行工具（CLI），适合喜欢使用终端的用户。CLI 工具可以让你通过命令行管理你的密码库，执行如添加、删除、更新条目等操作。

**常用命令示例：**

- 自定义服务器地址：

```bash
bw config server https://example.com
```

- 登录：

```bash
bw login
```

- 解锁密码库：

```bash
bw unlock
```

- 列出所有条目：

```bash
bw list items
```

- 获取特定条目：

```bash
bw get item <item-id>
```

上面这些是常用的命令，结合其他命令还可以实现更多功能，比如下面这个示例：

```bash
# unlock bitwarden and export session token
ubw() {
    # set environment variables
    export BW_SESSION=$(bw unlock --raw)
    keys=(
        GEMINI_API_KEY
        TAVILY_API_KEY
        UT_KEY
    )
    for key in "${keys[@]}"; do
        export $key=$(bw get notes $key --session $BW_SESSION)
        echo "$key=${(P)key}"  # 使用参数扩展 ${(P)key} 读取变量名为$key的变量的值
    done
    # get ssh key
    keys=(
        ssh_git
        ssh_home
    )
    start_ssh_agent
    for key in "${keys[@]}"; do
        bw get item $key --session $BW_SESSION | jq -r .sshKey.privateKey | ssh-add -
    done
}
```

这个函数 `ubw` 会解锁 Bitwarden 密码库，导出会话令牌，并从密码库中获取一些 API 密钥和 SSH 私钥，设置为环境变量或添加到 SSH 代理中，方便在终端中使用。

start_ssh_agent 函数实现：

```bash
start_ssh_agent() {
    local agent_pid sock_file sock_dir
    agent_pid=$(pgrep -u "$USER" ssh-agent 2>/dev/null)
    if [[ -n "$agent_pid" ]]; then
        RUNDIR="${XDG_RUNTIME_DIR:-/run/user/$UID}"
        for dir in \
            "$HOME/.ssh/agent" \
            "$RUNDIR/gnupg" \
            "$RUNDIR/keyring"
        do
            [[ -d $dir ]] || continue
            sock_file=$(find "$dir" -type s 2>/dev/null | head -n1)
            [[ -n $sock_file ]] && break
        done

        echo "SSH_AUTH_SOCK: $sock_file"
        if [[ -S "$sock_file" ]]; then
            SSH_AGENT_PID=$agent_pid
            SSH_AUTH_SOCK=$sock_file
            export SSH_AGENT_PID SSH_AUTH_SOCK
            return
        fi
    fi
    eval "$(ssh-agent -s)"
}
```

这个函数 `start_ssh_agent` 会检查当前用户是否已经有运行中的 `ssh-agent` 进程。如果有，它会尝试找到对应的套接字文件并设置环境变量 `SSH_AUTH_SOCK` 和 `SSH_AGENT_PID`。如果没有找到运行中的 `ssh-agent`，它会启动一个新的 `ssh-agent` 实例，并设置相应的环境变量。

当然还要 Windows 版本：

```powershell
function ubw {
    # 获取 Bitwarden session
    $BW_SESSION = bw unlock --raw

    # 设置 API key 环境变量
    $keys = @(
        "GEMINI_API_KEY"
        "TAVILY_API_KEY"
        "UT_KEY"
    )
    foreach ($key in $keys) {
        $value = bw get notes $key --session $BW_SESSION
        Set-Item -Path "Env:$key" -Value $value
    }

    # 启动 ssh-agent
    ssh-agent

    # 添加 SSH key
    $ssh_keys = @(
        "ssh_git"
        "ssh_home"
    )
    foreach ($key in $ssh_keys) {
        $privateKey = bw get item $key --session $BW_SESSION | jq -r '.sshKey.privateKey'
        $privateKey | ssh-add -
    }
}
```

在 Windows 中，ssh-agent 并不会重复启动已经运行的实例，所以直接调用 `ssh-agent` 即可。

