load 'deploy' if respond_to?(:namespace) # cap2 differentiator
load 'config/deploy'
require "bundler/capistrano"
require 'capistrano_colors' unless ENV['COLORIZE_CAPISTRANO'] == 'off'

$:.unshift(File.expand_path('./lib', ENV['rvm_path'])) # Add RVM's lib directory to the load path.
require "rvm/capistrano"                  # Load RVM's capistrano plugin.
