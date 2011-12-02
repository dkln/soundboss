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
      this.initPreview();
    }

    App.prototype.initSounds = function() {
      var _this = this;
      return $('ul li').click(function() {
        return _this.handleSoundClick(event);
      });
    };

    App.prototype.initPreview = function() {
      var _this = this;
      $('#preview').click(function() {
        return _this.handlePreviewClick(event);
      });
      this.preview = false;
      return this.renderPreviewState();
    };

    App.prototype.handleSoundClick = function(event) {
      var sound;
      sound = $(event.currentTarget).attr('rel');
      return this.socket.send("{ \"action\": \"playAudio\", \"args\": { \"sound\": \"" + sound + "\", \"preview\": " + this.preview + " }}");
    };

    App.prototype.handlePreviewClick = function(event) {
      event.target.blur();
      this.preview = !this.preview;
      return this.renderPreviewState();
    };

    App.prototype.renderPreviewState = function() {
      var checkbox;
      checkbox = $('#preview #checkbox');
      if (this.preview) {
        return checkbox.html('X').attr({
          "class": 'enabled'
        });
      } else {
        return checkbox.html(' ').attr({
          "class": 'disabled'
        });
      }
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
      var mySound;
      var _this = this;
      console.log("playing " + args.sound);
      mySound = new buzz.sound("/audio/" + args.sound, {
        formats: ["ogg", "mp3"]
      });
      mySound.play();
      mySound.bind("ended", function() {
        return _this.handleSoundEnd(event, args.sound);
      });
      $("li[rel=" + args.sound + "]").addClass('hover');
      return $('#status').html("PLAYING SOUND <span>" + args.sound + "</span>");
    };

    Controller.prototype.handleSoundEnd = function(event, sound) {
      return $("li[rel=" + sound + "]").removeClass('hover');
    };

    return Controller;

  })();

  $(function() {
    return new App();
  });

}).call(this);
