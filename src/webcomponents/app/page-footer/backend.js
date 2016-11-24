'use strict';
/*jslint evil: true, nomen: true, sloppy: true */
/*global readFile: true, process: false, Packages: false, print: false,
console: false, java: false, module: false, requirejsVars, navigator,
document, importScripts, self, location, Components, FileUtils */
import Promise from 'bluebird';

class WebComponentPageFooter {

  constructor(router, frontendCode) {
    this._router = router;
    this._frontendCode = frontendCode;
  }

  index(req, res) {
    res.render('index');
  }

  start() {
    this._router.get('/', this.index);
    return Promise.resolve();
  }
}

WebComponentPageFooter.namespace = 'app';

export default WebComponentPageFooter;
