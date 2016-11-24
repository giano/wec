// element registration
requirejs(['api_caller', 'wec!polymer/polymer.html'], function (apiCaller) {
  Polymer({
    is: "random-word",

    // add properties and methods on the element's prototype

    properties: {
      // declare properties for the element's public API
      greeting: {
        type: String,
        value: "wordy"
      },

      isHighlighted: {
        type: Boolean,
        value: false,
        notify: true,
        observer: '_highlightChanged'
      }
    },

    listeners: {
      click: '_loadNewWord'
    },

    _loadNewWord: function () {
      this.isHighlighted = true;

      apiCaller.get(`${COMPONENT_MOUNTPOINT}/retrieve`).then((response) => {
        this.greeting = response;
        this.isHighlighted = false;
      });

    },

    _highlightChanged: function (value) {
      this.toggleClass('highlighted', value);
    }
  });
});
