# 优秀插件：本地实测的 Pi 扩展

## 前言

Pi 本体足够克制——只有 4 个默认工具、一份精简系统提示词。它真正的扩展性来自四类资源：**Extensions**（TypeScript 扩展，加工具/命令/事件/UI）、**Skills**（按需加载的能力说明）、**Prompt Templates**（可复用提示词）、**Themes**（终端主题）。

这篇文章不讲 Pi 生态有多大，只讲我这一台机器上真正跑起来的组合——它们解决什么问题、值不值得装、彼此之间是怎么配合的。

## 我的安装清单

当前 `~/.pi/agent/npm/` 和 `~/.pi/agent/skills/` 里的东西：

### Pi Packages（10 个）

```
npm:pi-mcp-adapter              npm:@luxusai/pi-hindsight
npm:pi-web-access               npm:context-mode
npm:@spences10/pi-themes        npm:@dietrichgebert/ponytail
npm:@getpipher/vision           npm:@narumitw/pi-goal
npm:@ff-labs/pi-fff             npm:pi-input-history
```

### Skills（5 个）

```
code-review-expert   html-ppt   skill-forge
skill-review         wiki-ingest
```

### MCP Servers（3 个）

```
context7        文档检索（带 API Key）
codegraph       代码图索引（本地 stdio）
context-mode    FTS5 知识库 + 沙箱代码执行
```

## 按功能分类看

### 1. 通用基础能力

**`pi-mcp-adapter`** — 让 Pi 能接 MCP 生态。MCP（Model Context Protocol）本质上是「工具接口的通用协议」，装完这一个扩展，就能把任何 MCP Server 挂上来。它自己不做具体的事，但让 Pi 立刻获得几十上百种外部工具——本地代码图、云端文档索引、数据库、浏览器，都能通过它接入。

**`pi-web-access`** — 搜索 + 抓网页 + 抓 PDF + 视频理解。支持 OpenAI、Brave、Tavily、Exa、Firecrawl、Kagi、SearXNG 等十几种后端，通过 `web_search` / `fetch_content` / `source_check` 三个工具暴露出来。写作、调研、查资料时最常用。

**`pi-input-history`** — 跨会话的输入历史和反向模糊搜索。用过命令行 shell 就知道这个的价值——上一周敲过的复杂提示词不用再打字回忆。

**`@getpipher/vision`** — 视觉输入的能力感知层。当主模型是纯文本模型时，把图片路由到视觉模型分析；主模型本身是多模态时，图片直接透传，零中转。装完之后，我可以随手把截图、错误页截图扔给它，不用再手动调 API。

### 2. 检索与任务驱动

**`@ff-labs/pi-fff`** — 用 FFF 引擎替换 Pi 默认的 grep / find。`ffgrep` 是内容搜索，`fffind` 是文件名搜索，都带 frecency 排序（最近访问过的文件排前面），且都 git-aware。比 Pi 内置的默认搜索快不少，返回结果更贴合真实开发习惯——不用每次都在一堆 `.lock` / `node_modules` 里翻。

**`@narumitw/pi-goal`** — `/goal` 命令，把一个明确的目标交给 Pi 自主完成，带 `goal_complete` / `goal_blocked` / `goal_wait` 三个终止信号。用来跑那些「你跑完叫我一口气」的长任务最合适。

### 3. 上下文与知识

**`context-mode`** — 主打「省 98% 的上下文窗口」。核心思路是 `ctx_execute` / `ctx_execute_file`：让一段代码在沙箱里跑，只有 `console.log` 的输出进入上下文。我平时主要写 Qt / C++，分析一整个 widget 目录时就会跑：

```javascript
ctx_execute(language: "javascript", code: `
  const fs = require('fs');
  const path = require('path');
  const walk = d => fs.readdirSync(d, {withFileTypes:true}).flatMap(e =>
    e.isDirectory() ? walk(path.join(d,e.name)) :
    /\.(cpp|h|hpp)$/i.test(e.name) && !/moc_|ui_/.test(e.name) ? path.join(d,e.name) : []);
  const total = {loc:0, files:0};
  walk('src').forEach(f => {
    const loc = fs.readFileSync(f,'utf8').split('\n').length;
    total.loc += loc; total.files++;
  });
  console.log('files: ' + total.files + ', LoC: ' + total.loc);
`);
// 142 个 C++ 源文件、约 3 万行 → 输出一行汇总，而不是把 30 个 moc_*.cpp 全部读进上下文
```

配合 `ctx_index` / `ctx_search`（基于 FTS5），把大段文档索引进本地知识库，之后再按需检索。写这篇专栏时，我就是在用这个查资料。

**`@luxusai/pi-hindsight`** — 持久化记忆。它把长期事实和决策写进 Hindsight 服务端，跨会话调用。我用来记偏好、项目结构、跨项目工作流。跟 `context-mode` 的区别：`context-mode` 是「本会话/本项目的搜索索引」，`hindsight` 是「跨项目的用户/项目记忆」。

### 4. 主题与手感

**`@spences10/pi-themes`** — 主题包，主要修对比度和视觉层级。我当前用的是 `tokyo-night`。

**`@dietrichgebert/ponytail`** — 唯一一个「改变模型行为」的包。它的整个 SKILL.md 就是一套「懒高级开发」准则：能删就删、能用标准库就别自造、能一行就一行；遇到 bug 修根因不修症状；每段非必要代码都要留一个「为什么这里可以更懒」的钩子。装完之后，Pi 的默认输出会明显更短、更直接。

### 5. Skills（按需加载的能力说明）

Skills 是 Pi 里最轻量的扩展形式——一个文件夹，一份 `SKILL.md`，模型启动时只把名称和简介放进上下文，用到才读全文。我装了 5 个：

| Skill | 用途 |
| --- | --- |
| `code-review-expert` | 高级代码评审视角，SOLID / 安全 / 可行动改进建议 |
| `skill-forge` | 创建新 Skill 的专家流程 |
| `skill-review` | 审查已有 Skill 的质量 |
| `wiki-ingest` | 把文章/笔记编译进结构化 wiki |
| `html-ppt` | 生成 HTML 幻灯片 |

`skill-forge` 和 `skill-review` 是配套使用的：一个负责写，一个负责审。这两个 Skill 让我在 Pi 里能自己造轮子，而不是每次都去 GitHub 上找现成的。

## 周边项目：pi-web — Pi 的本地浏览器界面

pi-web 不算 Pi 插件（它不挂到 Pi 进程里，而是一个独立的 Next.js 服务），但因为它和 Pi 共用 `~/.pi/agent` 下的配置与 session 文件，用下来体验像是 Pi 的一部分。[官方仓库](https://github.com/agegr/pi-web)。

```bash
npx @agegr/pi-web@latest
# 服务就绪后自动打开浏览器，默认 http://127.0.0.1:30141
```

它的定位不是「Pi 的插件」，而是「Pi 的第二个前端」。Pi 本体跑在终端，pi-web 跑在浏览器，两边共用同一份会话。写这篇专栏的时候，我就是在浏览器里写 markdown，在终端里跑 `npm run dev`，两个窗口来回切。

### 主要能力

- **会话工作区**：按项目查找、继续、重命名、导出、删除会话，同时能看到运行状态、上下文占用、花费、压缩信息。Pi 本体里翻历史 session 要 `pi --continue` + 手动选，浏览器里一眼看得到。
- **两种分支方式**：**新会话**从较早的消息创建独立 session 文件；**从此处编辑**在当前 session 内开分支。这个区分很重要——想回溯一个错误的判断，选「新会话」；只是想换个方向继续聊，选「从此处编辑」。
- **项目文件工具**：浏览器内浏览/上传文件、看 Git Diff、预览源码/Markdown/图片/PDF/DOCX，文件变化自动刷新。写文档时不用再切一次到 VSCode 看效果。
- **Git worktree**：侧边栏直接切 checkout，同一个仓库不同 worktree 的 session 会归到一起。多分支开发时的会话不再散。
- **网页配置**：不离开浏览器就能管 Provider 登录 / API Key、模型、模型测试、插件包、Skill。Pi 终端里的 `/login` / `/models` / `pi install` 这些命令都有对应入口。
- **多语言**：英文、简中、繁中，首次打开跟随浏览器语言，也可手动切。

### 为什么值得用

Pi 本体是 TUI，很多操作（比如翻会话、看花费、看 Git Diff）都能做，但效率不如浏览器。pi-web 把 Pi 的「状态面」全部搬到了浏览器——**你在终端里干活，在浏览器里看全局**。写长文时尤其有用：markdown 源在浏览器里编辑和预览，代码修改在终端里做，两边同步。

### 安全边界

官方文档里写得很清楚：监听非环回地址等于「暴露一个能执行高权限操作的 Agent」。所以默认只监 `127.0.0.1`。如果要在局域网用：

```bash
PI_WEB_PASSWORD='足够长的随机密码' pi-web -H 0.0.0.0
```

但 Basic Auth 不加密传输中的密码，也不要把 Pi Web 用明文 HTTP 暴露到公网——需要公网访问时用可信的反向代理加 HTTPS，或者走 VPN，并把外部主机名加到 `PI_WEB_ALLOWED_HOSTS` 白名单。

### 和 Pi 插件的分工

pi-web 不提供新的工具，也不改变模型行为，它只解决一件事：**让 Pi 的状态可视化、可搜索、可多端协作**。插件是「给 Pi 加新能力」，pi-web 是「换一种方式看 Pi 现在的状态」。两者不重叠。

## 我为什么选这些

回头看这份清单，其实有几条隐含的原则：

1. **每个扩展都要解决一个具体痛点**。装 `pi-mcp-adapter` 是因为我想挂 MCP；装 `pi-web-access` 是因为我不想再手动 curl 抓网页；装 `@ff-labs/pi-fff` 是因为 Pi 默认搜索在大仓库里有点吃力；装 `ponytail` 是因为我受够了模型动辄给我写 500 行代码——每个都有明确的动机。

2. **避免同类重复**。上下文压缩只留 `context-mode`，记忆只留 `hindsight`，搜索只留 `pi-fff`——每类最多一个。同类扩展会互相争抢提示词和工具注册位。

3. **本地优先、少依赖云 API**。`codegraph`（本地代码图）、`context-mode`（本地 FTS5）、`hindsight`（本地服务）都优先在本地跑；只有真正需要外部数据时才走云端（`context7`、`pi-web-access`）。

4. **保留沙箱边界**。装 `@getpipher/vision`、`pi-web-access` 之前，我确认过它们只调用公开 API，不动本地凭据。任何需要读 auth.json 或系统 keychain 的扩展我都要先看代码。

## 关于权限管控

Pi 官方文档里明确写了一条警告：**Pi packages 拥有完整系统权限，扩展执行任意代码，Skill 可以指示模型执行任何操作（包括运行可执行文件）**。这是 Pi 的一个设计选择。

社区里也有专门的权限管控 / 沙箱扩展——给 Agent 套一层 Landlock / bubblewrap / seccomp 的限制，把它的文件和系统调用面收敛到白名单。我**没有装**。原因是我的场景比较单一——就在自己的个人项目上跑，不碰生产环境，也没有处理别人提供的敏感数据——至今没有碰到过问题。

如果你要在多用户机器、处理敏感项目、或者无人值守环境下跑 Pi，建议去 Pi Package Gallery 里看一下这类扩展，装上一个再放心用。

## 结语

这份清单里没有一个扩展是「因为流行」装的，都是「因为痛」装的。这也是我用 Pi 的方式：**内核保持最小，需要什么装什么，不用的删掉，装上的都要能被读源码审计**。

Pi 生态目前还在早期，扩展数量远不及 VSCode 或 Neovim（后两者不是 AI Agent，所以也没有 Skills 这个概念，只支持扩展）——但每一层都可以被用户直接理解：从 `pi-ai` 的 Provider 抽象，到 `pi-agent-core` 的循环，到某个扩展的 `extensions/*.ts`，都能追到底。

这个「可追到底」的特质，是我选它的根本原因。下一篇我想讲我为什么选 Hindsight 作为我的 Agent 记忆体，以及它把存储/检索/推理拆开的内部逻辑。
