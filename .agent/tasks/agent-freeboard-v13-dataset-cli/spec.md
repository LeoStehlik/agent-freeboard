# Task: agent-freeboard-v13-dataset-cli

## Task Statement

Ship Agent Freeboard v1.3.0 with a usable Dataset API plus CLI so agents can define, append, replace, and import dashboard data files.

## Acceptance Criteria

**AC1:** CLI exposes dataset define, append, replace, and import-csv commands.
- Verify: run the commands through npm scripts or direct node CLI.

**AC2:** Dataset files have a documented JSON contract with name, columns, rows, and updated_at.
- Verify: inspect README and docs/dataset-cli.md.

**AC3:** Verification covers the dataset CLI.
- Verify: `npm run verify:dataset` and `npm run verify` pass.

**AC4:** Existing dashboard validation/create/deploy/serve paths remain green.
- Verify: `npm run verify` passes.

**AC5:** Release surfaces identify v1.3.0.
- Verify: inspect package.json, Git tag/release, and Actions after release.

## Constraints

- Keep this a local/static dashboard tool, not a hosted SaaS.
- Do not add runtime dependencies for CSV parsing.
- Preserve current dashboard JSON behavior.

## Non-Goals

- No authentication, accounts, or hosted database.
- No MCP server in this slice.

## Verification Approach

Run npm verification, inspect generated dataset artifacts, merge through PR, tag/release, and check GitHub Actions.
