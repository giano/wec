/*jslint node: true, es6: true, this: true */

'use strict';

import App from './app.js';

const start = function() {
  var app = new App();
  app.start();
};

if (!module.parent) {
  console.log("Starting...");
  start();
} else {
  console.log("Used as library");
}

export default start;
