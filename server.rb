require 'rubygems'
require 'bundler/setup'
require 'em-websocket'
require 'json'

$:.unshift File.expand_path('../lib', __FILE__)

require 'pool'
require 'messenger'

HOST = '0.0.0.0'
PORT = 8080

pool = Pool.new

EventMachine.run do

  EventMachine::WebSocket.start(host: HOST, port: PORT) do |socket|

    socket.onopen do
      puts "Socket opened"
      pool.add socket
    end

    socket.onmessage do |message|
      puts "Handling message: #{message}"
      pool.message socket, message
    end

    socket.onclose do
      puts "Socket closed"
      pool.remove socket
    end

  end

  puts "Server started successfully"

end
