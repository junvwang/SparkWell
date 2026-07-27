# SparkWell 当前状态与 Roadmap

> 最后检查：2026-07-27
>
> 本文档是可变的项目状态快照。稳定的问题背景、核心假设和长期愿景见 [SparkWell 愿景上下文](sparkwell-vision-context-zh.md)。

## 当前可用能力

- `/spark-design`：Proposal、显式确认、Spark Document 生成和文档评审停点；
- `/spark-impl`：按 profile、Guidance、Pack 和 native architecture 实现 Sparks；
- `/spark-test`：独立的测试生成、执行和失败分类流程；
- `specification.md`、项目自有 `conventions.md` 与 `design-context.md`、implementation profiles 和 realization provenance；
- GitHub Copilot、Claude Code、`AGENTS.md` 适配器；
- 显式安装、按 profile 激活的 optional implementation packs；
- OpenAPI producer、server、client 和 test guidance pack；
- 初始化、合并、冲突保护、Pack 投影和方法论契约的自动化测试。

Profile 与 Guidance 是项目自有输入，通过初始化生成的可复制 placeholder 手工建立，并随项目逐步维护；它们不是独立的 SparkWell workflow。

当前仓库中的 TodoApp 仅保留 SparkWell 项目投影，不再维护 Web 或 Windows runtime realization。因此，当前状态不声称已经具备一个持续验证的多平台端到端 Demo。

## 尚未充分证明

- Spark 是否比传统 Design Doc 更容易长期维护；
- 多轮需求演化能否稳定保持局部修改；
- 手工代码修改后的 reconciliation 是否可靠；
- 大型项目中的 Spark granularity 和 graph 是否仍易于理解；
- Pack 模型是否能支持 OpenAPI 之外的真实技术扩展；
- 开发者是否认为收益高于额外 ceremony。

## 近期验证重点

1. 建立一个刻意维护的小型 vertical example，而不是依赖一次性生成结果。
2. 用 due date、priority 或类似需求演示 Spark evolution、影响分析和局部 realization 更新。
3. 验证未受影响 Sparks 和 artifacts 在演化中保持稳定。
4. 验证既有项目架构、手工代码和 project guidance 的 reconciliation。
5. 用第二种技术实现 Pack 验证 extension contract，而不是继续向 Core 加入技术规则。
6. 邀请真实 Coding Agent 用户试用，记录价值、困惑和不必要的 ceremony。
7. 根据实践反馈继续删减规范和工作流，而不是先扩展更多概念。

## 后续产品方向

Spark Browser、Spark Graph、Impact Analysis、Reconciliation、Visual Review 和 Legacy Extraction 都是候选方向，不是当前已承诺的功能。只有在核心工作流通过真实项目验证后，才应逐步推进更完整的可视化体验。