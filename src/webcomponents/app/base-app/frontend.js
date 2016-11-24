// element registration
requirejs([
  'wec!polymer/polymer.html', 'wec!app/page-header.html', 'wec!app/page-footer.html'
], function() {
  Polymer({
    is: "base-app",

    // add properties and methods on the element's prototype

    properties: {
      // declare properties for the element's public API
    },

    listeners: {}
  });
});
