# Agent Freeboard

[![Build](https://github.com/LeoStehlik/agent-freeboard/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/LeoStehlik/agent-freeboard/actions/workflows/ci.yml)

AI-enabled dashboard builder and free open-source alternative to Geckoboard, based on the original Freeboard static dashboard project.

Agent Freeboard is a browser-based dashboard editor and viewer for JSON, MQTT, playback, clock, Dweet.io, OpenWeatherMap, and other plugin-backed data sources. It still keeps the original useful idea: dashboards are plain client-side HTML/CSS/JS, so they can be served as static files, embedded in small systems, or dropped behind your own auth/storage layer.

This fork exists because the original hosted product and old demo links are gone. The goal here is to keep the open-source dashboard useful while making it easier for agents and automation to build, verify, and deploy dashboards: modern build tooling, clean static serving, better examples, safer verification, editor polish, and a first CLI surface without turning it into a heavy hosted SaaS app.

## Current Status

- Node.js 20+ supported
- Node.js 22 used for local development
- Grunt 1.x build chain
- `npm audit` clean at the maintained dependency layer
- Static Docker image served by nginx
- GitHub Actions CI for Node 20 and 22
- Maintained bundled demo dashboard
- Static asset and example-dashboard verification
- First canvas-first editor affordances: inline pane titles and on-canvas add-widget controls
- Bundled MQTT datasource using the Eclipse Paho browser client
- Agent-oriented CLI for validating, creating, and deploying static dashboard bundles

## Build Proof

The GitHub Actions build runs on every push and pull request, plus manual dispatch. It installs dependencies with `npm ci` and runs `npm run verify` on Node.js 20 and 22. Verification audits maintained dependencies, rebuilds distributable bundles, checks static asset references, validates bundled dashboard examples, and exercises the `agent-freeboard` CLI validate/create/deploy path.

## Demo

Run it locally:

```bash
npm install
npm run build
npm run serve
```

Then open:

```text
http://localhost:8080/#source=examples/freeboard-demo.json
```

Or run the Docker/nginx preview:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:8003/#source=examples/freeboard-demo.json
```

## Screenshots

The historical screenshots from the original project are intentionally not embedded here. They pointed at the old upstream branding repo and made this fork look abandoned. Fresh screenshots should be generated from the maintained demo dashboard when the visual direction settles.

## What It Includes

Agent Freeboard provides:

- a draggable pane/grid dashboard layout
- a browser editor for datasources, panes, and widgets
- serializable dashboard JSON
- bundled datasource plugins: JSON, OpenWeatherMap, Dweet.io, Playback, Clock, Octoblu, MQTT
- bundled widget plugins: Text, Gauge, Sparkline, Pointer, Indicator, Traffic Light, Picture, Google Map, HTML
- plugin loading for custom datasource and widget scripts
- static build artifacts for simple hosting

It does not include hosted accounts, database persistence, sharing, auth, or server-side save/load APIs. If you need those, put Agent Freeboard behind your own application shell and use `freeboard.serialize()` / `freeboard.loadDashboard()`.

## Install

```bash
git clone https://github.com/LeoStehlik/agent-freeboard.git
cd agent-freeboard
npm install
npm run build
```

## Development

```bash
npm install
npm run build
npm run verify
```

`npm run verify` runs an npm audit, rebuilds distributable CSS and JavaScript bundles, checks that HTML/CSS static asset references resolve, and validates bundled example dashboards.

## Agent CLI

The first agent-facing interface is a small Node CLI. It gives automation a stable way to validate dashboards, create dashboards from a compact spec, and package a static deployable bundle.

```bash
npm run agent-freeboard -- validate examples/freeboard-demo.json
npm run agent-freeboard -- create examples/agent-dashboard-spec.json --out .artifacts/agent-dashboard.json
npm run agent-freeboard -- deploy .artifacts/agent-dashboard.json --out .artifacts/agent-dashboard-site
```

The generated site opens at:

```text
.artifacts/agent-dashboard-site/index.html#source=dashboard.json
```

The compact spec is intentionally boring JSON so agents, MCP tools, scripts, and CI jobs can emit it without needing to understand every Freeboard widget field. A metric looks like:

```json
{
  "pane": "Service Health",
  "title": "Uptime",
  "value": "datasources[\"Demo API\"].system.uptime_percent",
  "kind": "gauge",
  "min": 95,
  "max": 100,
  "units": "%"
}
```

This CLI is the first product slice toward an API/MCP surface. The next clean layer is to wrap the same commands as MCP tools rather than inventing a separate dashboard contract.

## Static Serving

```bash
npm run serve
```

Then open:

```text
http://localhost:8080/
```

## Docker

```bash
docker compose up --build
```

Then open:

```text
http://localhost:8003/
```

## Dashboard JSON

Load a dashboard by URL hash:

```text
http://localhost:8080/#source=examples/freeboard-demo.json
```

A dashboard can also be loaded programmatically:

```javascript
freeboard.loadDashboard(configuration, function() {
    freeboard.setEditing(false);
});
```

## MQTT Datasource

The bundled MQTT datasource uses a local Eclipse Paho browser client and connects to MQTT brokers over WebSockets.

Settings:

- `Broker WebSocket URL`: `ws://` or `wss://` broker URL. `%HOST%` expands to the current page host. `%WS%` expands to `ws` or `wss` based on the current page protocol.
- `Client ID`: base client ID; a random suffix is added per browser session.
- `Topics`: one or more topics to subscribe to. MQTT wildcards are allowed.

Payload behavior:

- JSON payloads are parsed into objects.
- Plain text payloads become `{ payload: "..." }`.
- MQTT v5 `userProperties` are copied onto the payload object.
- The datasource exposes a `connected` boolean.

## Calculated Values

Calculated widget fields still accept JavaScript expressions against `datasources`.

Simple example:

```javascript
datasources["Demo API"].service.error_rate
```

For deeper JSON where long bracket chains get awkward, use `freeboard.selectPath(data, path)`.

```javascript
freeboard.selectPath(datasources["Demo API"], "/service/error_rate")
```

`selectPath` supports JSON Pointer-style `/a/b/0` paths for plain objects and arrays. If passed a DOM node or document, it evaluates the path as browser XPath and returns a scalar value or an array of matching node text values.

## API

All API calls are made on the `freeboard` singleton object.

-------

**freeboard.initialize(allowEdit, [callback])**

Must be called first to initialize freeboard.

> **allowEdit** (boolean) - Sets the initial state of freeboard to allow or disallow editing.

> **callback** (function) - Function that will be called back when freeboard has finished initializing.

-------

**freeboard.newDashboard()**

Clear the contents of the freeboard and initialize a new dashboard.

-------

**freeboard.serialize()**

Serializes the current dashboard and returns a javascript object.

-------

**freeboard.loadDashboard(configuration, [callback])**

Load the dashboard from a serialized dashboard object.

> **configuration** (object) - A javascript object containing the configuration of a dashboard. Normally this will be an object that has been created and saved via the `freeboard.serialize()` function.

> **callback** (function) - Function that will be called back when the dashboard has finished loading.

-------

**freeboard.setEditing(editing, animate)**

Programmatically control the editing state of the dashboard.

> **editing** (bool) - Set to true or false to modify the view-only or editing state of the board.

> **animate** (function) - Set to true or false to animate the modification of the editing state.

-------

**freeboard.isEditing()**

Returns whether the dashboard is in view-only or edit state.

-------

**freeboard.loadDatasourcePlugin(plugin)**

Register a datasource plugin. See `docs/plugin_example.html` for information on creating plugins.

> **plugin** (object) - A datasource plugin definition object.

-------

**freeboard.loadWidgetPlugin(plugin)**

Register a widget plugin. See `docs/plugin_example.html` for information on creating plugins.

> **plugin** (object) - A widget plugin definition object.

-------

**freeboard.showLoadingIndicator(show)**

Show or hide the loading indicator.

> **show** (boolean) - Set to true or false to show or hide the loading indicator.

-------

**freeboard.showDialog(contentElement, title, okButtonTitle, cancelButtonTitle, okCallback)**

Show a styled dialog box with custom content.

> **contentElement** (DOM or jQuery element) - The element to display inside the dialog.

> **title** (string) - Dialog title.

> **okButtonTitle** (string) - OK button label. A null or undefined value hides the button.

> **cancelButtonTitle** (string) - Cancel button label. A null or undefined value hides the button.

> **okCallback** (function) - Called if the user presses OK.

-------

**freeboard.getDatasourceSettings(datasourceName)**

Returns an object with the current settings for a datasource or null if no datasource with the given name is found.

> **datasourceName** (string) - The datasource name in the dashboard.

-------

**freeboard.setDatasourceSettings(datasourceName, settings)**

Updates settings on a datasource.

> **datasourceName** (string) - The datasource name in the dashboard.

> **settings** (object) - Key-value pairs to merge with the datasource's current settings.

-------

**freeboard.selectPath(data, path)**

Selects a nested value for use in calculated widget expressions.

> **data** (object, array, DOM node, or document) - The value to query.

> **path** (string) - JSON Pointer-style path for objects/arrays, or browser XPath for DOM nodes/documents.

-------

**freeboard.on(eventName, callback)**

Attach to a global freeboard event.

Supported events:

- `dashboard_loaded`: occurs after a dashboard has loaded.
- `initialized`: occurs after Freeboard first initializes.

## Building Plugins

See `docs/plugin_example.html` for the original plugin example. Custom plugins can also be loaded from the in-app Developer Console.

## Testing Plugins

Edit `index.html` and add your plugin script near the `head.js` loader:

```javascript
head.js("js/freeboard_plugins.min.js",
    "path/to/my/plugin/file.js",
    function() {
        $(function() {
            freeboard.initialize(true);
        });
    });
```

## Notes On The Original Project

This repository remains MIT-licensed and preserves the original Freeboard copyright notices. The original hosted service and demo are no longer maintained; this fork is maintained as a standalone static dashboard builder.

## License

Copyright © 2013 Jim Heising (https://github.com/jheising)<br>
Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)<br>
Copyright © 2026 Leo Stehlik (https://github.com/LeoStehlik)<br>
Licensed under the MIT license.
