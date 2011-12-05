require 'rubygems'
require 'bundler/setup'
require 'em-websocket'
require 'json'

sockets = []

HOST = '0.0.0.0'
PORT = 8080

def connection_change(sockets)
  sockets.each do |socket|
    socket.send({action: "connectionChange", args: { listeners: sockets.size}}.to_json)
  end
end

EventMachine.run do

  EventMachine::WebSocket.start(host: HOST, port: PORT) do |socket|

    socket.onopen do
      puts "Socket opened"
      sockets << socket
      connection_change sockets
    end

    socket.onmessage do |message|
      hash = JSON.parse(message)
      puts "Handling message: #{hash.inspect}"

      if hash.fetch("args"){{}}["preview"]
        puts "Playing preview"
        socket.send(message)
      else
        puts "Broadcasting sound to other sockets"
        sockets.each do |other_socket|
          other_socket.send(message) if other_socket != socket
        end
        socket.send({action: "playingSoundToOthers", args: { listeners: sockets.size - 1 }}.to_json)
      end

    end

    socket.onclose do
      puts "Socket closed"
      sockets.delete(socket)
      connection_change sockets
    end

  end

  puts "Server started successfully"

end
