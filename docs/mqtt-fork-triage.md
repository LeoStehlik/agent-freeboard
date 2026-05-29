# MQTT Fork Triage

Reviewed `joed74/freeboard-mqtt` on 2026-05-29 after upstream issue #287 pointed at active MQTT-focused forks.

## Ported

- `plugins/thirdparty/paho-mqtt.js`: local Eclipse Paho browser client from the fork, including MQTT v5 user properties support present in that copy.
- `plugins/thirdparty/paho.mqtt.plugin.js`: ported as a cleaned bundled datasource plugin under `plugins/freeboard/freeboard.mqtt.datasource.js`.

## Adaptations

- Registered the plugin as a normal bundled datasource, so `js/freeboard.plugins.js` and `js/freeboard_plugins.js` include it after `npm run build`.
- Kept the local Paho client as an external script loaded only when an MQTT datasource is instantiated.
- Preserved `%HOST%` and `%WS%` URL substitutions for dashboards served from different hosts/protocols.
- Preserved MQTT v5 `userProperties` merging into the topic payload object.
- Kept a `connected` boolean in datasource data.
- Changed message handling to retain the last values for other subscribed topics instead of replacing the entire datasource object on every message.
- Removed unsupported setting validators from the fork's plugin definition.

## Skipped For Now

- NETPIE widgets, switches, sliders, picture indicators, dynamic lists, Highcharts, datetime, random datasource, and other fork extras. Those are separate product decisions, not required for a clean MQTT datasource slice.
- Direct UI for publishing MQTT commands from widgets. The datasource keeps a `send(name, value)` hook from the fork for future control widgets, but no new control-widget UX was added in this chunk.
