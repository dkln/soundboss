use Rack::Static , :urls => { "/" => "index.html" } , :root => "public"
run Rack::URLMap.new("/" => Rack::Directory.new("public"))
