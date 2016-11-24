/*jslint node: true, es6: true, this: true */

'use strict';

let instance = null;

import Promise from 'bluebird';
import config from 'config';
import express from 'express';
import redirect from 'express-redirect';
import mongoose from 'mongoose';
import Router from './router';
import Passport from './passport';
import WebComponentsMounter from './webcomponents_mounter';
import http from 'http';
import io from 'socket.io';
import spdy from 'spdy';
import enforce from 'express-sslify';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import utils from '../../lib/utils';

class App {

  constructor() {
    if (!instance) {
      instance = this;
      this._app = express();

      redirect(this._app);

      if (config.get('app.http2')) {
        let certs_path = path.resolve(__dirname, '..', '..', 'certs');

        const options = {
          key: fs.readFileSync(path.join(certs_path, 'server.key')),
          cert: fs.readFileSync(path.join(certs_path, 'server.crt'))
        };

        this._app.use(enforce.HTTPS());

        this._server = spdy.createServer(options, this._app);
      } else {
        this._server = http.Server(this._app);
      }

      this._io = io(this._server);
      this._router = new Router(this._app, this._io);
      this._passport = new Passport(this._app, this._io);
      this._webcomponents_mounter = new WebComponentsMounter(this._app);

      let chunks = require.context("../../dist/frontend/", true, /^(.*\.(js$))[^.]*$/igm);
      let css = require.context("../../dist/frontend/", true, /^(.*\.(css$))[^.]*$/igm);

      this._app.locals._ = _;
      this._app.locals.api_mount_point = config.get('app.api_base');
      this._app.locals.jwt_token_header_name = config.get('security.webtoken.header');
      this._app.locals.require_aliases = utils.extractAliases('cleanedroute');

      this._app.locals.htmlWebpackPlugin = {
        options: config.get('webpack.html'),
        files: {
          css: css.keys().map(function (el) {
            return el.replace("./", "/");
          }),
          js: chunks.keys().map(function (el) {
            return el.replace("./", "/");
          })
        }
      };

    }
    return instance;
  }

  start() {
    mongoose.Promise = Promise;
    mongoose.connect(config.get('mongoose.uri'));

    this.port = process.env.PORT || config.get('app.port') || 3000;
    var db = mongoose.connection;

    db.on('error', () => {
      throw new Error(`Unable to connect to database: ${config.get('mongoose.uri')}`);
    });

    let routerMount = () => {
      return this._router.mount();
    };

    let passportMount = () => {
      return this._passport.mount();
    };

    let webcomponentsMount = () => {
      return this._webcomponents_mounter.mount();
    };

    db.once('open', () => {
      passportMount().then(routerMount).then(webcomponentsMount).then(() => {
        this._server.listen(this.port, (error) => {
          if (error) {
            console.error(error);
            return process.exit(1);
          } else {
            console.log(`App started on port ${this.port}`);
          }
        });

        process.on('SIGINT', () => {
          this._server.close();
          console.log(`App stopping...`);
          process.exit(0);
        });
      }).error(function (e) {
        console.log(e);
        this._server.close();
      });
    });
  }
}

export default App;
