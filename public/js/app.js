(function() {
  var App, Controller, L, Sound, View;
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

    View.prototype.soundNames = function() {
      var sound, soundNames, _i, _len, _ref;
      soundNames = [];
      _ref = this.sounds();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sound = _ref[_i];
        soundNames.push($(sound).text().toLowerCase());
      }
      return soundNames;
    };

    View.prototype.overlay = function() {
      var _ref;
      return (_ref = this.__overlay) != null ? _ref : this.__overlay = $('#overlay');
    };

    View.prototype.private = function() {
      var _ref;
      return (_ref = this.__private) != null ? _ref : this.__private = $('#private');
    };

    View.prototype.searchBox = function() {
      var _ref;
      return (_ref = this.__searchBox) != null ? _ref : this.__searchBox = $('#search_box');
    };

    View.prototype.privateCheckbox = function() {
      var _ref;
      return (_ref = this.__privateCheckbox) != null ? _ref : this.__privateCheckbox = this.private().find('.checkbox');
    };

    View.prototype.enablePrivate = function() {
      return this.privateCheckbox().html('X');
    };

    View.prototype.disablePrivate = function() {
      return this.privateCheckbox().html(' ');
    };

    return View;

  })();

  App = (function() {

    function App(view) {
      this.view = view;
      this.controller = new Controller(this.view, this);
      this.connect();
      this.initSounds();
      this.initSearch();
      this.initPrivate();
    }

    App.prototype.initSounds = function() {
      var _this = this;
      return this.view.sounds().click(function(event) {
        return _this.handleSoundClick(event);
      });
    };

    App.prototype.initPrivate = function() {
      var _this = this;
      this.view.private().click(function(event) {
        return _this.handlePrivateClick(event);
      });
      this.private = false;
      return this.renderPrivateState();
    };

    App.prototype.initSearch = function() {
      var _this = this;
      return this.view.searchBox().keydown(function(event) {
        return _this.handleSearch(event);
      });
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
      versions = this.view.versions(event) || false;
      if (this.private) {
        return this.controller.playAudio({
          sound: sound,
          versions: versions
        });
      } else {
        return this.socket.send("{ \"action\": \"playAudio\", \"args\": { \"sound\": \"" + sound + "\", \"versions\": " + versions + " } }");
      }
    };

    App.prototype.handlePrivateClick = function(event) {
      this.private = !this.private;
      if (this.private) this.controller.stopAllSounds();
      return this.renderPrivateState();
    };

    App.prototype.handleSearch = function(event) {
      if (event.which === 13) {
        this.doSearch($(event.currentTarget).val());
        return this.clearSearchBox();
      }
    };

    App.prototype.doSearch = function(text) {
      if (this.playingAllTheThings(text) === true) {
        L('PLAY ALL THE THINGS!');
        text = text.substring(1);
        return this.doSearchMany(text);
      } else {
        return this.doSearchOne(text);
      }
    };

    App.prototype.doSearchOne = function(text) {
      var clicked, name, sound, _i, _len, _ref, _results;
      L("Searching first match for: " + text);
      clicked = false;
      _ref = this.view.sounds();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sound = _ref[_i];
        name = this.soundName(sound);
        if (this.matches(text, name) === true && clicked === false) {
          clicked = true;
          L("CLICKING " + name);
          _results.push($(sound).click());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    App.prototype.doSearchMany = function(text) {
      var name, sound, _i, _len, _ref, _results;
      L("Searching any match for: " + text);
      _ref = this.view.sounds();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sound = _ref[_i];
        name = this.soundName(sound);
        if (this.matches(text, name) === true) {
          L("CLICKING " + name);
          _results.push($(sound).click());
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    App.prototype.playingAllTheThings = function(text) {
      return text.charAt(0) === '!';
    };

    App.prototype.soundName = function(sound) {
      return $(sound).text().toLowerCase();
    };

    App.prototype.matches = function(text, name) {
      return this.searchRegExp(text).test(name);
    };

    App.prototype.searchRegExp = function(text) {
      return new RegExp("" + text, 'gi');
    };

    App.prototype.clearSearchBox = function() {
      return this.view.searchBox().val('');
    };

    App.prototype.renderPrivateState = function() {
      if (this.private) {
        return this.view.enablePrivate();
      } else {
        return this.view.disablePrivate();
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

    function Controller(view, app) {
      this.view = view;
      this.app = app;
      this.handleSoundEnd = __bind(this.handleSoundEnd, this);
      this.soundsPlaying = [];
    }

    Controller.prototype.stopAllSounds = function() {
      var sound, _i, _len, _ref, _results;
      _ref = this.soundsPlaying;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sound = _ref[_i];
        sound.stop();
        _results.push(this.handleSoundEnd(sound));
      }
      return _results;
    };

    Controller.prototype.onPlayAudio = function(args) {
      if (!this.app.private) return this.playAudio(args);
    };

    Controller.prototype.playAudio = function(args) {
      var sound;
      var _this = this;
      sound = new Sound(args.sound, args.versions);
      this.soundsPlaying.push(sound);
      sound.bindEnd(function() {
        return _this.handleSoundEnd(sound);
      });
      sound.play();
      this.view.highlightSound(sound.name);
      return this.view.setStatus("playing", sound.name);
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
      delete this.soundsPlaying[sound];
      this.view.dehighlightSound(sound.name);
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

  Sound = (function() {

    function Sound(name, versions) {
      this.name = name;
      this.versions = versions;
      this.buzz = new buzz.sound("/audio/" + (this.file()), {
        formats: ["ogg", "mp3"]
      });
    }

    Sound.prototype.file = function() {
      var sound_index;
      if (this.versions) {
        sound_index = Math.ceil(Math.random() * parseInt(this.versions));
        L("Version: " + sound_index + " / " + this.versions);
        return "" + this.name + sound_index;
      } else {
        return this.name;
      }
    };

    Sound.prototype.bindEnd = function(callback) {
      return this.buzz.bind("ended", callback);
    };

    Sound.prototype.play = function() {
      return this.buzz.play();
    };

    Sound.prototype.stop = function() {
      return this.buzz.stop();
    };

    return Sound;

  })();

  jQuery(function() {
    return new App(new View);
  });

}).call(this);
