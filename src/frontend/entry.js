/*jslint browser: true, es6: true, this: true*/
/*global requirejs */

(function () {
  'use strict';

  var original_register_element = document.registerElement;

  document.registerElement = function registerElement() {
    try {
      original_register_element.apply(document, arguments);
    } catch (e) {
      console.log(e);
    } finally {

    }
  };

  requirejs([
    'zepto',
    'webcomponents',
    'socket.io',
    'bluebird',
    'api_caller',
    'wec!polymer/polymer.html',
    'wec!app/base-app.html',
    'wec!paper-elements/paper-elements.html',
    'wec!parallax-element/parallax-element.html',
    'wec!app-route/app-route.html',
    'wec!sv-submit/sv-submit.html'
  ], function ($, wc, io, Promise, apiCaller) {
    setTimeout(function () {
      document.body.removeAttribute('unresolved');
    }, 100);
  });
})();
