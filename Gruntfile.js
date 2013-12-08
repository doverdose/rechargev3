'use strict';
var LIVERELOAD_PORT = 35729;

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
	// load all grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// configurable paths
	var yeomanConfig = {
		app: 'app',
		dist: 'public'
	};

	try {
		yeomanConfig.app = require('./bower.json').appPath || yeomanConfig.app;
	} catch (e) {}

	grunt.initConfig({
		yeoman: yeomanConfig,
		watch: {
			sass: {
				files: [ '<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
				tasks: [ 'sass:server' ]
			},
			express: {
				files:  ['{config,<%= yeoman.app %>}/**/*.js' ],
				tasks:  [ 'express:dev' ],
				options: {
					spawn: false,
					livereload: true
				}
			},
			livereload: {
				options: {
					livereload: LIVERELOAD_PORT
				},
				files: [
					'<%= yeoman.app %>/**/*.{html,ejs}',
					'{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
					'{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
					'<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
				]
			}
		},
		express: {
			options: {
				port: 8080,
				livereload: true
			},
			dev: {
				options: {
					script: 'web.js',
					node_env: 'development'
				}
			},
			prod: {
				options: {
					script: 'path/to/prod/server.js',
					node_env: 'production'
				}
			}
		},
		clean: {
			dist: {
				files: [{
					dot: true,
					src: [
						'.tmp',
						'<%= yeoman.dist %>/*',
						'!<%= yeoman.dist %>/.git*'
					]
				}]
			},
			server: '.tmp'
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: [
				'Gruntfile.js',
				'<%= yeoman.app %>/../config/**/*.js',
				'<%= yeoman.app %>/controllers/**/*.js',
				'<%= yeoman.app %>/models/**/*.js',
				'<%= yeoman.app %>/widgets/**/*.js'
			]
		},
		sass: {
			dist: {
				files: {
					'.tmp/styles/main.css': '<%= yeoman.app %>/styles/main.scss'
				}
			},
			server: {
				files: {
					'.tmp/styles/main.css': '<%= yeoman.app %>/styles/main.scss'
				}
			}
		},
		useminPrepare: {
			html: '<%= yeoman.app %>/views/**/*.ejs',
			options: {
				root: '<%= yeoman.app %>',
				dest: '<%= yeoman.dist %>'
			}
		},
		usemin: {
			html: [ '<%= yeoman.dist %>/**/*.ejs' ],
			css: [ '<%= yeoman.dist %>/styles/{,*/}*.css' ],
			options: {
				dirs: ['<%= yeoman.dist %>']
			}
		},
		imagemin: {
			dist: {
				files: [{
					expand: true,
					cwd: '<%= yeoman.app %>/images',
					src: '{,*/}*.{png,jpg,jpeg}',
					dest: '<%= yeoman.dist %>/images'
				}]
			}
		},
		htmlmin: {
			dist: {
				options: {
				/*removeCommentsFromCDATA: true,
				// https://github.com/yeoman/grunt-usemin/issues/44
				//collapseWhitespace: true,
				collapseBooleanAttributes: true,
				removeAttributeQuotes: true,
				removeRedundantAttributes: true,
				useShortDoctype: true,
				removeEmptyAttributes: true,
				removeOptionalTags: true*/
				},
				files: [{
					expand: true,
					cwd: '<%= yeoman.app %>',
					src: [ '*.ejs', 'views/**/*.ejs' ],
					dest: '<%= yeoman.dist %>'
				}]
			}
		},
		// Put files not handled in other tasks here
		copy: {
			dist: {
				files: [{
					expand: true,
					dot: true,
					cwd: '<%= yeoman.app %>',
					dest: '<%= yeoman.dist %>',
					src: [
						'*.{ico,png,txt,xml}',
						'.htaccess',
						'res/**/*',
						'bower_components/**/*',
						'images/{,*/}*.{gif,webp,svg}',
						'styles/fonts/*'
					]
				}]
			}
		},
		uglify: {
			dist: {
				files: {
					'<%= yeoman.dist %>/scripts/scripts.js': [
						'<%= yeoman.dist %>/scripts/scripts.js'
					]
				}
			}
		}
	});

	grunt.registerTask('server', function (target) {
		grunt.task.run([
			'clean:server',
			'sass:server',
			'express:dev',
			'watch'
		]);
	});

	grunt.registerTask('build', [
		'clean:dist',
		'sass:dist',
		'imagemin',
		'htmlmin',
		'useminPrepare',
		'copy',
		'concat',
		'cssmin',
		'uglify',
		'usemin'
	]);

	grunt.registerTask('default', [
		'jshint',
		'build'
	]);
};