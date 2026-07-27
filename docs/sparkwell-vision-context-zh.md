# SparkWell：问题、方法与长期愿景

## 一页总结

SparkWell 是一个探索 AI 时代软件工程的新协作模型的项目。

它关注的问题不是「如何生成更多代码」，而是「当 AI 已经能够快速生成代码之后，人类和 AI 应该围绕什么长期协作」。

SparkWell 提出的核心假设是：

1. 软件应该拥有独立于实现、能够长期演化的设计层（Spark）。
2. 人类应该首先 Review 软件设计，而不是只 Review 实现。
3. 一个 Spark 可以成为多个 Engineering Artifacts（代码、测试、文档、图表、不同平台实现）的共同设计来源。
4. 软件演化应首先发生在设计层，再传播到不同 Realizations。
5. 这些假设需要通过真实项目持续验证，而不是预先假定正确。

---
> 本文档保存 SparkWell 的稳定思想背景，帮助后续的人或 Coding Agent 理解它为什么存在、希望解决什么问题、核心方法和长期方向是什么。可变的实现状态与近期验证重点维护在 [当前状态与 Roadmap](status-and-roadmap-zh.md) 中。
>
> 本文档不是实现架构，不定义具体文件格式、CLI、插件结构、数据结构或代码组织方式。它描述的是：**问题、目标、方法、边界、工作流、关键能力、产品方向、阶段性任务和仍待验证的问题。**

---

# 1. SparkWell 是什么

SparkWell 是一次对 **AI 时代软件工程协作模型** 的重新探索。

它关注的核心问题不是：

> 如何让 AI 生成更多代码？

而是：

> 当 AI 已经可以快速生成大量实现时，人类和 AI 应该围绕什么进行长期协作？

传统软件工程以源代码为中心。需求、讨论、设计和决策最终通常都会压缩进代码，或者散落在会议、聊天、Issue、文档和个人记忆中。

在 AI Coding 环境里，这种模式的问题被进一步放大：

- AI 可以极快地产生大量实现；
- 但人类理解和审查实现的速度没有同步提高；
- Agent 会话中的背景和设计判断很容易丢失；
- 新 Agent 往往只能重新从代码中推断系统意图；
- 多个平台、测试、文档和图表可能分别生成，却缺少共同的设计来源；
- 软件可以越来越快地被生成，却不一定越来越容易被理解和长期维护。

SparkWell 的核心探索是：

> 是否可以让软件拥有一个比实现更持久、更容易审查、更适合人与 AI 共同理解的设计层？

这个设计层由 **Spark** 构成。

---

# 2. 我们想解决的问题

## 2.1 AI 上下文丢失

今天大量重要的软件决策发生在与 AI 的对话中，例如：

- 为什么选择某种边界；
- 某个概念应该属于哪个模块；
- 为什么没有采用另一种设计；
- 哪些行为必须长期保持；
- 哪些只是当前实现的偶然结果；
- 某个功能以后应该如何演化；
- 某些限制是产品要求、平台要求还是临时妥协。

这些信息通常不会自然进入代码。

当会话结束、上下文窗口被清空、开发者换设备、换 Agent 或换工具后，后续参与者只能重新读取代码，尝试猜测原始意图。

SparkWell 希望把软件意图从一次性的对话中提取出来，形成可长期存在、可演化、可审查的项目资产。

## 2.2 代码生成速度远高于人工审查速度

传统开发中，人写代码，人审代码，产出速度和审查速度相对接近。

AI Coding 改变了这个比例：

```text
Requirement
    ↓
Agent
    ↓
Thousands of lines of code
    ↓
Human review
```

AI 可以在很短时间内修改大量文件，但人类仍然需要逐行理解：

- 代码做了什么；
- 是否遗漏需求；
- 是否破坏既有边界；
- 是否引入重复概念；
- 是否让架构逐渐漂移；
- 多个平台是否保持一致。

仅依赖代码级审查，越来越难扩展。

SparkWell 并不主张完全停止审查代码，而是希望把主要的人类决策前移：

```text
Requirement
    ↓
Spark design
    ↓
Human review
    ↓
Engineering artifacts
```

人首先审查软件设计和意图，之后再根据风险和需要下钻到具体实现。

## 2.3 软件意图逐渐被实现细节淹没

AI 很擅长回答“How”：

- 用什么框架；
- 调哪个 API；
- 创建哪些文件；
- 如何组织状态；
- 如何编写测试；
- 如何完成当前任务。

但长期维护更依赖“Why”和“What”：

- 这个概念为什么存在；
- 它拥有什么责任；
- 它的边界在哪里；
- 哪些行为是产品意图；
- 它和其他概念是什么关系；
- 哪些约束必须跨平台保留；
- 哪些实现可以替换而不影响设计。

当这些信息没有显式保存时，系统会逐渐只剩下实现，而失去可恢复的软件意图。

## 2.4 架构和概念边界漂移

在持续 AI 生成中，一个常见风险是每次任务都局部合理，但整体逐渐失控：

- 新功能绕过已有概念；
- 相似责任被放入不同模块；
- 一个概念被拆得过碎；
- 一个大型模块不断吸收不相关能力；
- Agent 根据当前代码形状，而不是软件意图继续扩展系统；
- Web、Windows、iOS 或后端逐渐形成不同概念模型。

SparkWell 希望通过长期存在的概念定义，让 Agent 和人类在每次变化时先判断：

- 这是已有概念的演化，还是新概念；
- 谁拥有这个行为；
- 是否需要拆分或组合；
- 哪些关系应该改变；
- 哪些平台只是不同实现，而不应产生不同的软件意图。

## 2.5 多种 Engineering Artifacts 缺少共同来源

现代软件不只有源码。

同一个软件概念通常需要对应多个 Engineering Artifacts，例如：

- Web 实现；
- Windows 实现；
- iOS 或 Android 实现；
- 后端服务；
- 自动化测试；
- API Specification；
- 用户文档；
- 架构图；
- 数据流图；
- 状态图；
- 交互说明；
- 示例和测试数据。

这些 Artifacts 本质上都在表达同一个软件概念，但现实中它们通常分别维护：

- 不同团队分别负责不同平台；
- 测试独立编写；
- 文档和图表独立维护；
- API Specification 与实现分别演化。

随着项目演化，它们很容易逐渐偏离：

- 文档落后于实现；
- 图表不再反映真实系统；
- 不同平台产生不同的软件行为；
- 测试遗漏新的设计约束。

SparkWell 的一个核心假设是：

> Code、Tests、Documentation、Diagrams 等并不是彼此独立的软件资产，而是同一个软件概念（Spark）的不同 Realizations。

因此，SparkWell 探索是否可以让 Spark 成为这些 Engineering Artifacts 共同、长期存在的设计来源。

不同 Artifacts 可以采用完全不同的技术和实现方式，但它们应共同表达同一个软件意图。

## 2.6 软件演化缺少稳定的中间层

一次性生成一个应用并不难。

真正困难的是长期演化：

```text
Initial requirement
    ↓
Initial implementation
    ↓
New requirement
    ↓
Modify existing system safely
```

没有稳定设计层时，新需求通常直接进入代码修改。Agent 必须重新理解全部上下文，然后决定改哪些地方。

SparkWell 希望建立更清晰的演化路径：

```text
New requirement
    ↓
Identify affected software concepts
    ↓
Evolve affected Sparks
    ↓
Review Spark changes
    ↓
Analyze artifact impact
    ↓
Update realizations
```

真正能证明 SparkWell 价值的，不是第一次生成 Todo App，而是后续需求变化时，能否更清晰、更可控地同步演化多个平台和多个 artifact。

## 2.7 人类越来越难形成系统级理解

源码目录、类、函数和依赖适合实现，但不一定适合人类快速理解整个软件。

开发者通常需要在脑中重建：

- 主要概念；
- 概念关系；
- 业务流程；
- 状态变化；
- 数据流；
- 跨平台差异；
- 某次改动的影响范围。

SparkWell 的长期目标之一，是把这些理解从人的短期记忆中外化出来，让软件本身更容易被探索。

---

# 3. 核心判断：问题是真实的，Spark 是待验证的答案

我们对以下问题具有较高信心：

- AI Coding 会持续提升实现生成速度；
- 上下文丢失是真实问题；
- 人工代码审查难以按相同速度扩展；
- 设计意图比实现细节更容易丢失；
- 多平台和多 artifact 容易漂移；
- 软件长期维护的瓶颈正在从“生成”转向“理解、审查和演化”。

但我们不能预先假设 Spark 一定是最终答案。

SparkWell 当前更准确的定位是：

> 一个关于 AI 时代软件设计与人机协作方式的可运行实验。

我们需要通过真实使用验证：

- Spark 是否真的帮助理解；
- Spark review 是否比直接 review prompt 或 code 更有价值；
- Spark 是否只是另一种 Design Doc；
- 创建和维护 Spark 的成本是否合理；
- Spark 是否能减少返工和架构漂移；
- Spark 是否能支持长期演化，而不是只适合第一次生成；
- 多平台生成是否能保持意图一致；
- 开发者是否愿意在真实项目中长期保留它。

---

# 4. Spark 的核心含义

## 4.1 Spark 是软件概念的持久定义

Spark 代表一个有意义的软件概念。

它可能是：

- 一个应用；
- 一个功能；
- 一个工作流；
- 一个服务；
- 一个数据模型；
- 一个 UI 概念；
- 一个可复用的软件元素；
- 一个更大的复合概念。

Spark 的重点不是描述某个文件如何实现，而是描述：

- 这个概念为什么存在；
- 它应当表现为什么；
- 它拥有什么责任；
- 它有什么边界；
- 它与其他概念如何协作；
- 哪些规则和约束必须长期保留。

## 4.2 Spark 不是一次性的中间产物

Spark 不是为了生成代码后就被丢弃的 prompt。

它应当伴随软件长期存在。

实现可以不断改变：

- 替换框架；
- 修改内部结构；
- 重写代码；
- 改变存储技术；
- 迁移平台；
- 优化性能；
- 拆分服务。

只要软件意图没有变化，Spark 不一定需要变化。

当意图、行为、责任、约束、边界或关系发生变化时，Spark 才应演化。

## 4.3 Spark 不是 Prompt

Prompt 通常描述：

> 希望 AI 现在做什么。

Spark 描述：

> 软件应该是什么。

Prompt 往往是任务性的、临时性的、与当前 Agent 或当前操作相关。

Spark 应当是持久的、可独立理解的、与具体模型和工具相对解耦的。

因此，Review Prompt 不能完全替代 Review Spark。

## 4.4 Spark 也不只是传统 Design Doc

Spark 与 Design Doc 有重叠，但我们希望它具备更强的工程角色：

- 它不是仅供人阅读的旁路文档；
- 它应成为 artifact generation 的设计来源；
- 它需要与其他 Sparks 形成关系；
- 它需要能被 Agent 稳定读取和演化；
- 它需要支持 impact analysis；
- 它需要与生成的 artifacts 保持可追踪关系；
- 它需要参与 reconciliation；
- 它应在项目生命周期中持续更新。

真正需要证明的不是“Spark 能否描述软件”，而是：

> Spark 是否比传统设计文档更适合作为 Human + AI Collaboration 的长期共同对象。

## 4.5 Engineering Artifacts 是 Spark 的 Realizations

代码、测试、文档、图表和平台实现，不再被视为软件设计的唯一真实表达。

它们是 Spark 的具体 realizations。

一个 Spark 可以拥有多个 realizations，例如：

```text
Task List Spark
    ├── Web implementation
    ├── Windows implementation
    ├── Tests
    ├── User documentation
    └── State diagram
```

不同 realization 不必结构相同，也不必使用相同技术，但必须保留同一核心软件意图。

---

# 5. Spark 的粒度与组合

## 5.1 Spark 没有固定粒度

Spark 可以大，也可以小。

不能简单规定：

- 一个 feature 一个 Spark；
- 一个 requirement 一个 Spark；
- 一个类一个 Spark；
- 一个 screen 一个 Spark。

合理粒度取决于概念是否：

- 有清晰目的；
- 有稳定边界；
- 拥有连贯责任；
- 可以被独立理解；
- 有独立审查或演化的价值；
- 可能被独立复用或组合。

## 5.2 Requirement 与 Spark 不是一一对应

一个 requirement 可能影响多个 Sparks。

多个 requirements 也可能都属于同一个 Spark。

因此：

```text
Requirement ≠ Spark
Acceptance Criterion ≠ Spark
File ≠ Spark
Class ≠ Spark
Endpoint ≠ Spark
```

## 5.3 不能按实现结构机械拆分

以下对象不应因为存在于代码中就自动成为 Spark：

- 文件；
- class；
- hook；
- controller；
- DTO；
- database table；
- endpoint；
- package；
- framework component；
- implementation layer。

它们只有在代表独立、持久、有意义的软件概念时，才可能成为 Spark。

## 5.4 也不能把所有内容塞进一个大 Spark

过度合并同样有问题。

大型 Spark 应当有自己的整体意义，例如：

- 系统目的；
- 总体边界；
- 主要用户体验；
- 直接组成部分；
- 系统级规则。

它不应只是文件夹或索引，也不应重复所有子 Spark 的细节。

## 5.5 Spark 可以组合其他 Sparks

较大的 Spark 可以由较小 Sparks 组成。

组合表达的是概念所有权，不只是图形上的连接。

原则上：

- `composes`：当前 Spark 直接拥有的组成概念；
- `uses`：当前 Spark 依赖或协作，但不拥有的独立概念。

父 Spark 通常只需要直接引用其直接子 Spark，而不必列出所有后代。

组合关系最终形成一张软件概念图，而不是一堆彼此孤立的文档。

## 5.6 大 Spark 与小 Spark 各有价值

较大的 Spark：

- 提供完整上下文；
- 更容易表达端到端意图；
- 减少碎片化；
- 更适合整体 review。

较小的 Spark：

- 边界更精确；
- 更容易独立演化；
- 更适合复用；
- 更容易分析影响范围；
- 能减少不相关 artifact 的修改。

SparkWell 不应把某一种粒度绝对化，而应帮助 Agent 根据项目现状、概念责任和演化价值进行判断。

---

# 6. Requirements 与 Sparks 的关系

## 6.1 Requirement 描述变化诉求

Requirement 表达的是：

- 用户想要什么；
- 产品希望改变什么；
- 新行为或约束是什么；
- 当前系统哪里不满足需求。

Requirement 是输入或变化来源。

## 6.2 Spark 描述当前软件设计状态

Spark 表达的是：

- 在吸收已有 requirements 后，软件当前应该是什么；
- 哪个概念拥有相关行为；
- 概念之间如何组织；
- 哪些规则和约束持续有效。

因此，Requirements 更像“变化历史和需求来源”，Sparks 更像“当前设计状态”。

## 6.3 显式设计请求映射到受影响概念

普通需求默认由 coding agent 按常规方式处理，不自动进入 SparkWell。用户显式调用 `/spark-design` 后，设计流程是：

```text
/spark-design + requirement
    ↓
Understand desired outcome
    ↓
Locate affected Sparks
    ↓
Propose Sparks in chat
    ↓
Review and revise proposal
    ↓
Finalize
    ↓
Create or evolve Spark Documents
    ↓
Review Spark Documents
```

## 6.4 是否长期保存 Requirements 仍是开放问题

我们尚未完全决定：

- 是否需要一份长期维护的整体 requirements 文档；
- requirements 是否作为独立实体持久化；
- 是否只保存重要需求和决策；
- requirement 与 Spark 之间需要多强的 traceability；
- requirements 是否更适合作为历史记录，而 Spark 作为当前状态。

但无论采用何种形式，都必须明确：

> Requirement 与 Spark 不是同一种 artifact。

---

# 7. 核心工作流

## 7.1 Explicitly Activated Spark Development

SparkWell 默认不介入普通问答、编码、调试、重构和测试。每个工作流都由用户单独显式调用：

- `/spark-design`：先在 chat 中提出 Spark Proposal，经确认后生成或演进 Spark Documents，并停在文档评审点；
- `/spark-impl`：从 Sparks 生成一个目标的工程产物；
- `/spark-test`：从 Sparks 创建、更新或执行测试。

`/spark-design` 的工作流是：

```text
/spark-design + Requirement
    ↓
Propose Spark map in chat
    ↓
Review / Revise / Cancel
    ↓
Finalize
    ↓
Generate Spark Documents
    ↓
Review Spark Documents
```

Proposal 阶段不修改项目文件。`Finalize` 后才生成 Spark Documents；文档评审完成后，用户仍需另行调用 `/spark-impl`。

这里有两个 **Human Stop Point**：先确认概念集合和边界，再评审生成后的完整 Spark Documents。

软件意图发生变化本身不会激活 SparkWell。一次 slash command 只激活当前请求中的一个工作流。Proposal 完成后，宿主支持决策 UI 时由用户直接选择 `Revise`、`Finalize` 或 `Cancel`；没有 UI 时才通过同名文本回复续接。关闭 UI 或含糊反馈不会完成确认，也不会自动串联其他阶段。

人应有明确机会在实现前检查：

- 概念是否正确；
- 粒度是否合理；
- 行为是否完整；
- 边界是否清晰；
- 关系是否正确；
- 是否出现不必要的实现细节；
- 是否遗漏需求；
- 哪些假设需要确认。

## 7.2 Spark Design 与 Artifact Generation 应分离

创建或演化 Spark 是一个软件设计任务。

生成代码、测试、文档或图表是另一个任务。

这两个阶段应明确分开。

## 7.3 Project Architecture 应由项目定义

SparkWell Core 提供通用 realization 流程，但不替项目选择 MVC、MVVM、Clean Architecture、状态管理、repository、ORM、local/remote data flow 或目录结构。

项目实现配置分为：

- `.sparkwell/config.yaml` 中的 target、source-root、guidance references，以及按 Pack ID 分组的机器可读配置；
- Profile 显式选择的 optional implementation packs，用于复用特定技术的 realization 与测试规则；
- Profile 引用的 `.sparkwell/guidance/*.md` 项目架构指导；
- native manifests、build files 和既有代码所表达的工程事实。

Pack 需要先显式安装，再由具体 Profile 激活；安装本身不会让某项技术成为所有项目或所有 target 的默认选择。YAML 只负责确定性路由、引用和 Pack 必须机器校验的参数；framework、architecture、state ownership 和 persistence strategy 等描述性决策属于 Guidance 或既有 native project。协议、contract format、framework、generator 和 persistence provider 都不属于 Core 语义。

新 runtime implementation 在生成代码前应由项目维护好 Profile 与 Guidance。它们可以手工编写或在普通 Coding Agent 协助下逐步完善，但不是独立的 SparkWell workflow。已有系统应优先固化并保留现有架构，而不是借机重构。

Sparks 拥有产品行为、用户可见状态、Service capabilities、同步和冲突语义；Profile 只负责 target、artifact routing 和 Pack 配置；Project Guidance 拥有项目架构、provider、repository、ORM、DI 和代码组织方式；Pack 提供可复用的 protocol、contract format、generator、realization 和 validation 规则；native files 记录实际依赖、版本、命令和既有结构。

## 7.4 Offline Review 是核心能力

“Offline”强调 Spark 应成为可独立查看、比较和讨论的项目资产，而不是只存在于当前聊天上下文。

Review 可以包括：

- 完整 Spark；
- Spark diff；
- 新增或删除关系；
- Requirement-to-Spark mapping；
- 假设和开放问题；
- 受影响 artifact 的预测。

## 7.5 Review 不代表永远不看代码

SparkWell 的目标不是取消代码审查，而是改变审查层次：

1. 首先审查软件意图；
2. 然后审查架构和影响；
3. 再根据风险审查关键实现；
4. 对低风险、机械性 realization，可以更多依赖自动验证和测试。

---

# 8. Spark Evolution

## 8.1 第一次生成只是起点

一次初始生成最多只能说明工具能够执行一条链路：

```text
Requirements
    ↓
Sparks
    ↓
Offline review
    ↓
Engineering artifacts
```

真正需要验证的是后续演化能否保持意图、边界和未受影响 artifacts 的稳定。

## 8.2 典型演化场景

例如初始 Todo 只有：

- title；
- completed。

随后新增：

- due date；
- priority；
- filtering；
- recurring task；
- persistent ordering。

系统需要能够：

- 判断哪些 Sparks 受影响；
- 更新相关 Spark，而不是重写全部设计；
- 让人 review Spark diff；
- 识别 Web 和 Windows 中需要修改的 artifacts；
- 保持未受影响部分稳定；
- 让多个平台同步表达同一新意图。

## 8.3 Spark Diff 可能比 Code Diff 更重要

Code diff 展示实现变化。

Spark diff 展示软件意图变化。

未来人类可能首先关心：

- 哪个概念改变；
- 新增了什么行为；
- 哪个边界发生调整；
- 哪些关系改变；
- 哪个平台存在特定差异；
- 哪些 artifact 应被重新生成。

---

# 9. Reconciliation

## 9.1 Spark 与 Artifacts 可能发生偏离

现实项目中会出现：

- Spark 已更新，但代码还未同步；
- 代码被人工修改，但 Spark 未更新；
- 某个平台实现了不同规则；
- 测试与实际行为不一致；
- 文档已经过时；
- Agent 生成的代码并未完整实现 Spark；
- 现有代码揭示 Spark 本身存在错误或缺失。

## 9.2 Reconciliation 不是简单覆盖

Agent 不应默认：

- Spark 永远正确；
- 代码永远正确；
- 最新修改的一方自动成为事实来源。

它应该识别 divergence，并帮助人判断：

- 更新 Spark；
- 更新 artifacts；
- 两者都更新；
- 接受平台差异；
- 补充缺失约束；
- 记录一个有意的例外。

## 9.3 Reconciliation 是长期闭环的核心

没有 reconciliation，Spark 很容易退化成另一份最终过时的文档。

---

# 10. Traceability 与 Manifest 思想

具体 manifest 格式不属于本文档，但长期系统需要持久化理解：

- 哪些 artifacts realize 某个 Spark；
- 一个 artifact 由哪些 Sparks 共同影响；
- 某个 Spark 变化会影响哪些文件、平台、测试和文档；
- 哪些 artifacts 已与最新 Spark 同步；
- 哪些 artifacts 可能存在 divergence。

这种映射应成为项目资产，并进入版本控制。

它是以下能力的基础：

- impact analysis；
- targeted regeneration；
- reconciliation；
- multi-platform synchronization；
- artifact coverage；
- Spark evolution history。

---

# 11. Implementation Independence 与平台差异

## 11.1 Spark 应尽可能独立于实现

Spark 应优先描述：

- 行为；
- 责任；
- 状态；
- 规则；
- 约束；
- 边界；
- 交互；
- 概念关系。

而不是具体框架和代码结构。

## 11.2 Implementation Independent 不等于完全忽略平台

某些软件意图本身就与平台相关，例如：

- iOS 的 bottom sheet 不应被 tab bar 覆盖；
- Windows 使用特定系统交互模式；
- Web 需要浏览器会话行为；
- 平台权限模型不同；
- 不同设备具有不同输入方式。

因此需要区分：

1. 属于某个具体 Spark 的平台特定要求；
2. 跨多个 Sparks 的项目级平台规则。

## 11.3 同一意图可以有不同 realization

Web 与 Windows 不需要产生相同的文件结构或组件结构。

它们可以使用不同框架和平台惯例，但应保持：

- 相同核心行为；
- 相同概念边界；
- 相同业务规则；
- 明确记录的允许差异。

---

# 12. 横切关注点与 Traits 方向

一些要求跨越多个 Sparks，例如：

- accessibility；
- security；
- analytics；
- localization；
- logging；
- privacy；
- design system；
- offline behavior；
- error handling policy。

如果把这些内容重复写入每个 Spark，会造成重复和漂移。

我们曾将这类机制称为 Traits，但具体名称和模型尚未最终确定。

长期需要一种能力：

> 将跨多个 Sparks 的设计规则定义一次，并让相关 Sparks 和 realizations 继承、应用或验证这些规则。

这仍属于开放方向，不应在当前阶段过早固定。

---

# 13. Spark Library 与设计级复用

长期来看，复用不应只发生在代码层。

需要探索：

- Library 中保存完整 Spark、模板还是参数化 Spark；
- 项目如何实例化或扩展 Library Spark；
- 项目 Spark 与共享 Spark 如何区分；
- 复用时如何避免引入不适合当前领域的假设；
- 共享的是实现，还是设计意图和约束。

这一方向有潜力，但当前不是 MVP 的首要目标。

---

# 14. Legacy Code 与渐进式采用

SparkWell 不能只适用于全新项目。

可能的渐进路径包括：

1. 只为新功能创建 Spark；
2. 为正在修改的旧功能补充 Spark；
3. 从现有代码、测试、文档和行为中提取候选 Spark；
4. 明确 legacy 部分仍以代码为主要事实来源；
5. 随着演化逐步扩大 Spark 覆盖；
6. 利用 reconciliation 识别不一致和缺失意图。

SparkWell 不应要求一次性把整个项目重新建模，否则采用成本会过高。

---

# 15. Human 与 Agent 的职责

## 15.1 Agent 应帮助完成的工作

Agent 可以帮助：

- 从 requirement 中提取目标、行为、约束和假设；
- 查找受影响的已有 Sparks；
- 建议创建或演化哪些 Sparks；
- 判断候选概念粒度；
- 建议 composition 和 usage relationships；
- 发现重复、重叠或缺失责任；
- 在 chat 中提出简短 Spark Proposal；
- 根据确认后的 Proposal 生成 Spark Documents；
- 生成 artifact；
- 分析 impact；
- 检测 Spark 与 artifact 的 divergence；
- 生成图表和可视化；
- 解释系统设计；
- 在信息不足时提出聚焦问题。

## 15.2 人类应保留的控制

人应负责或最终确认：

- 软件意图；
- 概念边界；
- 关键责任归属；
- 产品和架构 trade-off；
- 重要平台差异；
- 是否接受 Agent 的假设；
- Spark review；
- 是否进入 artifact generation；
- divergence 应如何 reconciliation；
- 高风险实现是否可接受。

SparkWell 的目标不是移除人，而是让人的判断发生在更有价值的层次。

---

# 16. Core Artifacts 与 Skills 的分工

## Specification

回答：

> Spark 是什么？

定义核心概念、基本语义和不随某个 Agent 工作流改变的规则。

## Conventions

回答：

> Spark Documents 在这个项目中如何存储和表示？

定义项目自有的路径、命名、frontmatter 序列化和 kind-specific 文档格式。

## Implementation Profiles 与 Guidance

回答：

> 一个 realization 路由到哪里，并遵循什么项目架构？

Profile YAML 只保存 target、source-root、Pack 配置和 Guidance 引用；描述性的架构决策保存在项目 Guidance 或 native project 中。

## Instructions

回答：

> Agent 在这个项目中应如何工作？

只定义 SparkWell 的显式激活边界和 Pending Proposal 的有限续接。具体流程属于相应 Skill。

## Skills

回答：

> 某个具体任务应该如何执行？

当前显式工作流包括 `/spark-design`、`/spark-impl` 和 `/spark-test`。

Skill 是可执行工作流程，不应重新定义 Spark 理论。

## Implementation Packs

回答：

> 某项技术如何 realization 和 validation？

Pack 提供可复用的技术规则，由 Profile 显式激活，但不能拥有或改变产品意图。

---

# 17. 当前 Demo 已经证明了什么

当前实现状态不属于稳定愿景。可验证能力、Demo 状态和仍未证明的假设维护在 [当前状态与 Roadmap](status-and-roadmap-zh.md) 中。

---

# 18. 近期应快速完成和验证的事情

近期验证重点和可变任务列表维护在 [当前状态与 Roadmap](status-and-roadmap-zh.md) 中，避免愿景文档因实现进展而持续过期。

---

# 19. 中期能力方向

## 19.1 Spark Browser

- 浏览项目中的 Sparks；
- 按 kind、domain、关系和状态筛选；
- 从应用级 Spark 逐层进入子 Spark；
- 快速看到某个 Spark 的 requirements 和 realizations；
- 避免依赖文件夹结构理解软件。

## 19.2 Spark Graph

- 展示 composition；
- 展示 usage；
- 展示 requirement links；
- 展示 artifact links；
- 发现孤立、重复或过载概念；
- 支持从高层系统逐层展开。

## 19.3 Impact Analysis

当一个 Spark 发生变化时，系统应帮助回答：

- 哪些子 Sparks 可能受影响；
- 哪些使用方需要检查；
- 哪些平台 realization 需要更新；
- 哪些测试、文档和图表可能过时；
- 哪些内容可以保持不变。

## 19.4 Reconciliation Workflow

- 检测 Spark 与 artifacts 不一致；
- 展示差异；
- 推测偏离来源；
- 建议更新方向；
- 让人选择以 Spark、artifact 或新的共同设计为准；
- 记录 intentional divergence。

## 19.5 Visual Review Artifacts

自动生成：

- system map；
- workflow；
- state diagram；
- data flow；
- sequence diagram；
- UI state map；
- platform comparison；
- change impact map。

## 19.6 Legacy Extraction

- 从代码和测试中提取候选软件概念；
- 识别重复责任；
- 推断概念关系；
- 生成待 review 的 Spark 草案；
- 明确哪些只是实现推断，不能当作已确认意图。

---

# 20. 长期产品愿景：Iron Man Interface

“钢铁侠界面”不是简单的节点图，也不是为了追求科幻视觉效果。

它代表一种完全不同的软件理解和编辑方式。

## 20.1 从系统全局进入局部

用户可以看到：

- 整个应用的主要 Sparks；
- 功能和领域边界；
- 组合层级；
- 关键依赖；
- 平台 realizations；
- requirements 与 artifacts 的覆盖情况。

然后逐层进入：

```text
Application
    ↓
Feature
    ↓
Workflow
    ↓
Component
    ↓
Behavior / State / Artifact
```

## 20.2 在同一空间中查看多种视角

同一个软件可以切换为：

- 概念图；
- 用户流程；
- 状态机；
- 数据流；
- 平台对比；
- requirement trace；
- artifact trace；
- change impact；
- evolution timeline。

## 20.3 直接操作软件设计

长期可能支持：

- 选择一个 Spark 并查看其责任；
- 拖动或重组 composition；
- 创建新的概念边界；
- 合并重叠 Sparks；
- 编辑行为和约束；
- 比较不同设计方案；
- 请求 Agent 解释某个关系；
- 请求 Agent 模拟一次需求变化；
- 查看将受影响的所有 artifacts；
- 在 Spark Documents 评审完成并显式调用实现工作流后生成或更新 realizations。

## 20.4 可视化多平台 realization

对于同一个 Spark，可以同时查看：

- Web 如何实现；
- Windows 如何实现；
- iOS 如何实现；
- 共同意图是什么；
- 平台特定要求是什么；
- 哪些差异是有意的；
- 哪些差异可能是 drift。

## 20.5 AI 成为可解释的设计协作者

Agent 可以在界面中：

- 解释为什么建议拆分某个 Spark；
- 显示某个 requirement 的影响路径；
- 指出某个平台实现遗漏了约束；
- 提出多个设计方案；
- 展示每个方案的影响；
- 在 Spark Documents 评审完成并收到显式 `/spark-impl` 调用后执行 artifact generation；
- 记录决策原因。

## 20.6 最终体验目标

最终，开发者不必首先面对上千个文件。

他们首先面对的是：

- 软件的目的；
- 软件的概念；
- 软件的关系；
- 软件的行为；
- 软件的变化；
- 软件的不同 realizations。

源码仍然存在，但不再是理解整个系统的唯一入口。

---

# 21. 非目标与边界

为了避免误解，SparkWell 当前明确**不是**：

- 不是一种新的编程语言，也不希望 Spark 演化成另一种 DSL， 不要把所有实现精确编码在其中。
- 不是另一份传统设计文档，而是希望成为可长期演化、可被 AI 理解、可驱动 Engineering Artifacts 的设计层。
- 不是为了增加文档工作，而是希望减少长期理解和维护成本。
- 不是要求每一个文件、类、Hook、API 都对应一个 Spark。
- 不是要求所有软件都必须自动生成， SparkWell 允许人工实现、人工修改、不同 Agent 实现、部分 artifact 生成和 legacy code 共存。
- 不是替代源码；源码仍然是运行系统的最终实现，也是调试、性能、安全等工作的基础。
- 不是只能用于全新项目，应支持渐进式引入到 Legacy 项目。
- 不是与 Spec Kit、Superpower、Harness 等方法竞争，而是可以作为它们之间的设计层，与这些方法组合使用。
- 不是试图证明自己一定正确，而是持续通过真实项目验证和修正自己的假设。

SparkWell 更关注的是：**人与 AI 应围绕什么长期协作，而不是 AI 如何更快地产生代码。**

# 22. 仍待回答的关键问题

## 22.1 Spark 的价值

- Spark 与传统 Design Doc 的关键差异是否足够大；
- 开发者是否愿意长期维护 Spark；
- Spark review 是否真正减少代码审查成本；
- 是否只是把工作从写代码转成写文档；
- Agent 是否能稳定理解自然语言 Spark。

## 22.2 Granularity

- 什么程度的概念值得独立 Spark；
- 大项目中如何避免 Spark 数量失控；
- 如何防止过度分解；
- 如何发现过载 Spark；
- 不同项目是否需要不同粒度策略；
- Agent 能否通过现有 Sparks 自动校准。

## 22.3 Interface 与契约

- Spark 是否需要明确描述组件接口；
- 哪些输入输出属于软件意图；
- 怎样避免接口部分逐渐变成实现 specification；
- 可复用 Spark 是否需要更强的契约模型。

## 22.4 Requirements

- Requirements 是否长期保存；
- 以什么粒度保存；
- 是否建立显式 requirement graph；
- 如何表示已废弃或冲突需求；
- requirement history 与当前 Spark 状态如何配合。

## 22.5 Platform-specific design

- 平台特定内容应放在 Spark 内，还是项目规则中；
- 同一 Spark 的平台差异如何 review；
- 哪些差异仍然属于同一 realization；
- 什么情况下应创建平台专属 Spark。

## 22.6 Artifact Ownership

- 一个 artifact 对应多个 Sparks 时如何追踪；
- 一个 Spark 生成大量文件时如何保持映射；
- 手工修改如何保留；
- 重新生成如何避免破坏无关代码；
- 什么是“已同步”。

## 22.7 Reconciliation

- 如何判断 Spark 与代码谁过时；
- 如何区分 bug、intent change 和 intentional exception；
- 如何在没有完整 tests 的情况下检测 divergence；
- 自动 reconciliation 应该有多激进。

## 22.8 Human Review

- 人最适合 review 哪种表现形式；
- Markdown 是否足够；
- 图、状态、flow 和 preview 哪些最有价值；
- 如何避免 Spark review 也变得过载；
- Proposal 应提供多少信息才能做出可靠确认；
- 哪些工作区变化应使已确认 Proposal 失效并要求重新确认。

## 22.9 Adoption

- 对新项目和旧项目分别如何开始；
- 最小使用方式是什么；
- 不使用专用 IDE 是否也能受益；
- 如何与 Spec Kit、Superpower、Harness 等方法共存；
- SparkWell 是否可以只作为其中一个阶段使用。

---

# 23. 与其他 AI Coding 方法的关系

## Spec-driven Development

Spec Kit、Superpower 等方法主要帮助：

- 澄清需求；
- 规划任务；
- 在编码前做更多分析；
- 规范 Agent 的开发过程。

SparkWell 更关注：

- 软件概念的长期持久化；
- 需求完成后设计是否继续存在；
- 后续需求如何演化已有概念；
- 多个平台和 artifacts 如何共享同一设计；
- 长期 reconciliation 和理解。

它们可以组合。

## Agent Harness

Harness 方法主要通过完善环境、提供工具、设置反馈循环，让 Agent 长时间独立运行。

SparkWell 解决的是另一层问题：

- Agent 应围绕什么长期理解软件；
- 人应该 review 什么；
- 多次任务之间如何保留设计上下文。

两者也可以组合。

---


# 24. SparkWell 的核心假设

SparkWell 并不预设自己的方法一定正确。

目前，我们更希望把它看作一组需要通过真实项目持续验证的假设。

这些假设共同构成了 **Spark Hypothesis**。

---

## H1：软件应该拥有独立于实现的持久设计层

今天，大多数软件知识最终都沉淀在实现中。

SparkWell 假设：

> 软件应该拥有一个能够长期存在、持续演化、独立于具体实现技术的设计层。

实现可以不断变化，而设计意图应能够长期保留。

---

## H2：人与 AI 应该围绕设计协作，而不仅仅围绕代码协作

当前大多数 AI Coding 工作流都是：

```text
Requirement
    ↓
Prompt
    ↓
Code
```

SparkWell 假设：

```text
Requirement
    ↓
Spark Proposal
    ↓
Human Confirmation
    ↓
Spark Documents
    ↓
Human Review
    ↓
Engineering Artifacts
```

会成为一种更适合长期软件工程的人机协作模式。

---

## H3：多个 Engineering Artifacts 可以共享同一个软件设计来源

代码、测试、文档、图表以及不同平台实现，并不是彼此独立的软件资产。

它们本质上都是同一个软件概念的不同 Realizations。

SparkWell 假设：

> 一个 Spark 可以成为这些 Engineering Artifacts 的共同设计来源。

---

## H4：设计优先于实现进行 Review，会提升长期可维护性

随着 AI 能快速生成大量实现，仅依赖代码 Review 的成本越来越高。

SparkWell 假设：

> 在生成实现之前，先 Review 软件设计，比仅 Review 最终实现，更有助于长期维护和演化。

---

## H5：软件演化应首先体现为设计演化

新的需求不应首先修改代码，而应首先修改软件设计。

SparkWell 假设：

```text
Requirement
    ↓
Spark Evolution
    ↓
Review
    ↓
Artifact Evolution
```

比直接修改实现，更容易保持系统的一致性、可理解性和长期稳定性。

---

这五个假设目前都尚未被证明。

SparkWell 当前最重要的工作，不是证明它们一定正确，而是通过真实项目、真实开发流程和真实开发者反馈，不断验证、修正甚至推翻它们。

# 25. 对外定位

在当前阶段，不应把 SparkWell 宣称为已经被证明的新软件工程范式。

更诚实、也更有吸引力的定位是：

> SparkWell is an experiment in redesigning how humans and AI collaborate on software.

更具体地说：

> SparkWell introduces a persistent, reviewable software-design layer between requirements and engineering artifacts.

或者：

> SparkWell explores whether software intent—not source code—can become the primary collaboration artifact between humans and AI.

---

# 26. 成功标准

SparkWell 是否成功，不应只看它能否生成代码。

更重要的成功信号包括：

- 新 Agent 能在更短时间内理解项目；
- 人能在生成代码前发现设计问题；
- 新需求能明确映射到受影响 Sparks；
- 多个平台能稳定保持同一意图；
- Spark diff 能清楚表达软件变化；
- 未受影响 artifacts 在演化中保持稳定；
- 手工代码变化能被检测并 reconciliation；
- 开发者认为 Spark 带来的价值高于维护成本；
- 系统级理解不再完全依赖阅读源码；
- 人类在更高层次做出关键设计判断。

---

# 27. 当前最重要的行动顺序

当前行动顺序维护在 [当前状态与 Roadmap](status-and-roadmap-zh.md) 中。本愿景只保留稳定的成功标准和长期方向。

---

# 28. 最终愿景

SparkWell 最终想探索的，不只是一个新的文件格式、Prompt Framework 或 AI Coding Tool。

它想探索一种未来：

- 软件意图可以长期存在；
- 人和 AI 围绕同一个设计层协作；
- 实现可以被快速生成和替换；
- 多个平台共享相同的软件概念；
- 软件变化首先体现为设计变化；
- 人类主要 review 意图、边界、流程和影响；
- AI 负责大量 realization、同步、检查和解释；
- 软件可以被可视化地探索，而不是只能从文件树中重建；
- 新 Agent 不必从零猜测系统为什么存在；
- 软件不再只是代码集合，而是一个可以理解、审查和演化的设计系统。

一句话总结：

> **SparkWell 不是为了让 AI 写出更多代码，而是为了让人类和 AI 对正在构建的软件拥有更持久、更清晰、更可审查的共同理解。**
