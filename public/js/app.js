(function() {
  var App, Controller, L, View;
  var __slice = Array.prototype.slice;

  L = function() {
    return console.log.apply(console, arguments);
  };

  View = (function() {
    var messages;

    function View() {}

    messages = {
      ok: function() {
        return "ALL SYSTEMS GO";
      },
      disconnected: function() {
        return "<span>DISCONNECTED!</span>";
      },
      playing: function(sound) {
        return "PLAYING SOUND <span>" + sound + "</span>";
      },
      playingTo: function(listeners) {
        return "PLAYING TO <span>" + listeners + "</span> " + (listeners === 1 ? "PERSON" : "PEOPLE");
      },
      error: function(message) {
        return "ERROR: <span>" + message + "</span>";
      }
    };

    View.prototype.setStatus = function() {
      var key, message, params;
      key = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      message = messages[key].apply(messages, params);
      return $('#status').html(message);
    };

    View.prototype.sound = function(event) {
      return $(event.currentTarget).attr('rel');
    };

    View.prototype.highlightSound = function(sound) {
      return this.findSound(sound).addClass('hover');
    };

    View.prototype.dehighlightSound = function(sound) {
      return this.findSound(sound).removeClass('hover');
    };

    View.prototype.findSound = function(sound) {
      return $("li[rel=" + sound + "]");
    };

    View.prototype.revertStatus = function() {
      this.setStatus("ok");
      return this.overlay().hide();
    };

    View.prototype.setDisconnected = function() {
      this.setStatus("disconnected");
      return this.overlay().show();
    };

    View.prototype.sounds = function() {
      var _ref;
      return (_ref = this.__sounds) != null ? _ref : this.__sounds = $('ul li');
    };

    View.prototype.overlay = function() {
      var _ref;
      return (_ref = this.__overlay) != null ? _ref : this.__overlay = $('#overlay');
    };

    View.prototype.preview = function() {
      var _ref;
      return (_ref = this.__preview) != null ? _ref : this.__preview = $('#preview');
    };

    View.prototype.previewCheckbox = function() {
      var _ref;
      return (_ref = this.__previewCheckbox) != null ? _ref : this.__previewCheckbox = this.preview().find('#checkbox');
    };

    View.prototype.enablePreview = function() {
      return this.previewCheckbox().html('X');
    };

    View.prototype.disablePreview = function() {
      return this.previewCheckbox().html(' ');
    };

    return View;

  })();

  App = (function() {

    function App(view) {
      this.view = view;
      this.controller = new Controller(this.view);
      this.connect();
      this.initSounds();
      this.initPreview();
    }

    App.prototype.initSounds = function() {
      var _this = this;
      return this.view.sounds().click(function() {
        return _this.handleSoundClick(event);
      });
    };

    App.prototype.initPreview = function() {
      var _this = this;
      this.view.preview().click(function() {
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
      sound = this.view.sound(event);
      return this.socket.send("{ \"action\": \"playAudio\", \"args\": { \"sound\": \"" + sound + "\", \"preview\": " + this.preview + " }}");
    };

    App.prototype.handlePreviewClick = function(event) {
      this.preview = !this.preview;
      return this.renderPreviewState();
    };

    App.prototype.renderPreviewState = function() {
      if (this.preview) {
        return this.view.enablePreview();
      } else {
        return this.view.disablePreview();
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
      return this.view.setStatus("error", data.data);
    };

    App.prototype.onSocketOpen = function(data) {
      L('onSocketOpen');
      return this.view.revertStatus();
    };

    App.prototype.onSocketClose = function(data) {
      var _this = this;
      L('onSocketClose');
      this.view.setDisconnected();
      return setTimeout((function() {
        return _this.connect();
      }), 1000);
    };

    return App;

  })();

  Controller = (function() {

    function Controller(view) {
      this.view = view;
    }

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
      this.view.highlightSound(args.sound);
      return this.view.setStatus("playing", args.sound);
    };

    Controller.prototype.onPlayingSoundToOthers = function(args) {
      var _this = this;
      this.view.setStatus("playingTo", args.listeners);
      return setTimeout((function() {
        return _this.view.revertStatus();
      }), 2500);
    };

    Controller.prototype.handleSoundEnd = function(event, sound) {
      this.view.dehighlightSound(sound);
      return this.view.revertStatus();
    };

    return Controller;

  })();

  jQuery(function() {
    return new App(new View);
  });

}).call(this);
