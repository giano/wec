/*jslint node: true, es6: true, this: true */

'use strict';

import Promise from 'bluebird';
import request from 'request';

class WebComponentRandomWord {

  constructor(router, frontendCode) {
    this._router = router;
    this._frontendCode = frontendCode;
  }

  index(req, res) {
    res.render('index');
  }

  retrieve(req, res) {
    request('http://randomword.setgetgo.com/get.php', (error, response, body) => {
      if (!error && response.statusCode == 200) {
        res.json(body);
      }
    });
  }

  start() {
    this._router.get('/', this.index);
    this._router.get('/retrieve', this.retrieve);

    return Promise.resolve();
  }
}

WebComponentRandomWord.namespace = 'app';

export default WebComponentRandomWord;
