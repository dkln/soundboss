(function() {
  var App, Controller;

  App = (function() {

    function App() {
      var _this = this;
      this.controller = new Controller();
      this.socket = new WebSocket("ws://" + window.location.hostname + ":8080");
      this.socket.onmessage = function(data) {
        return _this.onSocketMessage(data);
      };
      this.initSounds();
    }

    App.prototype.initSounds = function() {
      var _this = this;
      return $('ul li').click(function() {
        return _this.handleSoundClick(event);
      });
    };

    App.prototype.handleSoundClick = function(event) {
      return this.socket.send("{ \"action\": \"playAudio\", \"args\": { \"sound\": \"" + ($(event.currentTarget).attr('rel')) + "\" }}");
    };

    App.prototype.onSocketMessage = function(data) {
      var message, method;
      message = $.parseJSON(data.data);
      method = message.action.substr(0, 1).toUpperCase() + message.action.substr(1);
      return this.controller["on" + method](message.args);
    };

    return App;

  })();

  Controller = (function() {

    function Controller() {}

    Controller.prototype.onPlayAudio = function(args) {
      return console.log("playing " + args.sound);
    };

    return Controller;

  })();

  $(function() {
    return new App();
  });

}).call(this);
