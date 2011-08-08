load File.expand_path("lib/blender_model.rb", File.dirname(__FILE__))
BlenderModel::ScriptInstaller.new.uninstall_scripts!
