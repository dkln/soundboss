L = (text) ->
  console.log(text) if console? && console.log?

WebSocket ?= MozWebSocket if MozWebSocket?

class View

  messages =
    ok: -> "ALL SYSTEMS GO"
    disconnected: -> "<span>DISCONNECTED!</span>"
    playing: (sound) -> "PLAYING SOUND <span>#{sound}</span>"
    playingTo: (listeners) -> "PLAYING TO <span>#{listeners}</span> #{if listeners is 1 then "PERSON" else "PEOPLE"}"
    error: (message) -> "ERROR: <span>#{message}</span>"
    connections: (amount) -> "CONNECTIONS: <span>#{amount}</span>"

  setStatus: (key, params...) ->
    message = messages[key](params...)
    $('#status').html(message)

  sound: (event) ->
    $(event.target).attr('data-file')

  versions: (event) ->
    $(event.target).attr('data-versions')

  highlightSound: (sound) ->
    @findSound(sound).addClass('hover')

  dehighlightSound: (sound) ->
    @findSound(sound).removeClass('hover')

  findSound: (sound) ->
    $("li[data-file=#{sound}]")

  revertStatus: ->
    @setStatus "ok"
    @overlay().hide()

  setDisconnected: ->
    @setStatus "disconnected"
    @overlay().show()

  sounds: ->
    @__sounds ?= $('ul li')

  overlay: ->
    @__overlay ?= $('#overlay')

  private: ->
    @__private ?= $('#private')

  privateCheckbox: ->
    @__privateCheckbox ?= @private().find('.checkbox')

  enablePrivate: ->
    @privateCheckbox().html('X')

  disablePrivate: ->
    @privateCheckbox().html(' ')


class App

  constructor: (@view) ->
    @controller = new Controller(@view)
    @connect()
    @initSounds()
    @initPrivate()

  initSounds: ->
    @view.sounds().click (event) => @handleSoundClick(event)

  initPrivate: ->
    @view.private().click (event) => @handlePrivateClick(event)
    @private = false
    @renderPrivateState()

  connect: ->
    L 'starting connection'
    @socket = new WebSocket("ws://#{window.location.hostname}:8080")
    @socket.onopen    = (data) => @onSocketOpen (data)
    @socket.onclose   = (data) => @onSocketClose (data)
    @socket.onmessage = (data) => @onSocketMessage (data)
    @socket.onerror   = (data) => @onSocketError (data)

  handleSoundClick: (event) ->
    sound = @view.sound(event)
    versions = @view.versions(event) || false
    if @private
      @controller.onPlayAudio(sound: sound, versions: versions)
    else
      @socket.send("""{ "action": "playAudio", "args": { "sound": "#{sound}", "versions": #{versions} } }""")

  handlePrivateClick: (event) ->
    @private = !@private
    @controller.stopAllSounds()
    @renderPrivateState()

  renderPrivateState: ->
    if @private
      @view.enablePrivate()
    else
      @view.disablePrivate()

  onSocketMessage: (data) ->
    L 'onSocketMessage'
    message = $.parseJSON(data.data)
    method  = message.action.substr(0, 1).toUpperCase() + message.action.substr(1)
    @controller["on#{method}"](message.args)

  onSocketError: (data) ->
    L 'onSocketError'
    @view.setStatus "error", data.data

  onSocketOpen: (data) ->
    L 'onSocketOpen'
    @view.revertStatus()

  onSocketClose: (data) ->
    L 'onSocketClose'
    @view.setDisconnected()
    setTimeout((=> @connect()), 1000)


class Controller

  constructor: (@view) ->
    @soundsPlaying = []

  stopAllSounds: ->
    for sound in @soundsPlaying
      sound.stop()
      @handleSoundEnd(sound)

  onPlayAudio: (args) ->
    sound = new Sound(args.sound, args.versions)
    @soundsPlaying.push(sound)
    sound.bindEnd => @handleSoundEnd(sound)
    sound.play()

    @view.highlightSound(sound.name)
    @view.setStatus "playing", sound.name

  onConnectionChange: (args) ->
    @view.setStatus "connections", args.listeners
    @timeoutStatus()

  onPlayingSoundToOthers: (args) ->
    @view.setStatus "playingTo", args.listeners
    @timeoutStatus()

  handleSoundEnd: (sound) =>
    delete(@soundsPlaying[sound])
    @view.dehighlightSound(sound.name)
    @view.revertStatus()

  timeoutStatus: ->
    setTimeout((=> @view.revertStatus()), 2500)

class Sound

  constructor: (@name, @versions) ->
    @buzz = new buzz.sound( "/audio/#{@file()}", { formats: [ "ogg", "mp3" ] } )

  file: ->
    if @versions
      sound_index = Math.ceil(Math.random() * parseInt(@versions))
      L "Version: #{sound_index} / #{@versions}"
      "#{@name}#{sound_index}"
    else
      @name

  bindEnd: (callback) ->
    @buzz.bind("ended", callback)

  play: ->
    @buzz.play()

  stop: ->
    @buzz.stop()



jQuery ->
  new App(new View)
