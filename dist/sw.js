/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "index.html",
    "revision": "dbdc2f3d416c7c6b25110fdceaebd728"
  }, {
    "url": "assets/workbox-window.prod.es5-BqEJf4Xk.js",
    "revision": null
  }, {
    "url": "assets/purify.es-DP5U8-sc.js",
    "revision": null
  }, {
    "url": "assets/jspdf.es.min-DSd0BFWo.js",
    "revision": null
  }, {
    "url": "assets/index.es-DJjJm287.js",
    "revision": null
  }, {
    "url": "assets/index-DriXN0CQ.css",
    "revision": null
  }, {
    "url": "assets/index-CPDeGTxN.js",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-CBrSDip1.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e1b88bc5a4e2ad525ea072ed759ce301"
  }, {
    "url": "favicon.jpg",
    "revision": "29224d53742d106f1f9612a8c9a3439c"
  }, {
    "url": "pwa-192x192.png",
    "revision": "799875855e1e2f3e16bbefb95538cbf4"
  }, {
    "url": "pwa-512x512.png",
    "revision": "6d1b7e95d13536320b49f261b3636ea9"
  }, {
    "url": "manifest.webmanifest",
    "revision": "662f53e6e34c51bd8aee362a4b9f521b"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/admin/, /^\/login/]
  }));

}));
