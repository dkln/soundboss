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

  soundNames: ->
    soundNames = []
    for sound in @sounds()
      soundNames.push($(sound).text().toLowerCase())
    soundNames

  overlay: ->
    @__overlay ?= $('#overlay')

  private: ->
    @__private ?= $('#private')

  searchBox: ->
    @__searchBox ?= $('#search_box')

  privateCheckbox: ->
    @__privateCheckbox ?= @private().find('.checkbox')

  enablePrivate: ->
    @privateCheckbox().html('X')

  disablePrivate: ->
    @privateCheckbox().html(' ')



class App

  constructor: (@view) ->
    @controller = new Controller(@view, this)
    @connect()
    @initSounds()
    @initSearch()
    @initPrivate()

  initSounds: ->
    @view.sounds().click (event) => @handleSoundClick(event)

  initPrivate: ->
    @view.private().click (event) => @handlePrivateClick(event)
    @private = false
    @renderPrivateState()

  initSearch: ->
    @view.searchBox().keydown (event) => @handleSearch(event)

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
      @controller.playAudio(sound: sound, versions: versions)
    else
      @socket.send("""{ "action": "playAudio", "args": { "sound": "#{sound}", "versions": #{versions} } }""")

  handlePrivateClick: (event) ->
    @private = !@private
    @controller.stopAllSounds() if @private
    @renderPrivateState()

  handleSearch: (event) ->
    if event.which == 13
      @doSearch($(event.currentTarget).val())
      @clearSearchBox()

  doSearch: (text) ->
    L "Searching #{text}"
    clicked = false
    for sound in @view.sounds()
      name = $(sound).text().toLowerCase()
      regex = new RegExp("#{text}", 'gi')
      if regex.test(name) == true && clicked == false
        clicked = true
        L "CLICKING #{name}"
        $(sound).click()

  clearSearchBox: ->
    @view.searchBox().val('')

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

  constructor: (@view, @app) ->
    @soundsPlaying = []

  stopAllSounds: ->
    for sound in @soundsPlaying
      sound.stop()
      @handleSoundEnd(sound)

  onPlayAudio: (args) ->
    unless @app.private
      @playAudio(args)

  playAudio: (args) ->
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
