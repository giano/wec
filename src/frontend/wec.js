/*jslint browser: true, es6: true, this: true*/
/*global requirejs */

define(function () {
  'use strict';

  let slugify = function slugify(text) {
    return text.toString().toLowerCase().replace(/\s+/g, '-'). // Replace spaces with -
    replace(/[^\w\-]+/g, '-'). // Remove all non-word chars
    replace(/\-\-+/g, '-'). // Replace multiple - with single -
    replace(/^-+/, ''). // Trim - from start of text
    replace(/-+$/, ''); // Trim - from end of text
  };

  return {
    load: function (name, req, onload, config) {
      requirejs(['json!busters.json'], function (busters) {
        let id = 'wec-' + slugify(name);
        if (!document.getElementById(id)) {
          name = '/' + window.webComponentsMountpoint + '/' + name.split('!').pop();
          let url = req.toUrl(name);
          let cleanedUrl = url.replace(/^\/|\/$/g, '').toLowerCase();
          if (busters[cleanedUrl]) {
            url = url + ((name.indexOf('?') < 0) ? '?' : '&') + "_bst_=" + busters[cleanedUrl];
          }
          let importLink = document.createElement('link');
          importLink.setAttribute('rel', 'import');
          importLink.setAttribute('id', id);
          importLink.setAttribute('href', url);
          importLink.addEventListener('load', function () {
            onload();
          });
          document.head.appendChild(importLink);
        } else {
          onload();
        }
      });
    }
  };
});
