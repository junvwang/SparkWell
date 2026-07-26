# Sparkwell Project Instructions

SparkWell is opt-in. This file defines activation only; each command's Agent Skill defines its workflow.

## Activation

Activate SparkWell only when the current user message directly invokes one of these slash commands:

- `/spark-design`
- `/spark-config`
- `/spark-impl`
- `/spark-test`

Without one of these commands, use the normal coding-agent workflow and do not load a SparkWell Skill, modify Spark Documents because SparkWell might apply, or impose a SparkWell checkpoint. Mentioning Sparks or changing software intent does not activate SparkWell.

A command activates only its named Skill for the current request. Follow that Skill and never start another SparkWell workflow automatically; report the next slash command and stop.

## Pending Proposals

The only implicit continuation is the direct reply to the latest complete proposal produced by `/spark-design` or `/spark-config`:

| Control | Effect |
|---|---|
| `Revise: <comments>` | Continue the same Skill and return one complete replacement proposal without writing files |
| `Finalize` | Continue the same Skill and permit only the files allowed by that proposal |
| `Cancel` | End the pending workflow without writing files |

Match controls case-insensitively after trimming whitespace; `Revise:` requires the colon. Accept them only when the latest complete proposal is unambiguous. Do not treat silence, `yes`, `looks good`, or other feedback as `Finalize`.

Any other message ends implicit continuation. Resume later with the originating slash command and enough proposal context. Keep proposal and approval state in chat only.
