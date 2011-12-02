root = File.expand_path(File.dirname(__FILE__))
puts ">>> Serving #{root.inspect}"
run Rack::Directory.new("#{root}")
