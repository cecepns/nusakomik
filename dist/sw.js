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
    "revision": "5ccea8088ddc02f01c4164f48cb6831a"
  }, {
    "url": "assets/workbox-window.prod.es5-BqEJf4Xk.js",
    "revision": null
  }, {
    "url": "assets/purify.es-DP5U8-sc.js",
    "revision": null
  }, {
    "url": "assets/jspdf.es.min-B1IQ5j63.js",
    "revision": null
  }, {
    "url": "assets/index.es-rXtKa8Vs.js",
    "revision": null
  }, {
    "url": "assets/index-DckXc279.css",
    "revision": null
  }, {
    "url": "assets/index-CNSOpWhi.js",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-CBrSDip1.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "2a0384ad7e5fee3fd20ccfbfdc73953e"
  }, {
    "url": "favicon.jpg",
    "revision": "5a0c28b3bec3cf81f2519ed6704364be"
  }, {
    "url": "pwa-192x192.png",
    "revision": "ed5b0f200a4bbd95a4dd47986436adba"
  }, {
    "url": "pwa-512x512.png",
    "revision": "746d9a18bf626ad23c85e058f2d7cd6c"
  }, {
    "url": "manifest.webmanifest",
    "revision": "b54399fbdabff4372d2943aab6686c75"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/admin/, /^\/login/]
  }));

}));
