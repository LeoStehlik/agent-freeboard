# Upstream Issue Triage

Reviewed open issues from `Freeboard/freeboard` on 2026-05-29. Upstream is treated as abandoned product notes for this fork; useful fixes were ported directly when they were small, testable, and still relevant.

## Ported

- #82 `Widget Text cannot display "0"`: changed the animated text widget value comparison to strict equality so an initial numeric `0` renders instead of being treated like an unchanged empty value.
- #121 `Numeric settings values throw exception` and #202 `Calculated setting of a widget gives error if is a number`: calculated widget settings are normalized to strings before `.match()` / `.indexOf()` handling, while preserving the generated expression behavior.
- #146 `Mixed Content error when serving freeboard over https. (Dweet.io script)` and #283 `Please help with Freeboard on Github IO`: the Dweet.io datasource now loads its client script over HTTPS.
- #271 `HTML Widget display overflow`: the bundled HTML widget now allows internal scrolling for overflowing content.
- #30 `Toggle numeric value on/off for gauge widget`: gauges now have a `Show Value` boolean setting for dashboards where large numeric labels make the gauge messy.

## Already Covered

- #44 `Delete button in JSON datasource header fields doesn't work.`: the current array setting editor removes sub-rows and updates stored settings; no separate patch needed after smoke coverage.
- #93 `Widget's "onDispose()" not called`: covered by `f690452`, which disposes widget plugin instances on delete.
- #125 `Indicator Light widget ON and OFF text not calculated`: already covered by this fork's indicator widget implementation.
- #146/#283 mixed-content behavior is covered by the HTTPS Dweet script update in this chunk.
- #175/#276 admin layout issues are partially covered by `f690452`'s admin-bar overflow fix.
- #207 upgrade versions, #213 serving docs, and #258 broken demo are covered by the modernization and demo-dashboard work already in this branch.

## Skipped For Now

- #5 websocket datasource, #52 active/button widgets, #62 bar chart widget, #72 table widget, #86 SNMP datasource, #96 RSS widget, #130/#197 D3/chart work, #205 charting UX: useful product directions, but too large for an abandoned-issue port pass.
- #17 datasource rename reference migration and #51 partial datasource updates: real model-level behavior changes with higher regression risk; better handled as dedicated WYSIWYG/editor work.
- #13 datasource error reporting: still worthwhile, but needs a coherent UI surface instead of scattered console/log patches.
- #16 automatic JSONP fallback, #47 non-standard-port Dweet behavior, #219 full Dweet payload, #240/#244 JSON POST: datasource behavior/API changes that need modern endpoint testing before carrying forward.
- #23 free-form positioning and #69 responsive design: overlap with the larger editor/canvas direction, not a quick issue fix.
- Website/support/doc-only issues such as #37, #48, #53, #56, #85, #127, #180, #246, #255, #285, #287, and #289 were not ported as code.
