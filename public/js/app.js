(function() {
  var App, Controller, L, MESSAGES;

  L = function() {
    return console.log.apply(console, arguments);
  };

  MESSAGES = {
    ok: "ALL SYSTEMS GO",
    disconnected: "<span>DISCONNECTED!</span>"
  };

  App = (function() {

    function App() {
      this.controller = new Controller();
      this.connect();
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

    App.prototype.connect = function() {
      var _this = this;
      L('starting connection');
      this.socket = new WebSocket("ws://" + window.location.hostname + ":8080");
      this.socket.onopen = function(data) {
        return _this.onSocketOpen(data);
      };
      this.socket.onclose = function(data) {
        return _this.onSocketClose(data);
      };
      this.socket.onmessage = function(data) {
        return _this.onSocketMessage(data);
      };
      return this.socket.onerror = function(data) {
        return _this.onSocketError(data);
      };
    };

    App.prototype.handleSoundClick = function(event) {
      var sound;
      sound = $(event.currentTarget).attr('rel');
      return this.socket.send("{ \"action\": \"playAudio\", \"args\": { \"sound\": \"" + sound + "\", \"preview\": " + this.preview + " }}");
    };

    App.prototype.handlePreviewClick = function(event) {
      this.preview = !this.preview;
      return this.renderPreviewState();
    };

    App.prototype.renderPreviewState = function() {
      var checkbox;
      checkbox = $('#preview #checkbox');
      if (this.preview) {
        return checkbox.html('X');
      } else {
        return checkbox.html(' ');
      }
    };

    App.prototype.onSocketMessage = function(data) {
      var message, method;
      L('onSocketMessage');
      message = $.parseJSON(data.data);
      method = message.action.substr(0, 1).toUpperCase() + message.action.substr(1);
      return this.controller["on" + method](message.args);
    };

    App.prototype.onSocketError = function(data) {
      L('onSocketError');
      return $('#status').html("ERROR: <span>" + data.data + "</span>");
    };

    App.prototype.onSocketOpen = function(data) {
      L('onSocketOpen');
      $('#overlay').hide();
      return $('#status').html(MESSAGES["ok"]);
    };

    App.prototype.onSocketClose = function(data) {
      var _this = this;
      L('onSocketClose');
      $('#overlay').show();
      $('#status').html(MESSAGES["disconnected"]);
      return setTimeout((function() {
        return _this.connect();
      }), 1000);
    };

    return App;

  })();

  Controller = (function() {

    function Controller() {}

    Controller.prototype.onPlayAudio = function(args) {
      var mySound;
      var _this = this;
      L("Playing " + args.sound);
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
      $("li[rel=" + sound + "]").removeClass('hover');
      return $('#status').html(MESSAGES["ok"]);
    };

    return Controller;

  })();

  $(function() {
    return new App();
  });

}).call(this);
