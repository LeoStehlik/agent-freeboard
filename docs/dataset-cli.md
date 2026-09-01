# Dataset CLI

The dataset CLI is the v1.3 product slice: a small file format plus commands an agent can run without understanding the whole Freeboard dashboard schema.

## Commands

```bash
agent-freeboard dataset define data/status.json --name "Status" --columns service,status,count
agent-freeboard dataset append data/status.json --row '{"service":"api","status":"ok","count":2}'
agent-freeboard dataset import-csv examples/freeboard-demo-data.csv --out data/status-from-csv.json --name "CSV Status"
agent-freeboard dataset replace data/status.json --input data/status-from-csv.json
```

## Contract

```json
{
  "agent_freeboard_dataset": 1,
  "name": "Status",
  "columns": ["service", "status", "count"],
  "rows": [
    { "service": "api", "status": "ok", "count": 2 }
  ],
  "updated_at": "2026-09-01T00:00:00.000Z"
}
```

The file is a normal JSON datasource. Keep it next to the dashboard bundle, serve it statically, and use calculated widget values such as:

```javascript
datasources["Status"].rows[0].count
```

## Boundaries

- This is not a hosted database.
- Writes are local file writes from the CLI.
- CSV import is intentionally small and dependency-free.
- For live multi-user writes, put Agent Freeboard behind your own app/storage layer.
