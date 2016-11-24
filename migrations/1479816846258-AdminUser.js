/*jslint node: true, es6: true, this: true */

'use strict';

var mongoose = require('mongoose');
var config = require('config');
mongoose.connect(config.get('mongoose.uri'));

exports.up = function up(done) {
  try {
    var UserModel = require('../src/backend/models/UserModel');

    var adm = new UserModel({
      username: config.get('security.admin.username'),
      admin: true
    });

    UserModel.register(adm, config.get('security.admin.password'), function (err, account) {
      if (err) {
        return done(err);
      }

      done();
    });
  } catch (e) {
    done(e);
  } finally {

  }
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down(done) {
  done();
};
