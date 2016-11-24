/*jslint browser: true, es6: true, this: true*/
/*global requirejs */

(function () {
  'use strict';

  let config = {
    paths: {
      //create alias to plugins (not needed if plugins are on the baseUrl)
      async: "requirejs-plugins/src/async",
      text: "requirejs-plugins/lib/text",
      require: "requirejs-plugins/lib/require",
      font: "requirejs-plugins/src/font",
      goog: "requirejs-plugins/src/goog",
      image: "requirejs-plugins/src/image",
      json: "requirejs-plugins/src/json",
      noext: "requirejs-plugins/src/noext",
      mdown: "requirejs-plugins/src/mdown",
      propertyParser: "requirejs-plugins/src/propertyParser",
      markdownConverter: "requirejs-plugins/lib/Markdown.Converter"
    }
  };

  let callConfig = requirejs.config;

  callConfig(config);
})();
