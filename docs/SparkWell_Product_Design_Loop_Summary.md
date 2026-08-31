# SparkWell 最近这轮思路演进总结

## 1. 起点：AI Coding 正在改变“人应该关注什么”

最开始的新观察是：

以前的软件开发，人的注意力主要放在 implementation 上：

```text
Requirement
    ↓
Design
    ↓
Human writes code
    ↓
Review code
    ↓
Test
```

但现在越来越多开发者的工作方式变成：

```text
Requirement
    ↓
AI generates code
    ↓
Test / Verify
```

甚至很多情况下，人已经不会仔细阅读 AI 生成的每一行代码，只要：

- 功能正确；
- 测试通过；
- verification 通过；

就接受实现。

这是不是软件工程最终会走向的正确形态还不能确定，但它确实正在发生。

由此我们提出一个重要问题：

> **如果 implementation 越来越由 AI 承担，人真正应该拥有和 Review 的东西是什么？**

一个逐渐形成的答案是：

> 人的注意力可以从 implementation detail 向更高层的软件 intent / requirements / design 移动。

这让 SparkWell 的重点也开始发生变化。

以前我们大量关注：

```text
Spark → Code
```

例如：

- 如何生成 service；
- 如何生成 DB；
- 如何生成 API；
- 如何生成 client；
- 如何适配不同 architecture；
- 如何设计 generation skills。

现在我们开始认为，更值得投入的是：

```text
Requirement / Change
        ↓
Persistent Software Model
        ↓
Design
        ↓
Implementation
```

也就是说：

> SparkWell 不必和 Coding Agent 比谁更会生成代码，而应该更多解决“AI 应该依据什么来生成软件”。

---

## 2. 第一次尝试：Requirement → Spark → Implementation

最开始我们想到：

```text
Requirement
    ↓
Spark
    ↓
Implementation
```

其中：

Requirement 表示：

> What needs to change?

Spark 表示：

> What should the software be?

Implementation 表示：

> How does it actually exist?

这里还提出了一个重要区别：

```text
Requirement = change/event
Spark       = current state
```

例如：

```text
R1: Todo supports deadlines
R2: Remove deadlines later
```

我们不希望 AI 永远去重新阅读 R1、R2，然后判断现在到底有没有 deadline。

而希望最后 current Spark 直接告诉 AI：

```text
Todo:
No deadline.
```

所以 Requirement 可以是历史变化，而 Spark 是 normalized current truth。

---

## 3. 但随后发现：不能把 Spark 推得太靠近 Requirement

这里 Todo App 的实验给了我们很重要的反馈。

Todo App 之所以能较好地生成实现，是因为当时的 Spark 并不只是描述：

> 用户可以创建 Todo。

它还包含很多**软件设计决策**。

例如：

```text
Todo 是 canonical model

completion state 属于 Todo

Todo Service 操作这个 model

DB / API / Service 都围绕这个 model realization

UI 不直接拥有 domain state
```

这些内容已经不是 Requirement 了，但又还没有具体到代码。

它们恰恰是控制 AI implementation 非常重要的设计信息。

如果把 Spark 简化成：

```text
Users can create and complete todos.
```

那么 Coding Agent 又必须自己猜：

```text
是否需要 canonical model？
service 如何组织？
DB schema 如何对应？
API 是否使用相同 model？
repository 是否存在？
local / remote 谁是 source of truth？
```

结果就又回到了我们 Todo App 之前遇到的问题：

> AI 自己决定 architecture 和 pattern，可能既不符合人的设计，也不符合已有系统。

所以我们修正了方向：

> **不能把原来的 Spark 简单变成 Requirement。**

---

## 4. 因此出现了三层模型

后来我们逐渐认为，至少需要区分三个 abstraction level：

```text
Layer 1
Product / Requirement Model

“What should the product be?”

        ↓

Layer 2
Software Design Model

“How should software be designed
to realize that product?”

        ↓

Layer 3
Implementation

“How does it actually exist in code?”
```

更具体地说：

### 第一层：Product

关心用户和产品层面的事实：

```text
Users can create Todo.
Users can complete Todo.
Todo can have optional priority.
Completed Todos remain visible.
```

完全换一套技术和 architecture，这些仍然成立。

### 第二层：Design

关心软件如何表达这些 product concepts：

```text
Todo is a canonical domain model.

Completion state is owned by Todo.

Todo Management owns completion operations.

Persistence preserves Todo state.

Todo List presents collections of Todo.
```

这些是会约束 implementation 的软件设计决策。

换 architecture 时，它们可能改变，但 Product 不一定改变。

### 第三层：Implementation

具体 artifacts：

```text
Todo.ts
TodoService.ts
TodoRepository.ts
SQLiteTodoRepository.ts
TodoList.tsx
REST API
SQL schema
tests
```

这时候整个模型就变成：

```text
Product What
     ↓
Software Design
     ↓
Implementation How
```

---

## 5. Requirement 不再是长期维护的第一层

这里又有一个进一步的修正。

我们不希望第一层仍然是一堆：

```text
R001
R002
R003
...
```

因为这样的 Requirement Document 还是会 drift、过时。

于是开始区分：

```text
Raw Requirement / Idea / Feedback
              ↓
          normalize
              ↓
        Product Model
```

例如用户输入：

> Todo should support priority.

这只是一次性的 Change Input。

经过理解后更新 Product Model：

```text
Todo
+ optional priority

Todo List
+ displays priority
```

以后 AI 日常并不需要重新读取原始 Requirement。

它读取的是：

> **当前完整的 Product Model。**

所以：

```text
Raw Requirement = event/input
Product Model   = current product state
```

这解决了“Requirement 慢慢没人维护”的一部分问题。

---

## 6. PRD 与 Product Model 的讨论

后来我们 challenge 了一个问题：

> 为什么不用 PRD？为什么还要 Product Spark？

这个 challenge 很重要。

我们得出的结论不是：

> PRD 不好。

事实上 Product Spark 中写的很多内容，完全可能和一个好 PRD 很相似。

真正的区别不应该是“谁更会描述产品”。

而是：

```text
PRD     更像 human-readable document / view
Model   更像 persistent, addressable current state
```

如果 Product Spark 只是：

> PRD paragraph + YAML frontmatter

那没有必要发明新概念。

Product Spark 真正可能有价值的地方是：

```text
stable identity
concept boundary
relationships
incremental delta
traceability
impact analysis
refinement
change propagation
```

因此后来我们更喜欢：

> **Product Model**

而 PRD 可以变成 Product Model 的一种 View：

```text
                 ┌→ PRD
                 ├→ Feature Spec
Product Model ───┼→ User Stories
                 ├→ QA Requirements
                 └→ Design Model
```

甚至已有 PRD 可以作为输入：

```text
Existing PRD
     ↓ normalize
Product Model
```

反过来也可以：

```text
Product Model
     ↓ render
Current PRD
```

这样不需要维护两份 current truth。

---

## 7. 从“Product Model + Design Model”进一步走到了“多层 Spark”

接下来你提出了一个很关键的新想法：

> 既然原来的 Spark 更接近 Design，而现在又需要一层接近 Product / Requirement，那么为什么不让 Spark 本身支持多个 abstraction level？

这比：

```text
Requirement Object
    ↓
Spark
    ↓
Code
```

更统一。

于是新的设想是：

```text
Raw Change
    ↓
Product Sparks
    ↓
Design Sparks
    ↓
Code
```

甚至复杂项目未来可以：

```text
Product Spark
     ↓
Design Spark
     ↓
Platform / Implementation Spark
     ↓
Code
```

但目前我们认为**不要马上做第三层 Spark**。

第一版先验证：

```text
Product Spark
Design Spark
Code
```

已经足够。

---

## 8. Spark 的定义因此可能发生升级

原来的 Spark 更像：

> persistent definition of a meaningful software concept.

现在可能升级为：

> **A Spark is a persistent representation of software intent at a defined level of abstraction.**

或者更模型化一点：

> **A Spark is an independently meaningful element of a software model.**

于是：

```text
Product Spark
= Product Model 中的一个 model element

Design Spark
= Design Model 中的一个 model element
```

这样 Spark 本身不是固定 abstraction level。

`level` 才决定它处在哪一层。

例如：

```yaml
level: product
kind: capability
```

或者：

```yaml
level: design
kind: domain-model
```

这里还有一个重要结论：

> **level 和 kind 必须分开。**

因为：

```text
level
```

回答：

> 这个 Spark 处在哪个 abstraction level？

而：

```text
kind
```

回答：

> 这是哪种软件概念？

---

## 9. Product Spark 与 Design Spark 的 boundary

目前我们找到一个相对简单的判断方法。

如果：

> **完全换一种 architecture、platform、framework，这个事实依然成立吗？**

通常更接近 Product Spark。

例如：

```text
Users can complete Todo.
Todo can have priority.
Users can filter completed todos.
```

而：

```text
Todo is the canonical domain model.
Completion state belongs to Todo.
Todo Management owns completion behavior.
Persistence is independent of UI.
```

属于 Design Spark。

因为这些是为了实现 Product intent 而作出的 software design decisions。

所以大概可以理解：

```text
Product Spark
“What should users/product observe?”

Design Spark
“How should software concepts be organized
to produce that behavior?”
```

---

## 10. Product → Design 不是机械生成，而是 refinement

这里我们也修正了一个词。

之前说：

```text
Product Spark generates Design Spark
```

容易让人想到模板式转换。

更准确的词可能是：

> **refine**

所以完整过程逐渐形成：

```text
Requirement / Change
      ↓ normalize
Product Model
      ↓ refine
Design Model
      ↓ realize
Implementation
```

也就是三个核心动词：

> **Normalize → Refine → Realize**

我觉得这已经是目前这一轮讨论中非常有代表性的一套 vocabulary。

其中 Product Model 与 Design Model 的关系绝对不是一对一。

例如：

```text
Product:
Users stay signed in between sessions.
```

Design 可能拆成：

```text
Credential Sign-In
User Session
Session Persistence
```

反过来一个 `User Session` Design Spark 又可能服务多个 Product Sparks。

因此真实模型是：

```text
Graph
  ↓ refinement
Graph
  ↓ realization
Artifacts
```

而不是：

```text
Document A
  ↓
Document B
```

---

## 11. 后来又出现了非常关键的统一 Loop

然后你提出：

> 无论哪一层发生变化，都把这个变化重新作为 diff/input，从最高层开始跑一遍整个 loop。

这个想法把之前很多机制统一了。

变化可能来自任何地方：

```text
New Requirement
Manual Product Spark edit
Manual Design Spark edit
Manual Code edit
Bug fix
Refactoring
```

不需要分别设计：

```text
top-down synchronization
bottom-up synchronization
```

而统一成：

```text
Any Change
    ↓
Normalize Change Input
    ↓
Product Layer
    ↓
Design Layer
    ↓
Implementation Layer
```

每一层只回答：

> **这个变化是否影响我这一层？**

如果：

```text
yes
```

则提出 delta。

如果：

```text
no
```

则跳过。

---

## 12. Code-first change 的例子

例如开发者直接修改：

```diff
interface Todo {
  title: string
  completed: boolean
+ priority?: number
}
```

这个 code diff 作为 input 重新进入 loop。

Product 层先判断：

```text
Does this represent a Product change?
```

如果 `priority` 只是内部 implementation field：

```text
No Product impact.
```

Product skip。

如果用户能看到和设置 priority：

```text
Product impact detected:

~ Todo
  Add optional priority.
```

先让人确认 Product Delta。

然后进入 Design：

```text
Current Product Model
+
Current Design Model
+
Original Change

        ↓

Design impact:

~ Todo Model
~ Todo Management
~ Todo List
```

再确认。

然后 Implementation 层判断：

```text
Code already partially implements the design.

Missing:
- persistence
- display
- tests
...
```

继续完成实现。

所以 Code 仍然是 Reality，但不会直接反向“改写产品真相”。

底层变化只能：

> **propose upper-layer changes**

不能 silently redefine upper layers。

---

## 13. Loop 的一个核心性质：每层都是 current model

这是我们现在和传统“文档链条”最大的差别之一。

不是：

```text
Requirement Doc
Design Doc
Code
```

三份容易 drift 的文档。

而更像：

```text
Product Model
Design Model
Implementation Model / Reality
```

它们都是 current state。

每次 change 都重新经过：

```text
Change
   ↓
Product impacted?
   ↓
Design impacted?
   ↓
Implementation impacted?
```

所以目标不是“提醒开发者记得同步文档”。

而是：

> **让 AI 主动进行 semantic reconciliation。**

这也是为什么定义成 Model 比 PRD 更自然。

---

## 14. Review 的角色也因此发生变化

新的 Workflow 里可能天然有三种不同 Review：

```text
Raw Change
    ↓
Product Delta
    ↓
Product Review
```

回答：

> **这是我们真正想要的产品变化吗？**

然后：

```text
Product Model
    ↓
Design Delta
    ↓
Design Review
```

回答：

> **这是我们希望采用的软件设计吗？**

然后：

```text
Design Model
    ↓
Implementation Plan / Code
    ↓
Verification
```

回答：

> **实现是否正确 realization 了设计？**

这比让人逐行 Review AI Code 更符合我们现在设想的人机分工。

---

## 15. Code Generation 没有被删除，只是不再是 SparkWell 的唯一重心

这一点我们后来反复确认了。

新的方向不是：

> SparkWell 从 Code Generation 变成 Requirement Management。

更准确的是：

> **SparkWell 从“以 Code Generation 为中心”，转向“以 Product Intent → Software Design → Implementation consistency 为中心”。**

Implementation 仍然非常重要，因为：

> **最终真正运行的软件只有 implementation。**

但 SparkWell 不必承担：

> 自己知道所有 architecture 和 framework 应该如何生成。

实现输入仍然会是：

```text
Design Model
+
Project Architecture / Guidance
+
Existing Implementation Patterns
        ↓
Coding Agent
        ↓
Code
```

这保留了我们 Todo App 实验中得到的经验：

> Project-specific architecture 不能由 generic skill 随便决定。

---

## 16. 当前比较稳定的整体模型

如果把最近这一轮讨论压缩成一张图，我认为现在最接近的是：

```text
                  Raw Change
       Requirement / Idea / Feedback
          Product Edit / Design Edit
                   Code Diff
                       │
                       ▼
                 Normalize Change
                       │
                       ▼
        ┌───────────────────────────┐
        │       Product Model       │
        │      Product Sparks       │
        │                           │
        │ What should the product   │
        │ be now?                   │
        └─────────────┬─────────────┘
                      │ refine
                      ▼
        ┌───────────────────────────┐
        │        Design Model       │
        │       Design Sparks       │
        │                           │
        │ How should software be    │
        │ designed?                 │
        └─────────────┬─────────────┘
                      │ realize
                      ▼
        ┌───────────────────────────┐
        │       Implementation      │
        │                           │
        │ Code / DB / API / Tests   │
        └───────────────────────────┘
```

任何地方再发生变化：

```text
             New Change
                 │
                 └────────────→ LOOP AGAIN
```

也就是说 SparkWell 开始从：

> 一个基于 Spark 的 Code Generation Framework

慢慢变成：

> **一个由 AI 持续维护的、多层软件模型与 realization loop。**

---

## 17. 当前还没有决定的几个核心问题

这部分我觉得暂时不要急着定死。

- **Product Spark 应该有哪些 kind？**  
  可能是 capability、concept、experience、workflow、policy，但我们还没有验证。

- **Product Spark → Design Spark 的关系叫什么？**  
  `refines`、`realizes`、`derived-from` 等还需要仔细定义语义。

- **Product Model 的最小结构到底是什么？**  
  必须足够 structured，支持 AI change propagation，但又不能变成一套繁重的 formal modeling language。

- **第三层 Implementation Spark 是否必要？**  
  目前更倾向先不要。先验证 Product Spark → Design Spark → Code。

- **Loop 到什么程度自动化？**  
  尤其是 code-first changes 对上层的影响，应该是 AI proposal + human review，而不是自动修改。

- **如何判断一个 lower-layer change 是否真的影响 higher layer？**  
  这是未来 reconciliation quality 的关键能力。

---

## 18. 当前最核心的五句话

如果只保留这一轮讨论最核心的五句话：

> **1. Raw requirements are change inputs, not the persistent product truth.**

> **2. Product Sparks form a persistent Product Model describing what the product should be now.**

> **3. Design Sparks refine the Product Model into an actionable Software Design Model.**

> **4. The Design Model is realized through code using project-specific engineering context.**

> **5. Any change, regardless of where it originates, re-enters the loop from the highest abstraction level so every layer can determine whether it is semantically affected.**

三个核心动词：

> **Normalize → Refine → Realize**

截至目前，这已经是从“focus requirements”这条新思路一路推演下来，最完整、也最统一的一版模型。
