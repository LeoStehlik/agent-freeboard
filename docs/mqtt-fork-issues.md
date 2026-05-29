# joed74/freeboard-mqtt Issue Triage

Reviewed: 2026-05-30

Source: https://github.com/joed74/freeboard-mqtt/issues

This pass treats the MQTT fork issue tracker as abandoned-but-useful product notes. The goal is not to mirror the fork, only to lift ideas that fit this maintained Freeboard fork.

## Ported

### #4 Support XPath in value fields

Useful idea: complex datasource structures are awkward to reference with long `datasources["name"].a.b[0]` expressions.

Decision: do not pull in a JSON XPath dependency. Add a small `freeboard.selectPath(data, path)` helper instead:

- JSON objects and arrays support JSON Pointer-style paths such as `/service/error_rate`.
- DOM nodes/documents use browser XPath through `document.evaluate`.
- Existing calculated JavaScript expressions remain fully compatible.

This gives dashboards a cleaner path-expression option without changing the old calculated-value model.

## Already Covered

### #2 Demo would be helpful

Covered by `examples/freeboard-demo.json`, `examples/freeboard-demo-data.json`, README demo instructions, and dashboard example verification.

### #5 Update project name and description?

Covered by the repo cleanup pass: README now describes this fork as a maintained static dashboard builder, GitHub repo description was updated, and the stale homepage was cleared.

### #3 Sparkline often stops working when loaded from dashboard.json

The fork fixed a bug caused by unscoped per-widget sparkline functions being shared across widget instances. This fork's current sparkline widgets do not use that unscoped `updateSparkline` / `updateInterval` pattern, so there was no equivalent patch to port.

## Skipped

### #1 Dynamic List

Good direction for home-automation dashboards, but it is a larger control-widget/product pass. It depends on icon conventions, MQTT feedback topics, and double-click send behavior. Keep it separate from the small issue-port cleanup.
