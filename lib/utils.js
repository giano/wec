var path = require('path');
var config = require('config');
var _ = require('lodash');

module.exports = {
  extractAliases: function extractAliases(mapName) {
    var aliases = _.chain(config.get('router.shortcuts')).map(function (el) {
      var ext = path.extname(el.route);
      el.shortname = el.shortname || path.basename(el.route, ext);
      el.cleanedroute = el.cleanedroute || ext == '.js' ? el.route.replace(ext, '') : el.route + "?noext";
      el.fullpath = path.resolve(__dirname, '..', el.path);
      return el;
    }).keyBy('shortname').mapValues(mapName).value();
    return aliases;
  },

  slugifyName: function slugifyName(string) {
    string = string.trim().replace(/([a-z])([A-Z])/g, '$1-$2').replace(/[^A-Za-z0-9\. -]/g, '');
    return string.replace(/  */g, '-').toLowerCase();
  }

};
