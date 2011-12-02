require 'rubygems'
require 'bundler/setup'
require 'em-websocket'
require 'json'

sockets = []

HOST = '0.0.0.0'
PORT = 8080

EventMachine.run do

  EventMachine::WebSocket.start(host: HOST, port: PORT) do |socket|

    socket.onopen do
      puts "Socket opened"
      sockets << socket
    end

    socket.onmessage do |message|
      puts "Message received, sending to other sockets"
      puts message

      sockets.each do |other_socket|
        other_socket.send(message) if other_socket != socket
      end
    end

    socket.onclose do
      puts "Socket closed"
      sockets.delete(socket)
    end

  end

  puts "Server started and listening at http://#{HOST}:#{PORT}"

end
