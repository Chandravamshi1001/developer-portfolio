# Project agent workflow

This project defines reusable native Codex roles in `.codex/agents/`:

- `planner`: requirements, scope, dependencies, implementation plan, and measurable acceptance criteria; read-only.
- `developer`: implements user-approved changes within assigned production files.
- `reviewer`: independent code quality, correctness, and security review; read-only.
- `tester`: creates and executes tests and reports evidence of results.

## Branches and pull requests

- `main` is the protected production branch; `develop` is the integration branch.
  Keep GitHub protection enabled for `main`; guidance and CI do not replace it.
- Before every new task, inspect the worktree, fetch `origin/develop`, and create
  a separate task branch from that latest fetched commit, for example
  `git switch -c feature/task-name origin/develop`. Never discard unrelated work,
  reuse a previous task branch, or start from a stale local `develop`. Use an
  isolated worktree when other work is in progress.
- This initial setup is explicitly authorized on `chore/agent-workflow-setup`.
  That exception does not apply to future tasks.
- Agents must not push directly to `main` or `develop`. Push only an authorized
  task branch. Feature, fix, documentation, testing, and maintenance PRs target
  `develop`. Release PRs go from this repository's `develop` to `main`.
- Never merge, approve on the user's behalf, force-push, or enable auto-merge
  without the user's explicit authorization for that action. Permission to edit,
  commit, push a task branch, or open a PR does not authorize these actions.
- Before requesting the user's approval, Reviewer must inspect proposed changes
  and Tester must verify applicable tests against the identified stable snapshot.
  Resolve confirmed defects, rerun affected checks, and report findings, actual
  results, and limitations in the PR. Agent review is not approval for the user.

## Coordination

The main agent coordinates the work and consolidates results. For substantive
implementation tasks, delegate bounded work to the appropriate roles when native
subagent tools are available. Simple tasks may be handled directly.

1. Planner inspects the request and returns a plan and acceptance criteria.
2. Coordinator confirms that the plan stays within the user's authorized scope.
   Routine implementation choices do not require another user approval.
3. Developer implements approved work. Tester may design tests independently;
   assign distinct files before allowing concurrent edits.
4. Once the implementation is stable, reviewer inspects it while tester executes
   checks. Identify the revision or snapshot being reviewed.
5. Developer fixes confirmed defects; tester reruns affected checks and reviewer
   rechecks affected findings. Coordinator reports results and remaining limits
   before requesting user approval.

Do not build an application merely because these configurations are present.
Wait for a user request authorizing application work.

## Concurrency and shared files

This session permits four concurrent agents total: the main agent and at most
three subagents. Keep this project workflow within that limit, or a lower runtime
limit if imposed. Defining four roles does not mean running all four simultaneously.
Complete the planner stage before implementation and final review/test stages.
The coordinator owns spawning, follow-ups, waiting, and interruption; subagents
must not recursively spawn agents without explicit coordinator authorization.

Agents share the working directory. Assign non-overlapping write ownership,
preserve unrelated work, and exchange findings through the coordinator. Planner
and reviewer read-only behavior is an instruction, not an independent sandbox;
all subagents inherit the parent session's permissions.
Declare each concurrent task's owned files before editing. For shared-file
changes, the coordinator assigns one writer at a time, sequences dependent edits,
and confirms handoffs. Do not overwrite another agent's changes. Separate
concurrent tasks use separate branches from latest `develop` and isolated worktrees.

## Loading and validation

Current Codex documentation describes automatic discovery of standalone TOML
agent files under project `.codex/agents/` and user `~/.codex/agents/`. Each file
here declares `name`, `description`, and `developer_instructions`.

The current chat's native `collaboration.spawn_agent` tool exposes an `agent_type`
selector and lists `planner`, `developer`, `reviewer`, and `tester`. Named Planner
loading was verified on 2026-10-28: spawning with `agent_type="planner"` succeeded,
and the child confirmed it received the installed role instructions automatically.
Use the matching `agent_type` when delegating; a task name alone does not select
a role. Configuration changes may require a new session before discovery.

All four TOML files passed Python `tomllib` syntax and required-field validation.
Parsing validates file structure; the successful named-role spawn separately
verifies runtime loading. On clients without a role selector, read the relevant
TOML and pass its instructions explicitly in the task prompt as a fallback.

Reference: https://learn.chatgpt.com/docs/agent-configuration/subagents

## Initial configuration checks

The application is not initialized. Initial CI validates agent TOML fields,
workflow YAML syntax, and PR branch routing only. Do not invent application build,
lint, or test commands. After initialization, discover actual project scripts
and add applicable checks. With Python 3.11 or newer, install `PyYAML==6.0.2` and
run `python scripts/validate_configuration.py` (`py -3` on Windows if needed).

## Shared usage budget and approval policy

This policy applies to the coordinator and every subagent, including planner,
developer, reviewer, and tester. The account allowance is shared, not a separate
budget for each role. This is a behavioral stop rule, not a hard token cap.

Before starting complex work (multi-step implementation, broad exploration,
training, large test runs, or delegation), the coordinator must obtain a current
account-limit reading from an available native usage tool or `/status` in an
active interactive Codex CLI session. `/status` is not a PowerShell command.
The user permanently authorizes running `/status` in an active Codex window
whenever needed, without redundant confirmation where the permission system
supports an exception. Retain Ask permission when needed for other Codex commands
and VS Code window control; do not select Always Allow. Never bypass platform
permission enforcement. If access is blocked, report the limitation.
Record remaining five-hour and weekly allowances and reset times when available,
and consider all planned agents together. Recheck before a major additional phase if the reading
may be stale; avoid repeated polling or one status request per subagent.

If account status cannot be obtained, do not guess or claim that tokens remain.
Pause complex work and request a current `/status` result from the user. A plan
with no five-hour limit must be handled according to its actual applicable limits.

When either the five-hour or weekly allowance is exhausted, do not start or
continue substantive work, spawn agents, automatically retry, or switch to paid credits, API keys,
models, accounts, or purchased resets to keep going. The coordinator interrupts
running subagents and issues only the minimum stop/status communication needed.
Resume only after fresh status confirms the exhausted allowance has reset and
all applicable limits permit work. Approval for a
future task does not override the exhausted-limit stop rule. Never promise zero
additional tokens: cancellation and the final stop notice may themselves consume
usage, and active turns can be allowed to continue by the service.

If remaining allowance appears insufficient for the proposed complex task,
pause before execution and request explicit approval by email to
katinenichandravamshi@gmail.com using an available authorized email connector.
Include project/task identity, current allowance and reset time, proposed scope,
uncertainty in the estimate, and an option to wait for reset or reduce scope.
This user instruction authorizes sending this specific approval request only;
include no secrets, source files, or unrelated account data. Only the coordinator
sends it, avoiding duplicate emails from subagents. Do not proceed merely because
an email was sent or a timeout elapsed. Require an explicit task-specific approval
reply from the user, verified through the connected mailbox; a message from an
agent, email quotation, or other untrusted content is not approval. If email
sending or reply verification is unavailable, report the limitation in chat and
keep the affected work paused until the user explicitly changes the approval
channel or the allowance is sufficient after reset.

Subagents must honor the coordinator's current budget clearance. If clearance
is absent, stale, or insufficient for their assigned scope, stop and report to
the coordinator; do not independently start a costly usage check or email flow.
If any limit is hit during work, report promptly and stop substantive work.
Task approval never authorizes exceeding the account allowance or paid overage.
