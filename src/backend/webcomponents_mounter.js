/*jslint node: true, es6: true, this: true */

'use strict';

let instance = null;

import path from 'path';
import fs from 'fs';
import Promise from 'bluebird';
import config from 'config';
import express from 'express';
import redirect from 'express-redirect';
import * as babel from 'babel-core';
import CleanCSS from 'clean-css';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import _ from 'lodash';
import compression from 'compression';
import bodyParser from 'body-parser';
import dirsum from 'dirsum';
import serveStatic from 'serve-static';
import methodOverride from 'method-override';
import sass from 'node-sass';
import utils from '../../lib/utils';

const readFileP = Promise.promisify(fs.readFile);

class WebComponentsMounter {

  constructor(expressApp) {
    if (!instance) {
      instance = this;
      this.mountpoint = config.get('webcomponents.mountpoint');
      this.webcomponents = [];
      this._app = expressApp;
      this._app.locals.webcomponents_mountpoint = this.mountpoint;
    }
    return instance;
  }

  calculateDigest(componentPath) {
    return new Promise(function (resolve, reject) {
      dirsum.digest(componentPath, 'md5', (err, hashes) => {
        if (err) {
          return reject(err);
        }
        resolve(hashes.hash);
      });
    });
  }

  mountComponent(componentPath, backendClass) {
    let currentDigest = null;
    let router = express();

    router.use(compression());

    router.use(methodOverride('X-HTTP-Method-Override'));

    // parse application/x-www-form-urlencoded
    router.use(bodyParser.urlencoded({
      extended: false
    }));

    // parse application/json
    router.use(bodyParser.json());

    redirect(router);

    router.locals.webcomponents_mountpoint = this.mountpoint;
    const componentName = backendClass.slug || path.basename(componentPath);

    const componentUrl = (backendClass.namespace ?
      `${utils.slugifyName(backendClass.namespace)}/` :
      '') + utils.slugifyName(componentName);

    const frontendCodePath = path.resolve(componentPath, './frontend.js');

    const commonStylePath = path.resolve(__dirname, '..', 'frontend', 'styles');

    const frontendStylePath = path.resolve(componentPath, './style.css');
    const frontendSassPath = path.resolve(componentPath, './style.scss');

    const frontendCommonStylePath = path.resolve(commonStylePath, `wec-${componentName}.css`);
    const frontendCommonSassPath = path.resolve(commonStylePath, `wec-${componentName}.scss`);

    const viewsPath = path.join(componentPath, 'views');
    const assetsPath = path.join(componentPath, 'assets');

    router.set('view engine', config.get('app.engine'));
    router.set('views', viewsPath);

    let startInstance = (frontendCode = '') => {
      return this.calculateDigest(componentPath).then((digest) => {
        const cleaner = postcss([autoprefixer({
          add: false,
          browsers: []
        })]);
        const prefixer = postcss([autoprefixer]);

        let styleCss = '';

        if (!styleCss) {
          try {
            let resultStyleCss = sass.renderSync({
              file: frontendCommonSassPath
            });
            if (resultStyleCss) {
              styleCss = resultStyleCss.css || '';
            }
          } catch (e) {} finally {}
        }

        if (!styleCss) {
          try {
            styleCss = (fs.readFileSync(frontendCommonStylePath) || '').toString('utf-8').trim();
          } catch (e) {} finally {}
        }

        if (!styleCss) {
          try {
            let resultStyleCss = sass.renderSync({
              file: frontendSassPath
            });
            if (resultStyleCss) {
              styleCss = resultStyleCss.css || '';
            }
          } catch (e) {} finally {}
        }

        if (!styleCss) {
          try {
            styleCss = (fs.readFileSync(frontendStylePath) || '').toString('utf-8').trim();
          } catch (e) {} finally {}
        }

        return cleaner.process(styleCss).then((cleaned) => {
          return prefixer.process(cleaned.css);
        }).then((result) => {
          styleCss = result.css;

          let styleCssMinified = new CleanCSS().minify(styleCss).styles || styleCss;

          let componentMountpoint = `/${this.mountpoint}/${componentUrl}`;

          const debugActive = config.get('debug');

          let bustersPath = path.resolve(__dirname, '..', '..', 'busters.json');

          var busters = {};

          try {
            busters = JSON.parse(fs.readFileSync(bustersPath) || '{}');
          } catch (e) {
            busters = {};
          }

          let cleanedComponentMountpoint = componentMountpoint.replace(/^\/|\/$/g, '');

          busters[cleanedComponentMountpoint] = digest;
          busters[cleanedComponentMountpoint + ".html"] = digest;
          busters[cleanedComponentMountpoint + "/"] = digest;

          frontendCode = `
            ;(function(){
              const DIGEST = '${digest}';
              /* The base mountpoint */
              const BASE_MOUNTPOINT = '${this.mountpoint}';
              /* The component mountpoint */
              const COMPONENT_MOUNTPOINT = '${componentMountpoint}';
              /* Start of component code */
              ${frontendCode.toString('utf-8').trim()}
              /* End of component code */
            })();
          `;

          let frontendCodeBabelized = babel.transform(frontendCode, {
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
          }).code || frontendCode;

          try {
            fs.accessSync(assetsPath, fs.F_OK);
            router.use(serveStatic(assetsPath, {
              fallthrough: true
            }));
          } catch (e) {}

          router.use((req, res, next) => {
            res.locals.frontendCode = frontendCodeBabelized;
            res.locals.styleCss = debugActive ?
              styleCss :
              styleCssMinified;
            next();
          });

          let instance = new backendClass(router, frontendCodeBabelized);

          this._app.redirect(`${componentMountpoint}/index.html?`, componentMountpoint + '/', 301, true);
          this._app.redirect(`${componentMountpoint}.html?`, componentMountpoint + '/', 301, true);

          return instance.start().then(() => {
            this._app.use(componentMountpoint, router);

            let componentElement = {
              digest: digest,
              mount: componentMountpoint,
              router: router,
              instance: instance,
              name: componentName
            };

            this.webcomponents.push(componentElement);

            return new Promise(function (resolve, reject) {
              fs.writeFile(bustersPath, JSON.stringify(busters, null, 2), function (err) {
                console.log(`Mounted WebComponent at ${componentUrl}`);
                resolve(componentElement);
              });
            });

          });
        });
      });
    };

    return readFileP(frontendCodePath).then(startInstance).catch((err) => {
      console.log(err);
    });
  }

  mount() {
    let req = require.context('../webcomponents/', true, /^(.*backend\.(js$))[^.]*$/igm);
    return Promise.each(req.keys(), (file) => {
      let componentPath = path.dirname(path.resolve(__dirname, '../webcomponents/', file));
      return this.mountComponent(componentPath, req(file));
    }).then(() => {
      return new Promise((resolve, reject) => {
        let wc_external = path.resolve(__dirname, '..', '..', 'bower_components');
        this._app.use('/' + this.mountpoint, serveStatic(wc_external, {
          fallthrough: true,
          index: false,
          maxAge: config.get('router.static_max_age')
        }));
        resolve();
      });
    });
  }
}

export default WebComponentsMounter;
