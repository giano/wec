/*jslint browser: true, es6: true, this: true*/
/*global requirejs */

define(function () {
  'use strict';

  return {
    load: function (name, req, onload, config) {
      requirejs(['json!busters.json'], function (busters) {
        let url = req.toUrl(name);
        let cleanedUrl = url.replace(/^\/|\/$/g, '').toLowerCase();
        if (busters[cleanedUrl]) {
          url = url + ((name.indexOf('?') < 0) ? '?' : '&') + "_bst_=" + busters[cleanedUrl];
          req([url], function (mod) {
            onLoad(mod);
          });
        } else {
          onload();
        }
      });
    }
  };
});
