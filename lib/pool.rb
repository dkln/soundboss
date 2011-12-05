class Pool

  def initialize(sockets = [], messenger = Messenger)
    @sockets = sockets
    @messenger = messenger
  end

  def add(socket)
    @sockets << socket
    connection_change
  end

  def remove(socket)
    @sockets.delete socket
    connection_change
  end

  def message(socket, message)
    @messenger.perform(@sockets, socket, message)
  end

  def connection_change
    @sockets.each do |socket|
      socket.send({action: "connectionChange", args: { listeners: connections}}.to_json)
    end
  end

  def connections
    @sockets.size
  end

end
