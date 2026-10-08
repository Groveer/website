# 优秀插件：本地实测的 Pi 扩展

## 前言

Pi 本体足够克制——只有 4 个默认工具、一份精简系统提示词。它真正的扩展性来自四类资源：**Extensions**（TypeScript 扩展，加工具/命令/事件/UI）、**Skills**（按需加载的能力说明）、**Prompt Templates**（可复用提示词）、**Themes**（终端主题）。

这篇文章不讲 Pi 生态有多大，只讲本机真正跑起来的组合——它们解决什么问题、值不值得装、彼此之间是怎么配合的。

## 安装清单

当前 `~/.pi/agent/settings.json` 里实际启用的东西：

### Pi Packages（13 个）

```
npm:@luxusai/pi-hindsight          npm:@rahularya01/pi-lazy
npm:pi-web-access                  npm:pi-lens
npm:@spences10/pi-themes           npm:@plannotator/pi-extension
npm:@dietrichgebert/ponytail       npm:pi-ssh-remote
npm:@getpipher/vision              npm:@juicesharp/rpiv-todo
npm:@ff-labs/pi-fff                npm:@juicesharp/rpiv-ask-user-question
npm:pi-input-history
```

### 内建扩展（无需安装）

```
codemode        把工具调用写成脚本，只有脚本输出进上下文
ls              目录列表工具
mcp             MCP 客户端（原生，替代了早期的 pi-mcp-adapter）
tool-search     按需检索未声明的工具
```

### Skills（9 个）

```
code-review-expert   deepin-review-report   deepin-styleguide
git-commit           html-ppt               skill-forge
skill-review         systematic-debugging   wiki-ingest
```

### MCP Servers（2 个）

```
context7        文档检索（HTTP，带 API Key）
codegraph       代码图索引（本地 stdio）
```

两个 server 都走 `codemode` 暴露，所以系统提示词里只占一段摘要，MCP 工具的完整 schema 一个都不占位。这套机制单独写了一篇：[Codemode：把工具调用写成脚本](./codemode)。

## 按功能分类看

### 1. 加载与基础能力

**`@rahularya01/pi-lazy`** — LazyVim 风格的扩展管理器，也是这份清单能变长的前提。所有包照常安装，但只有真正用到的才付启动成本：其余的等到某个 slash 命令、工具调用或关键词出现时再加载。配置在 `~/.pi/agent/lazy.json`，每个 spec 可以声明 `cmd` / `tools` / `keywords` 三条触发路径。

它带来两个直接变化：**启动更快**，以及**给模型的工具列表更短**。当前的默认工具只有 `read / bash / edit / write / ls / codemode`，`web_search`、`ffgrep`、`lens_*` 这些都在被触发时才出现。

**`pi-web-access`** — 搜索 + 抓网页 + 抓 PDF + 视频理解。支持 OpenAI、Brave、Tavily、Exa、Firecrawl、Kagi、SearXNG 等十几种后端，通过 `web_search` / `fetch_content` / `get_search_content` 三个工具暴露。写作、调研、查资料时最常用，由 `lazy.json` 按 `web search` / `fetch url` 等关键词触发。

**`pi-input-history`** — 跨会话的输入历史和反向模糊搜索。用过命令行 shell 就知道这个的价值——上一周敲过的复杂提示词不用再打字回忆。这个包是 `lazy: "after-start"`，启动后加载。

**`@getpipher/vision`** — 视觉输入的能力感知层。当主模型是纯文本模型时，把图片路由到视觉模型分析；主模型本身是多模态时，图片直接透传，零中转。配置在 `~/.pi/agent/vision.json`：当前用 `sensenova-flash` 做视觉兜底，带 256 条缓存和审计日志。装完之后，截图、错误页截图可以随手交给它，不用手动调 API。粘贴/拖入图片现在由 Pi 本体直接处理，不再需要额外的附件插件。

### 2. 检索与代码智能

**`@ff-labs/pi-fff`** — 用 FFF 引擎替换 Pi 默认的 grep / find。`ffgrep` 是内容搜索，`fffind` 是文件名搜索，都带 frecency 排序（最近访问过的文件排前面），且都 git-aware。比 Pi 内置的默认搜索快不少，返回结果更贴合真实开发习惯——不用每次都在一堆 `.lock` / `node_modules` 里翻。

**`pi-lens`** — 这份清单里最「重」的一个包，但值。它把 LSP 诊断、语言相关 linter / 类型检查、ast-grep 与 tree-sitter 结构规则、格式化/自动修复、符号检索整合成一层实时反馈：

- 写/改文件时自动跑诊断，并做「影响级联」（把受影响的相关文件一起检查）；
- 暴露一组给模型用的工具：`lsp_navigation`（跳转/引用）、`lens_diagnostics`、`symbol_search`（常温水位的词索引）、`module_report`、`read_symbol`、`ast_grep_search` / `ast_grep_replace` / `ast_grep_outline`；
- `lens_diagnostic_mark` 允许把某条诊断标记成误报/抑制/延后/待修，并让所有界面统一尊重这个标记；
- `/lens-map` 生成交互式 HTML 依赖图，`/lens-health` 看运行时健康度。

它替代了早先「用 grep 找符号、靠模型自己拼调用链」的做法——`symbol_search → module_report → read_symbol` 这条发现漏斗，比让模型反复读文件省得多。

**`codegraph`（MCP）** — 仓库级的代码图索引。`codegraph_explore` 一次调用就返回相关符号的**逐字源码**（按文件分组）和它们之间的调用路径，官方定位是「大多数问题只需要这一个调用」。它和 `pi-lens` 分工不同：`pi-lens` 是文件级、编辑时实时的 LSP 反馈，`codegraph` 是仓库级、问答式的一次性深挖。

**`plannotator`** — 把「计划」做成文件，再用浏览器 UI 审阅、批注、批准。它补上了 Pi 里很关键的一环：**在模型动手改代码之前，先让它把方案写出来供审阅**。包含 plan mode、消息批注、以及代码/PR review 三个动作用途（`/plannotator-plan-mode` 等命令）。

### 3. 任务驱动与交互

**`@juicesharp/rpiv-todo`** — 给模型一个 `todo` 工具，渲染成一个实时叠加层，`/reload` 和对话压缩之后仍然保留。长任务里能一眼看到「还剩几步」,比让模型在正文里写 `[ ]` 清单可靠得多。

**`@juicesharp/rpiv-ask-user-question`** — 一个结构化的问答工具：模型在「本来只能猜」的时候，可以抛出一道带类型选项的题，而不是把猜测写进代码。对多分支、多方案的选择题尤其有用。

**`@dietrichgebert/ponytail`** — 唯一一个「改变模型行为」的包。它的整个 SKILL.md 就是一套「懒高级开发」准则：能删就删、能用标准库就别自造、能一行就一行；遇到 bug 修根因不修症状；每段非必要代码都要留一个「为什么这里可以更懒」的钩子。装完之后，Pi 的默认输出会明显更短、更直接。

### 4. 上下文与知识

**`codemode`（内建）** — 这篇文章清单里唯一一个「不用装」的能力，也是删掉 `context-mode` 的直接原因。模型写一段 JavaScript，在 QuickJS 沙箱里通过 `tools.<name>()` 调用 Pi 的其他工具，用 `Promise.allSettled` 并行、过滤、聚合，**只有脚本的输出回到上下文**。它同时是 MCP 工具的默认暴露层：MCP 工具既不声明给模型，也不占 `codemode` 的描述，只在脚本里按需查找。完整分析见 [Codemode 那一篇](./codemode)。

**`@luxusai/pi-hindsight`** — 持久化记忆。它把长期事实和决策写进 Hindsight 服务端，跨会话调用。用来记偏好、项目结构、跨项目工作流。跟 `codemode`/`pi-web-access` 的区别：那些是「本会话 / 本次检索的上下文」,`hindsight` 是「跨项目的用户 / 项目记忆」。设计逻辑单独写了一篇：[Hindsight](./hindsight)。

### 5. 远程与手感

**`pi-ssh-remote`** — 连接远程机器之后，Pi 的 `read / write / edit / bash` 自动路由到远端，cwd 也可以持久切换。模型不需要把每个动作包成 `ssh ...`，也不用在「本地 shell」和「远程 shell」之间来回推理。跑在 GPU 服务器或构建机上的任务，体验像本地项目。

**`@spences10/pi-themes`** — 主题包，主要修对比度和视觉层级。当前用的是 `tokyo-night`。

### 6. Skills（按需加载的能力说明）

Skills 是 Pi 里最轻量的扩展形式——一个文件夹，一份 `SKILL.md`，模型启动时只把名称和简介放进上下文，用到才读全文。当前装了 9 个：

| Skill | 用途 |
| --- | --- |
| `code-review-expert` | 高级代码评审视角，SOLID / 安全 / 可行动改进建议 |
| `deepin-review-report` | 生成 Deepin/UOS 代码走查的 xlsx + ppt 交付物 |
| `deepin-styleguide` | Deepin 开源项目风格指南（C / Qt / Go） |
| `git-commit` | 符合公司规范的提交工作流 |
| `html-ppt` | 生成 HTML 幻灯片 |
| `skill-forge` | 创建新 Skill 的专家流程 |
| `skill-review` | 审查已有 Skill 的质量 |
| `systematic-debugging` | 遇到 bug / 测试失败时的系统化定位流程 |
| `wiki-ingest` | 把文章/笔记编译进结构化 wiki |

这些不只是「通用能力」——`deepin-*`、`git-commit` 都是日常工作流的一部分。`skill-forge` 和 `skill-review` 是配套使用的：一个负责写，一个负责审。这套组合可以在 Pi 里自己造工具，而不是每次都去 GitHub 上找现成的。

## 周边项目：pi-web — Pi 的本地浏览器界面

pi-web 不算 Pi 插件（它不挂到 Pi 进程里，而是一个独立的 Next.js 服务），但因为它和 Pi 共用 `~/.pi/agent` 下的配置与 session 文件，用下来体验像是 Pi 的一部分。[官方仓库](https://github.com/agegr/pi-web)。

```bash
npx @agegr/pi-web@latest
# 服务就绪后自动打开浏览器，默认 http://127.0.0.1:30141
```

它的定位不是「Pi 的插件」，而是「Pi 的第二个前端」。Pi 本体跑在终端，pi-web 跑在浏览器，两边共用同一份会话。写这篇专栏的时候，就是在浏览器里写 markdown，在终端里跑 `npm run dev`，两个窗口来回切。

### 主要能力

- **会话工作区**：按项目查找、继续、重命名、导出、删除会话，同时能看到运行状态、上下文占用、花费、压缩信息。Pi 本体里翻历史 session 要 `pi --continue` + 手动选，浏览器里一眼看得到。
- **两种分支方式**：**新会话**从较早的消息创建独立 session 文件；**从此处编辑**在当前 session 内开分支。这个区分很重要——想回溯一个错误的判断，选「新会话」；只是想换个方向继续聊，选「从此处编辑」。
- **项目文件工具**：浏览器内浏览/上传文件、看 Git Diff、预览源码/Markdown/图片/PDF/DOCX，文件变化自动刷新。写文档时不用再切一次到 VSCode 看效果。
- **Git worktree**：侧边栏直接切 checkout，同一个仓库不同 worktree 的 session 会归到一起。多分支开发时的会话不再散。
- **网页配置**：不离开浏览器就能管 Provider 登录 / API Key、模型、模型测试、插件包、Skill。Pi 终端里的 `/login` / `/models` / `pi install` 这些命令都有对应入口。
- **多语言**：英文、简中、繁中，首次打开跟随浏览器语言，也可手动切。

### 为什么值得用

Pi 本体是 TUI，很多操作（比如翻会话、看花费、看 Git Diff）都能做，但效率不如浏览器。pi-web 把 Pi 的「状态面」全部搬到了浏览器——**在终端里干活，在浏览器里看全局**。写长文时尤其有用：markdown 源在浏览器里编辑和预览，代码修改在终端里做，两边同步。

### 安全边界

官方文档里写得很清楚：监听非环回地址等于「暴露一个能执行高权限操作的 Agent」。所以默认只监 `127.0.0.1`。如果要在局域网用：

```bash
PI_WEB_PASSWORD='足够长的随机密码' pi-web -H 0.0.0.0
```

但 Basic Auth 不加密传输中的密码，也不要把 Pi Web 用明文 HTTP 暴露到公网——需要公网访问时用可信的反向代理加 HTTPS，或者走 VPN，并把外部主机名加到 `PI_WEB_ALLOWED_HOSTS` 白名单。

### 和 Pi 插件的分工

pi-web 不提供新的工具，也不改变模型行为，它只解决一件事：**让 Pi 的状态可视化、可搜索、可多端协作**。插件是「给 Pi 加新能力」，pi-web 是「换一种方式看 Pi 现在的状态」。两者不重叠。

## 选型原则

回头看这份清单，其实有几条隐含的原则：

1. **每个扩展都要解决一个具体痛点，而且优先用内建的**。装 `pi-lazy` 是因为包多了启动变慢、工具列表变长；装 `pi-lens` 是因为需要在写代码时立刻拿到诊断。反过来，能由 Pi 本体覆盖的能力就不必再挂一个包——`codemode` 顶掉了 `context-mode`，新版 Pi 原生支持图片粘贴之后，附件插件也直接移除了。同一个能力，少一个包、少一个进程、少一组常驻工具。

2. **避免同类重复**。上下文压缩只留 `codemode`，记忆只留 `hindsight`，文件搜索只留 `pi-fff`，代码结构只留 `pi-lens`（文件级）+ `codegraph`（仓库级）——每类最多一到两个，且职责边界清晰。同类扩展会互相争抢提示词和工具注册位。

3. **本地优先、少依赖云 API**。`codegraph`（本地代码图）、`hindsight`（本地服务）、`pi-lens`（本地 LSP / ast-grep）都优先在本地跑；只有真正需要外部数据时才走云端（`context7`、`pi-web-access`、`vision` 的兜底模型）。

4. **延迟加载是默认姿势**。13 个包里，只有 `history`、`hindsight`、`ponytail` 是启动后自动加载，其余全部 `lazy`。装得多不等于每轮都付成本——这正好和 `codemode` 的「延迟暴露 MCP 工具」是同一个思路。

5. **保留沙箱边界**。装 `@getpipher/vision`、`pi-web-access` 之前，已确认它们只调用公开 API，不动本地凭据。任何需要读 auth.json 或系统 keychain 的扩展，都要先看代码。

> 顺带说一句：`~/.pi/agent/npm/package.json` 里还留着一个 `@narumitw/pi-lsp`，但它既不在 `settings.json` 的 `packages` 里，也不在 `lazy.json` 的 specs 里——`pi-lens` 已经包含了 LSP 能力，它是历史遗留，下次清理时删掉。

## 关于权限管控

Pi 官方文档里明确写了一条警告：**Pi packages 拥有完整系统权限，扩展执行任意代码，Skill 可以指示模型执行任何操作（包括运行可执行文件）**。这是 Pi 的一个设计选择。

社区里也有专门的权限管控 / 沙箱扩展——给 Agent 套一层 Landlock / bubblewrap / seccomp 的限制，把它的文件和系统调用面收敛到白名单。这里**没有装**。原因是使用场景比较单一——只在个人项目上跑，不碰生产环境，也没有处理别人提供的敏感数据——至今没有碰到过问题。

如果要在多用户机器、处理敏感项目、或者无人值守环境下跑 Pi，建议去 Pi Package Gallery 里看一下这类扩展，装上一个再放心用。

## 结语

这份清单里没有一个扩展是「因为流行」装的，都是「因为痛」装的。这也是这里使用 Pi 的方式：**内核保持最小，需要什么装什么，不用的删掉，装上的都要能被读源码审计**。

Pi 生态目前还在早期，扩展数量远不及 VSCode 或 Neovim（后两者不是 AI Agent，所以也没有 Skills 这个概念，只支持扩展）——但每一层都可以被用户直接理解：从 `pi-ai` 的 Provider 抽象，到 `pi-agent-core` 的循环，到某个扩展的 `extensions/*.ts`，都能追到底。

这个「可追到底」的特质，是选择它的根本原因。下一篇单独讲为什么用 `codemode` 替掉了 `context-mode`——同一件事，为什么内建版本反而更彻底。
