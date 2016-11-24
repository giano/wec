/*jslint node: true, es6: true, this: true */

'use strict';

let instance = null;

import path from 'path';
import fs from 'fs';
import Promise from 'bluebird';
import config from 'config';
import express from 'express';
import compression from 'compression';
import serveStatic from 'serve-static';
import methodOverride from 'method-override';
import morgan from 'morgan';
import helmet from 'helmet';
import * as babel from 'babel-core';
import utils from '../../lib/utils';

import _ from 'lodash';

class Router {

  constructor(expressApp, socketIo) {
    if (!instance) {
      instance = this;
      this.routes = [];
      this._app = expressApp;
      this._io = socketIo;
    }
    return instance;
  }

  mount() {
    let webComponentsMountpoint = config.get('webcomponents.mountpoint');
    let viewsDir = path.resolve(__dirname, '..', 'views');

    this._app.use(helmet({
      nocache: false,
      noSniff: false
    }));

    this._app.use(compression());
    this._app.use(methodOverride('X-HTTP-Method-Override'));

    this._app.use(morgan(config.get('morgan')));

    this._app.set('view engine', config.get('app.engine'));
    this._app.set('views', viewsDir);

    const debugActive = config.get('debug');

    config.get('router.static_dirs').forEach((element) => {
      let full_path = path.resolve(__dirname, '..', '..', element);
      this._app.use(serveStatic(full_path, {
        fallthrough: true,
        index: false,
        maxAge: config.get('router.static_max_age')
      }));
    });

    config.get('router.shortcuts').forEach((element) => {
      if (!element.alias) {
        let full_path = path.resolve(__dirname, '..', '..', element.path);
        let tmp_path = path.resolve(__dirname, '..', '..', '.tmp', path.basename(element.path));

        if (path.extname(element.path) == '.js' && element.babelize) {
          let fileContent = (fs.readFileSync(full_path) || '').toString('utf-8').trim();
          let fileContentBabelized = fileContent;
          try {
            fileContentBabelized = babel.transform(fileContent, {
              'presets': [
                'es2015', 'es2016'
              ],
              'plugins': ['add-module-exports'],
              'sourceMaps': (debugActive ?
                'inline' :
                false),
              'minified': (debugActive ?
                false :
                true),
              'comments': (debugActive ?
                true :
                false),
              'compact': (debugActive ?
                false :
                true)
            }).code || fileContent;
          } catch (e) {
            fileContentBabelized = fileContent;
          } finally {

          }


          fs.writeFile(tmp_path, fileContentBabelized, 'utf-8', (err) => {
            if (err) {
              this._app.get([element.route, element.shortname], (req, res, next) => {
                res.sendFile(full_path, {
                  maxAge: config.get('router.static_max_age')
                });
              });
            } else {
              this._app.get([element.route, element.shortname], (req, res, next) => {
                res.sendFile(tmp_path, {
                  maxAge: config.get('router.static_max_age')
                });
              });
            }

          });
        } else {
          this._app.get([element.route, element.shortname], (req, res, next) => {
            res.sendFile(full_path, {
              maxAge: config.get('router.static_max_age')
            });
          });
        }

      }
    });

    this._app.get('/', (req, res) => {
      return res.render('index');
    });

    var req = require.context("./routes/", true, /^(.*\.(js$))[^.]*$/igm);

    return Promise.each(req.keys(), (file) => {
      let RouteManager = req(file);
      let router = express.Router();
      let instance = null;

      try {
        instance = new RouteManager(router, this._io);
      } catch (e) {
        router = RouteManager;
        instance = router;
      } finally {}

      let ext = path.extname(file);
      let basename = path.basename(file, ext);


      let baseString = `${RouteManager.root || basename}`.replace('routes', '');
      let slugName = utils.slugifyName((RouteManager.root || basename)).replace(/\-?(routes|frontend)/gi, '').trim();
      let isFrontend = baseString.indexOf('frontend') > 0;
      let route_root = `/${slugName}`;
      let isRouter = _.isArray(RouteManager.stack) && RouteManager.stack.length > 0 && RouteManager.stack[0].route;

      route_root = isFrontend ?
        route_root :
        `/${config.get('app.api_base')}${route_root}`;

      if(isFrontend){
        console.log(`Mounted frontend routes at ${route_root}`);
      }else{
        console.log(`Mounted API at ${route_root}`);
      }

      if (!isRouter && _.isFunction(instance.start)) {
        return instance.start().then(() => {
          this._app.use(route_root, router);
        });
      } else {
        this._app.use(route_root, router);
        return Promise.resolve();
      }
    });
  }
}

export default Router;
