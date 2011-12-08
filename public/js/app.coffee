L = (text) ->
  console.log(text) if console? && console.log?

WebSocket ?= MozWebSocket if MozWebSocket?

class View

  messages =
    ok: -> "ALL SYSTEMS GO"
    disconnected: -> "<span>DISCONNECTED!</span>"
    playing: (sound) -> "PLAYING SOUND <span>#{sound}</span>"
    playingTo: (listeners) -> "PLAYING TO <span>#{listeners}</span> #{if listeners is 1 then "PERSON" else "PEOPLE"}"
    playingButMute: (sound) -> "MUTED, <span>#{sound}</span> IS PLAYING THOUGH"
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

  preview: ->
    @__preview ?= $('#preview')

  previewCheckbox: ->
    @__previewCheckbox ?= @preview().find('.checkbox')

  enablePreview: ->
    @previewCheckbox().html('X')

  disablePreview: ->
    @previewCheckbox().html(' ')

  mute: ->
    @__mute ?= $('#mute')

  muteCheckbox: ->
    @__muteCheckbox ?= @mute().find('.checkbox')

  enableMute: ->
    @muteCheckbox().html('X')

  disableMute: ->
    @muteCheckbox().html(' ')

class App

  constructor: (@view) ->
    @controller = new Controller(@view)
    @connect()
    @initSounds()
    @initPreview()
    @initMute()

  initSounds: ->
    @view.sounds().click (event) => @handleSoundClick(event)

  initPreview: ->
    @view.preview().click (event) => @handlePreviewClick(event)
    @preview = false
    @renderPreviewState()

  initMute: ->
    @view.mute().click (event) => @handleMuteClick(event)
    @view.muted = false
    @mute = false
    @renderMuteState()

  connect: ->
    L 'starting connection'
    @socket = new WebSocket("ws://#{window.location.hostname}:8080")
    @socket.onopen    = (data) => @onSocketOpen (data)
    @socket.onclose   = (data) => @onSocketClose (data)
    @socket.onmessage = (data) => @onSocketMessage (data)
    @socket.onerror   = (data) => @onSocketError (data)

  handleSoundClick: (event) ->
    sound = @view.sound(event)
    versions = @view.versions(event) || "false"
    @socket.send("""{ "action": "playAudio", "args": { "sound": "#{sound}", "preview": #{@preview}, "versions": #{versions} } }""")

  handlePreviewClick: (event) ->
    @preview = !@preview
    @renderPreviewState()

  renderPreviewState: ->
    if @preview
      @view.enablePreview()
    else
      @view.disablePreview()

  handleMuteClick: (event) ->
    @mute = !@mute
    @view.muted = @mute
    @renderMuteState()

  renderMuteState: ->
    if @mute
      @view.enableMute()
    else
      @view.disableMute()

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

  onPlayAudio: (args) ->
    file_base = file = args.sound

    if @view.muted
      @view.setStatus "playingButMute", file_base
      setTimeout((=> @view.revertStatus()), 2000)
    else
      L "Playing '#{file_base}'"
      if args.versions
        sound_index = Math.ceil(Math.random() * parseInt(args.versions))
        L "Version: #{sound_index} / #{args.versions}"
        file = "#{file_base}#{sound_index}"

      mySound = new buzz.sound( "/audio/#{file}", { formats: [ "ogg", "mp3" ] } )
      mySound.bind("ended", => @handleSoundEnd(file_base))
      mySound.play()

      @view.highlightSound(file_base)
      @view.setStatus "playing", file_base

  onConnectionChange: (args) ->
    @view.setStatus "connections", args.listeners
    @timeoutStatus()

  onPlayingSoundToOthers: (args) ->
    @view.setStatus "playingTo", args.listeners
    @timeoutStatus()

  handleSoundEnd: (sound) =>
    @view.dehighlightSound(sound)
    @view.revertStatus()

  timeoutStatus: ->
    setTimeout((=> @view.revertStatus()), 2500)


jQuery ->
  new App(new View)
