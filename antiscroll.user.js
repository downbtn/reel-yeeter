// ==UserScript==
// @name         Instagram: Hide Reels Tab
// @description  Removes the Reels tab from Instagram's navigation bar (mobile web & desktop sidebar).
// @version      1.0
// @match        https://www.instagram.com/*
// @match        https://instagram.com/*
// @run-at       document-start
// @grant        none
// @noframes
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

  const start = () => {
    hideReelsTabs();
    new MutationObserver(hideReelsTabs).observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  if (document.body) {
    start();
  } else {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  }
})();
