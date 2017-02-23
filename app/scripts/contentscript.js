'use strict';

var s = document.createElement('script');
s.src = chrome.extension.getURL('scripts/injection.js');
s.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(s);