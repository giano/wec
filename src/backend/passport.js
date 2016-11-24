/*jslint node: true, es6: true, this: true */

'use strict';

let instance = null;
import _ from 'lodash';

import path from 'path';
import fs from 'fs';
import Promise from 'bluebird';
import config from 'config';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import oauth2 from 'passport-oauth2';
import expressSession from 'express-session';
import ConnectMongo from 'connect-mongo';
import mongoose from 'mongoose';

const MongoStore = ConnectMongo(expressSession);

import {
  Strategy as LocalStrategy
} from 'passport-local';

import {
  Strategy as JwtStrategy,
  ExtractJwt
} from 'passport-jwt';

class PassportController {
  constructor(expressApp, socketIo) {
    if (!instance) {
      instance = this;
      this._app = expressApp;
      this._io = socketIo;
    }
    return instance;
  }

  _getTokenForUser(user) {
    if (user) {
      return jwt.sign({
        sub: user.id
      }, config.get('security.webtokensalt'), {
        expiresIn: config.get('security.webtoken.expires'),
        algorithm: config.get('security.webtoken.algorithm'),
        audience: config.get('security.webtoken.audience'),
        issuer: config.get('security.webtoken.issuer')
      });
    } else {
      return null;
    }
  }

  _releaseToken(user, req, res, message) {
    if (!user) {
      res.json({
        success: false,
        message: message || 'Authentication failed. User not found.'
      });
    } else if (user) {
      var token = this._getTokenForUser(user);
      // return the information including token as JSON
      res.json({
        success: true,
        message: 'Enjoy your token!',
        token: token
      });
    }
  }

  mount() {

    this._app.use(cookieParser());

    // parse application/x-www-form-urlencoded
    this._app.use(bodyParser.urlencoded({
      extended: false
    }));

    // parse application/json
    this._app.use(bodyParser.json());

    this._app.use(expressSession({
      secret: config.get('security.sessionsalt'),
      resave: false,
      saveUninitialized: false,
      store: new MongoStore({
        mongooseConnection: mongoose.connection
      }),
      cookie: {
        secure: config.get('app.http2') || config.get('security.cookie_secure')
      }
    }));

    this._app.use(passport.initialize());
    this._app.use(passport.session());

    // passport config
    var UserModel = require('./models/UserModel');

    passport.use(UserModel.createStrategy());
    passport.serializeUser(UserModel.serializeUser());
    passport.deserializeUser(UserModel.deserializeUser());

    var opts = {
      issuer: config.get('security.webtoken.issuer'),
      audience: config.get('security.webtoken.audience'),
      algorithms: [config.get('security.webtoken.algorithm')],
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromHeader(config.get('security.webtoken.header')),
        ExtractJwt.fromAuthHeader(),
        ExtractJwt.fromBodyField(config.get('security.webtoken.param_name')),
        ExtractJwt.fromUrlQueryParameter(config.get('security.webtoken.param_name'))
      ]),
      secretOrKey: config.get('security.webtokensalt')
    };

    passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
      if (!jwt_payload) {
        return done(null, false);
      }
      UserModel.findOne({
        _id: jwt_payload.sub
      }, function (err, user) {
        if (err) {
          return done(err, false);
        }
        done(null, user);
      });
    }));

    this._app.use(function (req, res, next) {
      res.locals.loggedUser = req.user;
      res.locals.jwtToken = req.user ? req.session.jwt : '';
      next();
    });

    this._app.get('/register', (req, res) => {
      return res.render('authenticate/register');
    });

    this._app.post('/register', (req, res) => {
      UserModel.register(new UserModel({
        username: req.body.username
      }), req.body.password, (err, account) => {
        if (err) {
          return res.render('authenticate/register', {
            account: account,
            error: err.message
          });
        }

        passport.authenticate('local')(req, res, () => {
          req.session.jwt = this._getTokenForUser(req.user);
          res.redirect('/');
        });
      });
    });

    this._app.get('/login', function (req, res) {
      res.render('authenticate/login', {
        user: req.user
      });
    });

    this._app.post('/login', passport.authenticate('local'), (req, res) => {
      req.session.jwt = this._getTokenForUser(req.user);
      res.redirect('/');
    });

    this._app.get('/logout', (req, res) => {
      req.logout();
      res.redirect('/');
    });

    this._app.use(`/${config.get('app.api_base')}`, passport.authenticate([
      'jwt', 'local'
    ], {
      session: true
    }), (req, res, next) => {
      if (!req.isAuthenticated || !req.user) {
        return res.json({
          success: false,
          message: 'Failed to authenticate.'
        });
      } else {
        next();
      }
    });

    this._app.post('/jwt-token', (req, res) => {
      if (req.user) {
        this._releaseToken(req.user, req, res);
      } else {
        UserModel.findOne({
          username: req.body.username
        }, (err, user) => {
          if (err) {
            throw err;
          }
          if (user) {
            user.authenticate(req.body.password, (err, usermodel, passwordErr) => {
              if (err) {
                throw err;
              }
              this._releaseToken(usermodel, req, res, passwordErr ? passwordErr.message || passwordErr : null);
            });
          } else {
            this._releaseToken(null, req, res);
          }
        });
      }
    });

    return Promise.resolve();
  }
}

export default PassportController;
