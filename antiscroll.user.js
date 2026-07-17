// ==UserScript==
// @name         Instagram: Hide Reels Tab + No Reel Scrolling
// @description  Removes the Reels tab from Instagram's navigation bar and disables swiping to further reels in the reel viewer (e.g. reels opened from DMs).
// @version      1.1
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @run-at       document-start
// @grant        none
// @noframes
// @author       Daniel Ha <downbtn@protonmail.com> + Claude Fable 5
// ==/UserScript==

(function () {
  'use strict';

  // --- Layer 1: pure CSS, survives all React re-renders -------------------
  // Anchors on href + DOM shape only (no generated class names).
  // The tab slot in the bottom nav is:  div > span > div > a[href="/reels/"]
  // Hiding the outermost slot div removes the tab without leaving a gap.
  const css = `
    /* Mobile bottom tab bar: hide the whole tab slot */
    div:has(> span > div > a[href^="/reels"]) {
      display: none !important;
    }
    /* Fallback / other layouts (e.g. desktop sidebar): hide the link's
       immediate wrappers if the slot rule didn't match */
    span:has(> div > a[href^="/reels"]),
    a[href^="/reels"][role="link"] {
      display: none !important;
    }
  `;

  function injectStyle() {
    if (document.getElementById('hide-reels-style')) return;
    const style = document.createElement('style');
    style.id = 'hide-reels-style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  injectStyle();
  // Re-inject if the SPA ever replaces <head> content.
  new MutationObserver(injectStyle).observe(document.documentElement, {
    childList: true,
  });

  // --- Layer 2: JS fallback, structure-agnostic ----------------------------
  // If Instagram changes the wrapper nesting so the CSS above stops matching,
  // this finds any Reels nav link and hides its highest ancestor that
  // contains no *other* links (i.e. the whole tab slot, but never the nav
  // bar itself).
  function hideReelsTabs() {
    for (const link of document.querySelectorAll('a[href^="/reels"]')) {
      let el = link;
      while (
        el.parentElement &&
        el.parentElement.querySelectorAll('a[href]').length === 1
      ) {
        el = el.parentElement;
      }
      if (el.style.display !== 'none') el.style.display = 'none';
    }
  }

  // --- Layer 3: freeze the reel viewer's pager -----------------------------
  // The reel viewer (opened from a DM, etc.) is a native scroll container
  // with CSS scroll-snap ("y mandatory") that pages through an endless list
  // of reels. Forcing overflow-y: hidden on it lets the opened reel play
  // normally but makes swiping to the next one a no-op. The container is
  // identified purely by computed style (snap-y + scrollable) + containing a
  // video, so no generated class names are involved. The page's main
  // scroller has no snap type and is never touched.
  function lockReelPagers() {
    for (const video of document.querySelectorAll('video')) {
      for (
        let el = video.parentElement;
        el && el !== document.body;
        el = el.parentElement
      ) {
        const cs = getComputedStyle(el);
        if (
          cs.scrollSnapType.startsWith('y') &&
          (cs.overflowY === 'scroll' || cs.overflowY === 'auto')
        ) {
          // React re-renders can rewrite the style attribute; the observer
          // below re-runs this and re-locks. The check avoids write loops.
          if (el.style.getPropertyValue('overflow-y') !== 'hidden') {
            el.style.setProperty('overflow-y', 'hidden', 'important');
          }
          break;
        }
      }
    }
  }

  // One throttled sweep for both DOM-based layers.
  let sweepQueued = false;
  function queueSweep() {
    if (sweepQueued) return;
    sweepQueued = true;
    requestAnimationFrame(() => {
      sweepQueued = false;
      hideReelsTabs();
      lockReelPagers();
    });
  }

  const start = () => {
    queueSweep();
    new MutationObserver(queueSweep).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style'],
    });
  };

  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();
