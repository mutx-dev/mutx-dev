# PRD and Story Shaping for Ralph

## Core Constraint

Each `userStories[]` entry in `prd.json` must be small enough to complete in one iteration with one fresh context.

Ralph works best when stories are:
- dependency-ordered
- independently verifiable
- narrow in scope
- able to pass checks before the iteration ends

## `prd.json` Shape

The repo’s example uses this structure:

- `project`
- `branchName`
- `description`
- `userStories[]`
  - `id`
  - `title`
  - `description`
  - `acceptanceCriteria[]`
  - `priority`
  - `passes`
  - `notes`

`branchName` is typically `ralph/<feature-kebab-case>`.

## Ordering Pattern

Prefer this sequence:
1. schema or migration work
2. backend or server logic
3. UI components using that backend
4. filters, summary views, or aggregation layers

Avoid putting UI before the schema or API it depends on.

## Acceptance Criteria Rules

Use criteria Ralph can check directly.

Good:
- “Add priority column to tasks table with default `medium`”
- “Filter dropdown contains All, High, Medium, Low”
- “Typecheck passes”
- “Tests pass”
- “Verify in browser using dev-browser skill”

Bad:
- “works correctly”
- “good UX”
- “handles edge cases”

## When to Split a Story

Split the story if it:
- touches many layers at once
- cannot be described in 2–3 sentences
- likely needs more than one commit-sized change set
- cannot be verified by one round of checks and browser validation
- would require significant architectural discovery mid-iteration

Examples of bad story size:
- build the entire dashboard
- add authentication
- refactor the API

Convert those into smaller dependency-ordered stories.

## UI Story Rule

If the story changes UI, include explicit browser verification in acceptance criteria. The repo’s prompts treat browser verification as required for frontend work.

## Branch and Archive Semantics

Ralph archives previous runs when the `branchName` changes. Keep branch names stable and feature-specific so archive folders remain meaningful.
