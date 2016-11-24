// element registration
requirejs(['api_caller', 'wec!polymer/polymer.html', 'wec!paper-button/paper-button.html'], function (apiCaller) {
  Polymer({
    is: "random-word",

    // add properties and methods on the element's prototype

    properties: {
      // declare properties for the element's public API
      greeting: {
        type: String,
        value: "wordy"
      },

      isLoading: {
        type: Boolean,
        value: false,
        notify: true,
        observer: '_loadingChanged'
      }
    },

    listeners: {
      click: '_loadNewWord'
    },

    _loadNewWord: function () {
      this.isLoading = true;

      apiCaller.get(`${COMPONENT_MOUNTPOINT}/retrieve`).then((response) => {
        this.greeting = response;
        this.isLoading = false;
      });

    },

    _loadingChanged: function (value) {
      this.$.random_word_button.disabled = value;
    }
  });
});
