# Hindsight：为什么我选它作为 Agent 记忆体

## 前言

Pi 本体足够克制，装了几个扩展之后能力已经很够用，但一直缺一块——**跨会话的记忆**。

每次开新 session 都是从零开始。上周做的决定、上周踩的坑、上周确认过的偏好，模型都不知道。要么反复告诉它（累），要么让它每次都从代码里重新推断（贵），要么干脆接受「每次都是一次性的」（爽但浪费）。

我最后选的是 `@luxusai/pi-hindsight`。它不是最强的记忆系统，也没有铺天盖地的宣传，但它在几个我特别在意的地方做得比我预期的克制。这篇文章讲讲它的设计逻辑，以及我为什么选它作为我这个 Agent 的记忆体。

## Hindsight 是什么

先说清楚边界：

- **Hindsight** 是一个独立的记忆服务（本地可自托管，也有 Cloud），核心仓库 [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)。
- **pi-hindsight** 是 Pi 的一个扩展包，把 Hindsight 挂进 Pi 会话，暴露一组 `hindsight_*` 工具给模型用。

也就是说，**Hindsight 是记忆后端，pi-hindsight 只是它的 Pi 客户端**。换到别的 Agent（Claude Code、Gemini CLI、Cline）用，只要那个 Agent 支持 MCP，Hindsight 的 MCP 端点照样能用。这是我选它的一个原因——**记忆和 Harness 解耦**。

## 设计逻辑：把存储、检索、推理拆开

Hindsight 的核心一句话是：**Retain 存，Recall 取，Reflect 想**。三个动词对应三个动作，边界清晰：

```
Retain   = 存储记忆（写入原材料）
Recall   = 检索记忆（拿到候选，不是答案）
Reflect  = 分析记忆（Agent 化的推理）
```

大多数记忆系统把这三件事混在一起——存的时候顺手总结一下、查的时候直接给答案、更新的时候重写历史记录。Hindsight 的做法是三层分离，代价是心智负担稍高，收益是每一层都能单独优化。

### 核心概念

Hindsight 有六个核心概念，我用一句话概括每个：

| 概念 | 一句话 |
| --- | --- |
| **Memory Bank** | 隔离的记忆命名空间，用来防泄漏 |
| **Retain** | 存「原始材料」，让系统自己抽取事实 |
| **Recall** | 取候选，不是最终答案 |
| **Reflect** | 针对一个具体问题，在记忆上跑一次 Agent 分析 |
| **Observations** | 通过重复证据自动沉淀出的事实 |
| **Mental Models** | 针对高频重复问题的可复用综合答案 |

其中 Observations 和 Mental Models 是最容易被混淆的一对，官方文档里用了个「brutal distinction」：

```
Observations  = 从重复中提炼出的事实
Mental Models = 基于这些事实构建出的答案
```

Observations 是「反复出现所以大概率是真的」，比如「这个用户一直偏好简洁的工具选型」；Mental Models 是「经常会被问、值得直接注入的结论」，比如「项目 X 的架构约定」。前者是 Hindsight 自己生成的，后者通常需要人手动创建或 Agent 建议后由人确认。

### 数据流

一次完整的记忆生命周期大致是：

```
  ┌────────────────────────────────────────────────┐
  │         一轮对话 / 一个 session 结束             │
  └────────────────────────────────────────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │  Retain   │  ← 把原始对话内容写入
                    └───────────┘
                          │
                          ▼
                    ┌───────────┐
                    │  Extract  │  ← 服务端抽取事实/实体/关系
                    └───────────┘
                          │
                          ▼
                    ┌───────────┐
                    │Observation│  ← 重复证据 → 沉淀成信念
                    └───────────┘
                          │
                          ▼
                    ┌───────────┐
                    │Mental MM  │  ← 可复用的稳定答案（人/AI 手动）
                    └───────────┘

  ─────────── 下一次会话 ───────────

  Prompt 到达
       │
       ▼
  ┌───────────┐
  │  Recall   │  ← 取候选（不是答案）
  └───────────┘
       │
       ▼
  需要更深推理？
    ├── 否 → 直接用检索到的上下文回答
    └── 是 → Reflect → 合成答案
```

关键点是 **Retain 存的是原材料**，不是预总结的结论。这一点下面会细说。

## 为什么我选它

### 1. 安全默认比大多数记忆系统克制

Hindsight 的默认策略是「最小信任」：

- **Retain 默认只写项目 Bank**。User Bank（跨项目记忆）必须显式 opt-in。
- **Recall 是瞬时的**，不写回 session transcript。卸载扩展不会让历史 recall 块变成普通提示词。
- **自动 retain 会先脱敏**常见的密钥（token、私钥、password 等）。
- **精确删除需要三重确认**：精确 bank ID + 精确 document ID + `confirm: true`。

这一点我觉得非常重要。绝大多数 Agent 记忆系统（尤其是早期项目）默认把「用户说过什么」直接写进全局记忆。用久了会出问题：上周随口抱怨的临时想法、测试用的假数据、跟另一个项目混淆的偏好，都会变成「事实」被后续会话反复引用。

Hindsight 的做法是 **Project Bank 强隔离**，User Bank 明确 opt-in，并且 User Bank 的写入只走显式工具（`hindsight_retain_global`），永远不会自动。ADR-004 专门讨论过「要不要自动路由到 User Bank」这个问题，最后决定把启发式路由整个删掉——「一个无法解释的启发式分类器自动做 User Bank 写入，正是这个 ADR 一直在担心的静默污染风险」。

### 2. 三个动作清晰分层，不糊作一团

再重复一遍：**Retain / Recall / Reflect**。

这个分层让我在用的时候能清晰判断「这一步该调哪个」。举例：

- 刚结束一个复杂讨论，想让它记住 → `Retain`
- 想问「上周我们为什么选了方案 A 而不是 B」 → `Recall` + `Reflect`
- 想让它记住一条明确的偏好「以后都用 pnpm 不用 npm」 → `Retain` 一次，然后让它沉淀成 Observation

如果这三个动词被混成「记忆一下 / 想起来一下」，很快就会出现「模型记住了一条临时状态当成永久事实」的情况。Hindsight 强制你把「存」「查」「想」分成三次操作，代价是命令行多一点，收益是记忆污染的风险低得多。

### 3. 记忆和 Harness 解耦

这一点前面提过，值得再说一遍。Hindsight 是个独立服务（本地或 Cloud），Pi 只是一个客户端。这意味着：

- 换成 Claude Code / Gemini CLI / Cline / Cursor 之类的其他 Agent，Hindsight 的记忆还是同一份，不用迁移。
- Hindsight 的 MCP 端点也可以给其他 MCP 客户端直接用。
- Pi 升级、重装、换模型 Provider，都不影响记忆。

我现在的配置里，Pi 用 `pi-hindsight` 扩展访问 Hindsight 服务端；pi-web（浏览器 UI）通过读同一份 session 记录能看到 pi-hindsight 的操作痕迹。如果哪天我不想用 Pi 了，Hindsight 的记忆不用重新建。

### 4. Bank / Tag 两级隔离

Hindsight 用 **Bank** 做硬隔离，用 **Tag** 做软过滤：

- Bank：跨用户、跨项目、跨工作/个人场景的硬墙。不同 Bank 之间不能互相 recall。
- Tag：同一 Bank 内部的软过滤（`project:xxx`、`user:xxx`、`source:pi` 等）。

我当前的配置（`~/.pi/agent/hindsight.json`）：

```json
{
  "agentUse": "coding",
  "scope": {
    "mode": "domain-tagged",
    "projectIdStrategy": "remote"
  },
  "banks": {
    "project": { "enabled": true, "bankId": "pi-coding", "derive": "manual" },
    "user":    { "enabled": true, "bankId": "pi-user" }
  }
}
```

两个 Bank：`pi-coding` 放代码相关记忆，`pi-user` 放跨项目偏好。project tag 通过 `projectIdStrategy: "remote"` 从 git remote 推导，机器迁移也不会失效（ADR-005 明确把「路径 hash 做 project ID」判为「不透明、脆弱」）。

### 5. 记忆可以被治理，不是黑盒

Hindsight 通过 `/hindsight` 命令暴露一组工具，让我能：

- 看当前 bank 状态、memory profile、召回预算
- 查看已注册的 Mental Models 列表和内容
- 修改 Bank 的 Mission（retain / observations / reflect 三个字符串，告诉系统「该抽什么、该忽略什么」）
- 显式创建 / 刷新 / 删除 Mental Model（**dry-run 优先**）
- 导出全部 bank 内容做备份

Mission 这个概念特别重要。Hindsight 允许你给每个 Bank 写三个字符串：

```
retain       →  抽取/忽略什么（"抓决策和 trade-off，忽略闲聊和 secrets"）
observations →  沉淀什么样的持久模式（"稳定的架构约定，不要今天的 TODO"）
reflect      →  合成时的角色人设（"这个 repo 的资深开发者"）
```

官方文档里有一句挺直白的评价：**"Missions 引导抽取/沉淀/推理——模糊的 mission 会导致噪声记忆，这是 Hindsight #1 的质量失败源"**。换句话说，Mission 是记忆的「宪法」，你写清楚了记忆就干净，写糊了整条链路都是噪声。

而且修改 Mission 和 Mental Model 都是 **dry-run 优先**——Agent 只能建议，不能静默改。这一点对我很有用：我不希望有一天 Agent 突然改了 Bank 的 Mission，把「抓架构决策」改成「抓一切」，然后我的记忆库被临时状态污染。

### 6. 明确的「不做什么」

Hindsight 官方文档里有一整个「Risky Memory Modes」页面，列清楚**故意没做**的功能，理由写得很清楚：

- **不持久化 recall 到 session transcript**。风险：卸载扩展会让历史 recall 块变成普通提示词，或者被再次 retain 回 Hindsight 造成「记忆回声」。
- **不做 Provider Recall Cache**。风险：跨轮次复用上一轮的召回结果，会引入陈旧或错误上下文。
- **不做基于 prompt 标签的过滤**。风险：给用户虚假的「精确控制」感，实际召回质量下降。

「不做」比「做了」更能体现一个记忆系统的成熟度。绝大多数早期项目都想把功能做全，Hindsight 反过来——**一个让记忆更难以推理的功能，除非有明确用例和可测试设计，否则不加**。

## 我踩过的两个坑

### 坑 1：默认 Mission 抓不准

第一次接入 Hindsight 时，我用的是默认的 retain mission。结果 recall 里全是「用户问了 XXX」这种流水账，抓不到「我们决定用 XXX 方案，因为 YYY」这种真正的决策。

后来手动改了一次 mission，把明确的事实类型和忽略列表写清楚，噪声立刻下降了一个数量级。这一条印证了文档里说的「模糊 mission 是 Hindsight #1 的质量失败源」——不是说 mission 不重要，是**它比你想象的重要**。

### 坑 2：把 Observation 当 Mental Model 用

早期我试图用 Observation 来承载「我的偏好是 XXX」这种稳定结论。结果 Observation 会不断被后续证据更新，有时候出现「上条说用 pnpm，这条又说用 npm」的矛盾。

后来理解了 Observation 和 Mental Model 的区别——**Observation 是「反复出现的所以大概率是真的」，Mental Model 是「值得直接注入的稳定结论」**——就把跨项目偏好手动写成一条 Mental Model，让 Observation 只保留重复证据。矛盾立即消失。

## 我的当前配置一览

```json
{
  "agentUse": "coding",
  "scope": {
    "mode": "domain-tagged",
    "projectIdStrategy": "remote",
    "includeSharedObservations": false
  },
  "banks": {
    "project": { "enabled": true, "bankId": "pi-coding" },
    "user":    { "enabled": true, "bankId": "pi-user" }
  }
}
```

- `domain-tagged`：跨仓库共享一个 coding bank，用 `project:<id>` tag 做软隔离。ADR-005 的方向。
- `projectIdStrategy: remote`：project ID 从 git remote 推导，避免本地路径变化导致记忆断裂。
- `includeSharedObservations: false`：不引入无 tag 的「共享」observation，严格隔离。
- Project + User 双 bank：代码相关写 `pi-coding`，跨项目偏好写 `pi-user`（**必须显式**调用 `hindsight_retain_global`，不自动）。

## 结语

写这篇文章的过程中，我发现 Hindsight 的核心哲学其实是**「记忆是慢的」**——不像 prompt 一样即时代谢，而是需要时间沉淀。Retain 存的是原始材料，Observation 需要重复证据才能浮现，Mental Model 需要人确认才注入。这套流程比「记住一切」慢，也比「记住一切」更可控。

我不确定这套设计是不是最终答案。但至少在我目前的使用频率下（一天几个 session、几个项目、跨周的工作流），它比「全塞进 prompt」省 Token，比「每次从零开始」省思考，比「一个通用记忆库」省治理成本。
