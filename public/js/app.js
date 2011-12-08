(function() {
  var App, Controller, L, View;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  L = function(text) {
    if ((typeof console !== "undefined" && console !== null) && (console.log != null)) {
      return console.log(text);
    }
  };

  if (typeof MozWebSocket !== "undefined" && MozWebSocket !== null) {
    if (typeof WebSocket === "undefined" || WebSocket === null) {
      WebSocket = MozWebSocket;
    }
  }

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
      playingButMute: function(sound) {
        return "MUTED, <span>" + sound + "</span> IS PLAYING THOUGH";
      },
      error: function(message) {
        return "ERROR: <span>" + message + "</span>";
      },
      connections: function(amount) {
        return "CONNECTIONS: <span>" + amount + "</span>";
      }
    };

    View.prototype.setStatus = function() {
      var key, message, params;
      key = arguments[0], params = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      message = messages[key].apply(messages, params);
      return $('#status').html(message);
    };

    View.prototype.sound = function(event) {
      return $(event.target).attr('data-file');
    };

    View.prototype.versions = function(event) {
      return $(event.target).attr('data-versions');
    };

    View.prototype.highlightSound = function(sound) {
      return this.findSound(sound).addClass('hover');
    };

    View.prototype.dehighlightSound = function(sound) {
      return this.findSound(sound).removeClass('hover');
    };

    View.prototype.findSound = function(sound) {
      return $("li[data-file=" + sound + "]");
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
      return (_ref = this.__previewCheckbox) != null ? _ref : this.__previewCheckbox = this.preview().find('.checkbox');
    };

    View.prototype.enablePreview = function() {
      return this.previewCheckbox().html('X');
    };

    View.prototype.disablePreview = function() {
      return this.previewCheckbox().html(' ');
    };

    View.prototype.mute = function() {
      var _ref;
      return (_ref = this.__mute) != null ? _ref : this.__mute = $('#mute');
    };

    View.prototype.muteCheckbox = function() {
      var _ref;
      return (_ref = this.__muteCheckbox) != null ? _ref : this.__muteCheckbox = this.mute().find('.checkbox');
    };

    View.prototype.enableMute = function() {
      return this.muteCheckbox().html('X');
    };

    View.prototype.disableMute = function() {
      return this.muteCheckbox().html(' ');
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
      this.initMute();
    }

    App.prototype.initSounds = function() {
      var _this = this;
      return this.view.sounds().click(function(event) {
        return _this.handleSoundClick(event);
      });
    };

    App.prototype.initPreview = function() {
      var _this = this;
      this.view.preview().click(function(event) {
        return _this.handlePreviewClick(event);
      });
      this.preview = false;
      return this.renderPreviewState();
    };

    App.prototype.initMute = function() {
      var _this = this;
      this.view.mute().click(function(event) {
        return _this.handleMuteClick(event);
      });
      this.view.muted = false;
      this.mute = false;
      return this.renderMuteState();
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
      var sound, versions;
      sound = this.view.sound(event);
      versions = this.view.versions(event) || "false";
      return this.socket.send("{ \"action\": \"playAudio\", \"args\": { \"sound\": \"" + sound + "\", \"preview\": " + this.preview + ", \"versions\": " + versions + " } }");
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

    App.prototype.handleMuteClick = function(event) {
      this.mute = !this.mute;
      this.view.muted = this.mute;
      return this.renderMuteState();
    };

    App.prototype.renderMuteState = function() {
      if (this.mute) {
        return this.view.enableMute();
      } else {
        return this.view.disableMute();
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
      this.handleSoundEnd = __bind(this.handleSoundEnd, this);
    }

    Controller.prototype.onPlayAudio = function(args) {
      var file, file_base, mySound, sound_index;
      var _this = this;
      file_base = file = args.sound;
      if (this.view.muted) {
        this.view.setStatus("playingButMute", file_base);
        return setTimeout((function() {
          return _this.view.revertStatus();
        }), 2000);
      } else {
        L("Playing '" + file_base + "'");
        if (args.versions) {
          sound_index = Math.ceil(Math.random() * parseInt(args.versions));
          L("Version: " + sound_index + " / " + args.versions);
          file = "" + file_base + sound_index;
        }
        mySound = new buzz.sound("/audio/" + file, {
          formats: ["ogg", "mp3"]
        });
        mySound.bind("ended", function() {
          return _this.handleSoundEnd(file_base);
        });
        mySound.play();
        this.view.highlightSound(file_base);
        return this.view.setStatus("playing", file_base);
      }
    };

    Controller.prototype.onConnectionChange = function(args) {
      this.view.setStatus("connections", args.listeners);
      return this.timeoutStatus();
    };

    Controller.prototype.onPlayingSoundToOthers = function(args) {
      this.view.setStatus("playingTo", args.listeners);
      return this.timeoutStatus();
    };

    Controller.prototype.handleSoundEnd = function(sound) {
      this.view.dehighlightSound(sound);
      return this.view.revertStatus();
    };

    Controller.prototype.timeoutStatus = function() {
      var _this = this;
      return setTimeout((function() {
        return _this.view.revertStatus();
      }), 2500);
    };

    return Controller;

  })();

  jQuery(function() {
    return new App(new View);
  });

}).call(this);
