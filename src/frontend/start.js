/*jslint browser: true, es6: true, this: true*/
/*global requirejs */

(function () {
  'use strict';

  let remap = window.requireAliases || {};

  const js_requires = [].slice.call(document.getElementsByClassName('js-require')).map(function (el) {
    var out = {
      data_name: el.getAttribute('data-name'),
      src: el.getAttribute('data-src')
    };
    remap[out.data_name] = out.src.replace('.js', '');
    return out.data_name;
  });

  requirejs.config({
    paths: remap,
    shim: {
      'zepto': {
        exports: 'Zepto'
      }
    }
  });

  requirejs(js_requires, function () {
    console.log('loaded');
  });
})();
