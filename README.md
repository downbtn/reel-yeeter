# anti-scrolling userscript for Instagram

This script removes the reels tab in the lower nav bar and disables scrolling
in reels sent over DMs. Currently only targets Safari on iOS 26 with
[userscripts]([https://github.com/quoid/userscripts), but it _should_ work on
any userscript-able platform.

Instagram's DOM is volatile, so this script may break unexpectedly. It works as
of 7/16/26.

## Installation on iOS 26
1) Set up [Userscripts](https://github.com/quoid/userscripts#installation).
2) Download `antiscroll.user.js` to your phone and place it in the Userscript
directory.
3) Browse to `www.instagram.com` and make sure the script is enabled. You
should now no longer have Reels.

Note that Safari cannot inject userscripts into PWAs (Add to Home Screen). If
you want to have a bookmark to launch Instagram in Safari on your Home Screen,
you can create one using Shortcuts.
