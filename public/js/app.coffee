L = -> console.log(arguments...)

class View

  messages =
    ok: -> "ALL SYSTEMS GO"
    disconnected: -> "<span>DISCONNECTED!</span>"
    playing: (sound) -> "PLAYING SOUND <span>#{sound}</span>"
    playingTo: (listeners) -> "PLAYING TO <span>#{listeners}</span> #{if listeners is 1 then "PERSON" else "PEOPLE"}"
    error: (message) -> "ERROR: <span>#{message}</span>"

  setStatus: (key, params...) ->
    message = messages[key](params...)
    $('#status').html(message)

  sound: (event) ->
    $(event.currentTarget).attr('rel')

  highlightSound: (sound) ->
    @findSound(sound).addClass('hover')

  dehighlightSound: (sound) ->
    @findSound(sound).removeClass('hover')

  findSound: (sound) ->
    $("li[rel=#{sound}]")

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
    @__previewCheckbox ?= @preview().find('#checkbox')

  enablePreview: ->
    @previewCheckbox().html('X')

  disablePreview: ->
    @previewCheckbox().html(' ')

class App

  constructor: (@view) ->
    @controller = new Controller(@view)
    @connect()
    @initSounds()
    @initPreview()

  initSounds: ->
    @view.sounds().click => @handleSoundClick(event)

  initPreview: ->
    @view.preview().click => @handlePreviewClick(event)
    @preview = false
    @renderPreviewState()

  connect: ->
    L 'starting connection'
    @socket = new WebSocket("ws://#{window.location.hostname}:8080")
    @socket.onopen    = (data) => @onSocketOpen (data)
    @socket.onclose   = (data) => @onSocketClose (data)
    @socket.onmessage = (data) => @onSocketMessage (data)
    @socket.onerror   = (data) => @onSocketError (data)

  handleSoundClick: (event) ->
    sound = @view.sound(event)
    @socket.send("""{ "action": "playAudio", "args": { "sound": "#{sound}", "preview": #{@preview} }}""")

  handlePreviewClick: (event) ->
    @preview = !@preview
    @renderPreviewState()

  renderPreviewState: ->
    if @preview
      @view.enablePreview()
    else
      @view.disablePreview()

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
    L "Playing #{args.sound}"
    mySound = new buzz.sound( "/audio/#{args.sound}", { formats: [ "ogg", "mp3" ] } )
    mySound.play()
    mySound.bind("ended", => @handleSoundEnd(event, args.sound))

    @view.highlightSound(args.sound)
    @view.setStatus "playing", args.sound

  onPlayingSoundToOthers: (args) ->
    @view.setStatus "playingTo", args.listeners
    setTimeout((=> @view.revertStatus()), 2500)

  handleSoundEnd: (event, sound) ->
    @view.dehighlightSound(sound)
    @view.revertStatus()



jQuery ->
  new App(new View)
