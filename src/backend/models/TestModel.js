var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var TestSchema = new Schema({

module.exports = mongoose.model('test', TestSchema);