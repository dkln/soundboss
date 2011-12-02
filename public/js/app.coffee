class App
  constructor: ->
    @controller = new Controller()
    @socket = new WebSocket("ws://#{window.location.hostname}:8080")
    @socket.onmessage = (data) => @onSocketMessage (data)

    @initSounds()
    @initPreview()

  initSounds: ->
    $('ul li').click => @handleSoundClick(event)

  initPreview: ->
    $('#preview').click => @handlePreviewClick(event)
    @preview = false
    @renderPreviewState()

  handleSoundClick: (event) ->
    sound = $(event.currentTarget).attr('rel')
    @socket.send("""{ "action": "playAudio", "args": { "sound": "#{sound}", "preview": #{@preview} }}""")

  handlePreviewClick: (event) ->
    event.target.blur()
    @preview = !@preview
    @renderPreviewState()

  renderPreviewState: ->
    checkbox = $('#preview #checkbox')
    if @preview
      checkbox.html('X').attr(class: 'enabled')
    else
      checkbox.html(' ').attr(class: 'disabled')

  onSocketMessage: (data) ->
    message = $.parseJSON(data.data)
    method  = message.action.substr(0, 1).toUpperCase() + message.action.substr(1)

    @controller["on#{method}"](message.args)


class Controller
  onPlayAudio: (args) ->
    console.log "playing #{args.sound}"
    mySound = new buzz.sound( "/audio/#{args.sound}", { formats: [ "ogg", "mp3" ] } )
    mySound.play()

    $('#status').html("PLAYING SOUND <span>#{args.sound}</span>")


$ ->
  new App()
