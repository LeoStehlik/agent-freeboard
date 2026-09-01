# Evidence - agent-freeboard-v13-dataset-cli

## Build Summary

Agent Freeboard v1.3.0 adds a local dataset CLI to the existing agent-freeboard command. Agents can now define a dataset JSON file, append rows, replace rows from JSON/JSONL, and import rows from CSV without learning the whole Freeboard dashboard schema. README and docs/dataset-cli.md document the contract.

## Checks Run

```bash
npm install
npm audit fix
npm run verify:dataset
npm run verify:cli
npm run verify
git diff --check
```

Observed final verification:

```text
found 0 vulnerabilities
npm run build: Done.
Static asset check passed for 2 HTML files and 6 CSS files.
Dashboard example check passed for 5 dashboard files.
verify:cli validate/create/deploy passed.
verify:dataset define/append/import-csv/replace passed.
Serve save OK.
```

## AC1 - PASS

`scripts/agent-freeboard.mjs` exposes dataset define, append, replace, and import-csv commands.

## AC2 - PASS

README and `docs/dataset-cli.md` document the JSON contract: `agent_freeboard_dataset`, `name`, `columns`, `rows`, and `updated_at`.

## AC3 - PASS

`npm run verify:dataset` exercises define, append, import-csv, and replace.

## AC4 - PASS

`npm run verify` passes, including audit, build, static assets, dashboard examples, CLI validate/create/deploy, dataset workflow, and serve-save check.

## AC5 - PENDING RELEASE

`package.json` is bumped to `1.3.0`; GitHub tag/release/Actions verification happens after merge.
