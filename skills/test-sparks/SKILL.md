---
name: test-sparks
description: 'Create, update, or execute test artifacts derived from reviewed Spark design for a configured implementation target. Use when adding behavioral coverage, reconciling tests after Spark or runtime changes, verifying a realization, or reporting covered and unverified intent. Do not use for runtime implementation or Spark design.'
argument-hint: 'Specify root Spark IDs or all, plus a target or profile'
---

# Test Sparks

## Purpose

Create or improve focused test artifacts that verify selected reviewed Sparks for one configured implementation target.

This skill owns test scenarios, test source, test-only configuration, and behavioral coverage reporting. It does not generate or modify production runtime artifacts.

## Preconditions

Use reviewed Sparks as the durable, detailed concept design and coverage source for this workflow.

If testing exposes missing or contradictory product intent, return to `design-sparks`. If it exposes a runtime implementation defect, report it for `implement-sparks`. Do not change Spark or runtime artifacts merely to make a test pass.

## Inputs and Precedence

Always inspect:

1. The requested Sparks, composed descendants, and related contextual Sparks.
2. `.sparkwell/config.yaml` and the selected implementation profile when one exists.
3. `.sparkwell/state/realizations/<implementation-id>.yaml` when it exists.
4. Relevant runtime artifacts and interfaces that realize the selected Sparks.
5. Native test manifests, test configuration, existing tests, CI configuration, and project test guidance.

Load supporting contracts only when needed:

- `.sparkwell/specification.md` and `.sparkwell/conventions.md` to resolve Spark structure or relationships.
- `.sparkwell/implementation-profiles.md` to interpret profile configuration.
- `.sparkwell/realization-state.md` before creating or repairing test-artifact provenance.
- `./references/<target>.md`, when present, for target-specific test guidance.

Reviewed Spark intent defines required observable coverage. Profile constraints and established native test conventions govern target and test implementation choices. If these sources conflict materially, stop and surface the inconsistency rather than encoding one interpretation in a test.

## Resolve Target and Scope

Resolve the profile, effective target, implementation ID, requested roots, candidate scope, and contextual Sparks using the same composition and target rules as `implement-sparks`:

- **Requested roots**: explicitly selected Spark IDs, or every project Spark for `all`.
- **Candidate scope**: requested roots plus all transitively composed descendants.
- **Contextual Sparks**: ancestors, used Sparks, and other concepts read only to understand interactions and risk.

Selecting a child does not include its parent or siblings. A `uses` relationship adds context, not automatic test scope.

## Build the Coverage Plan

For each candidate Spark, derive only applicable scenarios from:

- observable behavior and invariants;
- success, failure, empty, loading, and transitional states;
- validation and boundary rules;
- interactions with composed and used Sparks;
- lifecycle, persistence, concurrency, and recovery behavior;
- applicable platform-specific intent and profile constraints.

Do not manufacture scenarios for topics the concept does not own.

Inspect existing tests and map each scenario to one action:

- **Create**: material behavior has no adequate test coverage.
- **Update**: an existing test no longer expresses reviewed intent or uses an obsolete public interaction.
- **Validate only**: existing coverage appears aligned and only needs execution.
- **Blocked**: intent, runtime availability, test infrastructure, environment, or ownership prevents a defensible test action.

Before editing, summarize candidate scope, scenario coverage, existing coverage, proposed actions, consequential test-infrastructure changes, and blockers.

## Test Infrastructure

Reuse the established test framework, helpers, fixtures, project structure, and CI conventions.

If no compatible test infrastructure exists, adding a framework, dependency, project, runner, browser harness, emulator, or environment setup is a consequential engineering choice. Present the smallest compatible setup and obtain confirmation before adding it unless the user explicitly requested that infrastructure.

Do not replace or migrate an established test framework without an explicit compatible request.

## Create Tests and Maintain State

During test work:

1. Modify only test artifacts and explicitly approved test-only configuration or dependencies.
2. Test observable behavior through stable public interfaces or native interaction surfaces. Avoid asserting incidental implementation structure.
3. Keep coverage proportional to risk. Prefer the smallest scenario set that distinguishes required behavior and likely regressions.
4. Avoid redundant tests, broad snapshots, timing-sensitive waits, and cross-platform matrices unless the reviewed intent or risk requires them.
5. Do not modify production runtime artifacts. Report testability blockers for a separate `implement-sparks` task.
6. Update realization state for test artifacts created or materially maintained from Sparks. Preserve valid runtime and out-of-scope mappings.

Test artifacts may derive from multiple Sparks. Realization state records provenance, not coverage status or correctness.

## Execute and Classify Results

Run the narrowest changed scenarios first, then the smallest relevant regression scope.

Classify failures before editing:

- **Runtime defect**: the implementation violates reviewed intent. Report the failing evidence and hand off to `implement-sparks`; do not change production code here.
- **Test defect**: the test incorrectly expresses reviewed intent or uses an obsolete test interface. Repair the test and rerun it.
- **Intent defect**: requirements or Sparks are missing, ambiguous, or contradictory. Return to `design-sparks`.
- **Environment defect**: required infrastructure or permissions are unavailable. Report the blocked validation and reproducible setup needed.

Do not weaken assertions merely to make a failing implementation pass.

## Report

Summarize:

- effective target, selected profile, and implementation ID;
- requested roots and candidate scope;
- scenarios created, updated, reused, blocked, or still unverified;
- test artifacts and realization-state mappings changed;
- commands executed and results;
- runtime defects, intent defects, environment gaps, and remaining coverage gaps;
- new test infrastructure or dependencies introduced with approval.

Do not claim full coverage merely because all discovered tests pass.

## Guardrails

- Do not design or evolve Sparks in this workflow.
- Do not implement or repair production runtime behavior in this workflow.
- Do not couple tests mechanically one-to-one with Sparks or engineering files.
- Do not introduce broad test infrastructure for a narrow scenario without confirmation.
- Do not encode validation results, coverage percentages, or timestamps in realization state.