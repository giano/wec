import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from 'config';
import passportLocalMongoose from 'passport-local-mongoose';

const SALT_WORK_FACTOR = 10;

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  'username': {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  'groups': Array,
  'admin': Boolean
});

UserSchema.plugin(passportLocalMongoose, {
  usernameUnique: true,
  session: true
});

module.exports = mongoose.model('user', UserSchema);
