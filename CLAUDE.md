# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file userscript (`antiscroll.user.js`) that de-Reels Instagram's web app: it hides the Reels tab from the nav bar and freezes the reel viewer's pager so an individual reel (e.g. shared in a DM) can be watched but not swiped past into the endless feed. Individual `/reel/<id>/` post links must keep working — the goal is removing the doomscroll surface, not disabling reels playback.

Deployment target: the [Userscripts](https://github.com/quoid/userscripts) Safari extension on iOS 26. Development happens in desktop Chromium with an iPhone device profile + spoofed iOS Safari user agent (DevTools → Network conditions), since there is no Safari debugger available.

## Hard constraints

- **Never target Instagram's generated class names** (`x1i10hfl ...`) — they change between builds. Anchor on `href` attributes, ARIA attributes, DOM shape (child combinators), or computed style instead. Every existing selector follows this rule.
- **Stay at `@grant none` with vanilla DOM APIs.** The iOS Userscripts manager only supports a subset of GM APIs (promise-based `GM.*` form only, each requiring an explicit `@grant`); avoiding them entirely is what keeps the same file working unmodified in both Violentmonkey (Chromium testing) and Userscripts (iOS deployment).
- Instagram is a React SPA: one-shot DOM edits get undone by re-renders. Prefer injected CSS (survives re-renders for free); anything imperative must be re-applied from the MutationObserver sweep.

## Architecture of the script

Three layers, deliberately redundant (Instagram ships DOM changes constantly):

1. **Injected CSS** (`document-start`): hides the Reels tab slot via `div:has(> span > div > a[href^="/reels"])` (child combinators keep `:has()` from matching outer ancestors; `href^="/reels"` matches the tab but not `/reel/<id>/` post links).
2. **JS fallback for the tab**: if the CSS shape stops matching, walks up from any `a[href^="/reels"]` to the highest ancestor containing no *other* links — the tab slot by definition, never the whole nav bar.
3. **Reel pager lock**: the reel viewer is a native scroll container with `scroll-snap-type: y mandatory` (confirmed by capture — see `captures/chain_dm_reel.json`). The script finds it by walking up from each `<video>` checking *computed* style, then forces `overflow-y: hidden !important`. The page's main scroller has no snap type and must never be locked.

Layers 2–3 run in one rAF-throttled sweep driven by a MutationObserver (childList + `style` attribute, since React re-renders can rewrite the locked container's style attribute).

## Working with captures

`captures/` holds sanitized DOM evidence from the spoofed-Chromium session; selectors are derived from these, so consult them before changing selector logic:
- `navbar.html` — outerHTML of the mobile bottom tab bar (username/avatar redacted).
- `chain_dm_reel.json` — video-element ancestor chain (tag, computed overflow/snap, scrollability, size) with a DM-opened reel playing; produced by a console snippet that walks `video.parentElement` upward.

When a selector breaks or a new surface needs covering, request a fresh capture of the same kind rather than guessing. Captures may contain personal data — expect them redacted, don't need the redacted parts.

## Known scope decisions

- DM-opened reels play in an in-place overlay — the URL stays on `/direct/t/<id>/`, so URL-based scoping can't be used to detect the viewer.
- Explore-tab reels were observed non-scrollable on web and are out of scope for the pager lock.
- Chromium testing is a proxy: scroll/touch behavior is where it diverges most from real iOS Safari, so changes to the pager lock need a final on-device test. If iOS gets a JS-driven pager instead of native snap, the planned fallback is capture-phase touch/wheel event interception.
