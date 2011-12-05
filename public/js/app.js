(function() {
  var App, Controller, L, SoundPlayer, View;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

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
      return $(event.currentTarget).attr('data-file');
    };

    View.prototype.versions = function(event) {
      return $(event.currentTarget).attr('data-versions');
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

    View.prototype.reverb = function() {
      var _ref;
      return (_ref = this.__reverb) != null ? _ref : this.__reverb = $('#reverb');
    };

    View.prototype.reverbCheckbox = function() {
      var _ref;
      return (_ref = this.__reverbCheckbox) != null ? _ref : this.__reverbCheckbox = this.reverb().find('.checkbox');
    };

    View.prototype.enableReverb = function() {
      return this.reverbCheckbox().html('X');
    };

    View.prototype.disableReverb = function() {
      return this.reverbCheckbox().html(' ');
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
      this.initReverb();
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

    App.prototype.initReverb = function() {
      var _this = this;
      this.view.reverb().click(function() {
        return _this.handleReverbClick(event);
      });
      this.reverb = false;
      return this.renderReverbState();
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
      return this.socket.send("{ \"action\": \"playAudio\", \"args\": { \"sound\": \"" + sound + "\", \"preview\": " + this.preview + ", \"reverb\": " + this.reverb + ", \"versions\": " + versions + " } }");
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

    App.prototype.handleReverbClick = function(event) {
      this.reverb = !this.reverb;
      return this.renderReverbState();
    };

    App.prototype.renderReverbState = function() {
      if (this.reverb) {
        return this.view.enableReverb();
      } else {
        return this.view.disableReverb();
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
      this.soundplayer = new SoundPlayer();
    }

    Controller.prototype.onPlayAudio = function(args) {
      var file, file_base, sound_index;
      file_base = file = args.sound;
      L("Playing '" + file_base + "'");
      if (args.versions) {
        sound_index = Math.ceil(Math.random() * parseInt(args.versions));
        L("Version: " + sound_index + " / " + args.versions);
        file = "" + file_base + sound_index;
      }
      this.soundplayer.play(file, {
        reverb: args.reverb,
        file_base: file_base,
        callback: this.handleSoundEnd
      });
      this.view.highlightSound(file_base);
      return this.view.setStatus("playing", file_base);
    };

    Controller.prototype.onPlayingSoundToOthers = function(args) {
      var _this = this;
      this.view.setStatus("playingTo", args.listeners);
      return setTimeout((function() {
        return _this.view.revertStatus();
      }), 2500);
    };

    Controller.prototype.handleSoundEnd = function(sound) {
      this.view.dehighlightSound(sound);
      return this.view.revertStatus();
    };

    return Controller;

  })();

  SoundPlayer = (function() {

    function SoundPlayer() {
      var _this = this;
      this.context = new webkitAudioContext();
      this.reverb = this.context.createConvolver();
      this.reverb.connect(this.context.destination);
      this.load("/audio/reverb.wav", function(response) {
        return _this.reverb.buffer = _this.context.createBuffer(response, false);
      });
    }

    SoundPlayer.prototype.play = function(path, options) {
      var _this = this;
      this.sample = this.context.createBufferSource();
      this.sample.connect(this.context.destination);
      if (options.reverb === true) this.sample.connect(this.reverb);
      return this.load("/audio/" + path + ".ogg", function(response) {
        _this.sample.buffer = _this.context.createBuffer(response, false);
        _this.sample.noteOn(0);
        return setTimeout(function() {
          _this.sample.noteOff(0);
          return options.callback(options.file_base);
        }, _this.sample.buffer.duration * 1000);
      });
    };

    SoundPlayer.prototype.load = function(path, callback) {
      var request;
      request = new XMLHttpRequest();
      request.open("GET", path, true);
      request.responseType = "arraybuffer";
      request.onload = function() {
        return callback(request.response);
      };
      return request.send();
    };

    return SoundPlayer;

  })();

  jQuery(function() {
    return new App(new View);
  });

}).call(this);
