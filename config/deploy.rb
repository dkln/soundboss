set :application,     "soundboss"
set :repository,      "https://github.com/dkln/soundboss.git"
set :main_server,     "fixalist.nl"
set :user,            "soundboss"
set :password,        "dit is precies wat ik wil"
set :deploy_to,       '/home/soundboss/soundboss/'
set :deploy_via,      :copy
set :use_sudo,        false
set :thin_config,     'config/thin.yml'
set :branch,          'capistrano'
set :rvm_ruby_string, '1.9.3@soundboss'
set :rvm_type,        :user
set :keep_releases,   5

set :scm, :git
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none`

server "#{main_server}", :web, :app, :db, :primary => true

namespace :rvm do
  task :trust_rvmrc do
    run "cd #{release_path}; rvm rvmrc trust #{release_path}"
  end
end

namespace :deploy do
  desc "Restart the servers"
  task :restart do
    run "cd #{release_path}; kill `ps -u #{user}|awk '/ruby/{print $1}'` || echo 'nothing to kill'"
    run "screen -wipe || echo 'no screens to wipe'"
    run "cd #{release_path}; screen -AmdS websocket bundle exec ruby server.rb"
    run "touch #{release_path}/tmp/restart.txt"
  end

end

after "deploy:update_code", "rvm:trust_rvmrc"
