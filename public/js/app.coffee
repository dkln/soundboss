L = -> console.log(arguments...)

MESSAGES =
  ok: "ALL SYSTEMS GO"
  disconnected: "<span>DISCONNECTED!</span>"

class App

  constructor: ->
    @controller = new Controller()
    @connect()
    @initSounds()
    @initPreview()

  initSounds: ->
    $('ul li').click => @handleSoundClick(event)

  initPreview: ->
    $('#preview').click => @handlePreviewClick(event)
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
    sound = $(event.currentTarget).attr('rel')
    @socket.send("""{ "action": "playAudio", "args": { "sound": "#{sound}", "preview": #{@preview} }}""")

  handlePreviewClick: (event) ->
    @preview = !@preview
    @renderPreviewState()

  renderPreviewState: ->
    checkbox = $('#preview #checkbox')
    if @preview
      checkbox.html('X')
    else
      checkbox.html(' ')

  onSocketMessage: (data) ->
    L 'onSocketMessage'
    message = $.parseJSON(data.data)
    method  = message.action.substr(0, 1).toUpperCase() + message.action.substr(1)
    @controller["on#{method}"](message.args)

  onSocketError: (data) ->
    L 'onSocketError'
    $('#status').html("ERROR: <span>#{data.data}</span>")

  onSocketOpen: (data) ->
    L 'onSocketOpen'
    $('#overlay').hide()
    $('#status').html(MESSAGES["ok"])

  onSocketClose: (data) ->
    L 'onSocketClose'
    $('#overlay').show()
    $('#status').html(MESSAGES["disconnected"])
    setTimeout((=> @connect()), 1000)

class Controller

  onPlayAudio: (args) ->
    L "Playing #{args.sound}"
    mySound = new buzz.sound( "/audio/#{args.sound}", { formats: [ "ogg", "mp3" ] } )
    mySound.play()
    mySound.bind("ended", => @handleSoundEnd(event, args.sound))

    $("li[rel=#{args.sound}]").addClass('hover')

    $('#status').html("PLAYING SOUND <span>#{args.sound}</span>")

  handleSoundEnd: (event, sound) ->
    $("li[rel=#{sound}]").removeClass('hover')
    $('#status').html(MESSAGES["ok"])


$ ->
  new App()
