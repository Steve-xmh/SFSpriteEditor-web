if(!self.define){let s,e={};const i=(i,l)=>(i=new URL(i+".js",l).href,e[i]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=i,s.onload=e,document.head.appendChild(s)}else s=i,importScripts(i),e()})).then((()=>{let s=e[i];if(!s)throw new Error(`Module ${i} didn’t register its module`);return s})));self.define=(l,n)=>{const r=s||("document"in self?document.currentScript.src:"")||location.href;if(e[r])return;let o={};const t=s=>i(s,r),u={module:{uri:r},exports:o,require:t};e[r]=Promise.all(l.map((s=>u[s]||t(s)))).then((s=>(n(...s),o)))}}define(["./workbox-bc55f1ff"],(function(s){"use strict";self.addEventListener("message",(s=>{s.data&&"SKIP_WAITING"===s.data.type&&self.skipWaiting()})),s.precacheAndRoute([{url:"assets/index.4a1a97f8.js",revision:null},{url:"assets/index.8b054d8e.css",revision:null},{url:"assets/vendor.ce0c0ec9.js",revision:null},{url:"index.html",revision:"0d3bb327d3c85c52546723c3fee71a8e"},{url:"registerSW.js",revision:"e47a915ee891758559929061b1acf04f"},{url:"assets/about.0a1d63cc.svg",revision:null},{url:"assets/animations.8f4c40d6.svg",revision:null},{url:"assets/arrow-down.1a3ee976.svg",revision:null},{url:"assets/arrow-up.06c63170.svg",revision:null},{url:"assets/close.118c94c1.svg",revision:null},{url:"assets/edit.92bd30f3.svg",revision:null},{url:"assets/favicon.4e266c99.ico",revision:null},{url:"assets/file.b7b060c3.svg",revision:null},{url:"assets/options.1a71d1bd.svg",revision:null},{url:"assets/palettes.65801d8f.svg",revision:null},{url:"assets/remove.cbaf4f15.svg",revision:null},{url:"assets/sprites.86b9177b.svg",revision:null},{url:"assets/tiles.491a2d06.svg",revision:null},{url:"icon.png",revision:"bd2d3b55b6dccfb7b16285af81cd1406"},{url:"manifest.webmanifest",revision:"e6f79c46cf56b776c13a5c24014f2365"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
