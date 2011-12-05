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

set :scm, :git
# Or: `accurev`, `bzr`, `cvs`, `darcs`, `git`, `mercurial`, `perforce`, `subversion` or `none`

server "#{main_server}", :web, :app, :db, :primary => true

namespace :deploy do
  desc "Start the Thin process"
  task :start do
    sudo "bundle exec thin start -C #{thin_config}"
  end

  desc "Stop the Thin process"
  task :stop do
    sudo "bundle exec thin stop -C #{thin_config}"
  end

  desc "Restart the Thin process"
  task :restart do
    sudo "bundle exec thin restart -C #{thin_config}"
  end

end
