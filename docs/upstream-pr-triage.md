# Upstream PR Triage

Reviewed open PRs from `Freeboard/freeboard` on 2026-05-29. Upstream is treated as abandoned source material for this fork; useful fixes were ported directly instead of preserving upstream branch shape.

## Ported

- #142 `Fixed saveDialog for firefox.`: explicit Knockout event argument for the save menu click handler.
- #144 `.form-row clear floating not correct`: adds a clearfix pseudo-element so form rows wrap floated label/value cells reliably.
- #187 `Do not fail when external_scripts is an empty array.`: guards datasource and widget external script loading against empty arrays.
- #191 `Issue #93`: disposes widget plugin instances when widgets are deleted.
- #217 `convert integer type setting to integer`: parses `integer` settings as integers instead of strings.
- #135 `Made picture widget preload before refreshing`: preloads refreshed picture URLs before swapping the dashboard background image.
- #32 `Added "small" text format option to text widget`: adds a small text-widget size option.
- #254 `Adding traffic light widget.`: ported as a cleaned traffic-light status widget.
- #278 `Fix to admin bar display issues on mobile and tablet`: adapted as constrained admin-bar overflow instead of unconditional scrollbars.

## Already Covered

- #266 `Fix #207 by updating grunt versions and including dependencies.`: superseded by this fork's modern Grunt 1.x / Node 20+ build work.
- #213 `Added grunt serve for basic webserver functionality...`: superseded by this fork's `npm run serve`, Docker static serving, README, and CI updates.
- #94 `Fix bug with not using calculated value of indicator texts`: already present in this fork's indicator widget implementation.

## Skipped

- #275 `Added Light theme and OS dark mode preference support`: broad visual rewrite with noisy icon/theme churn; conflicts with the current restrained dark dashboard refresh.
- #227 `changed freeboardUI constructor and replaced constants with variables`: low user value now; better handled later if layout settings become productized.
- #200 `optimize png images using zopflipng`: binary-only image churn, no functional value.
- #197 `Sparkline`: very large old D3/NVD3 bundle; current text widget already supports sparklines.
- #194 `Dev`: unrelated NETPIE fork/vendor dump.
- #155 `GitHub datasource`: old unauthenticated GitHub datasource and demo; too stale to carry as default surface.
- #136 `Battery widget plugin`: depends on an old browser battery API/polyfill path and has limited modern browser value.
- #130 `D3.js Plugin for Awesome Visualizations`: old D3 plugin drop without enough maintained product fit.
