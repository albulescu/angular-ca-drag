/**
 * Drag & Drop AngularJS Module
 * https://github.com/albulescu/angular-ca-drag
 *
 * Author Albulescu Cosmin <cosmin@albulescu.ro>
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    require('jit-grunt')(grunt, {
        usebanner : 'grunt-banner'
    });

    var banner = '/**\n'+
                 '* Drag & Drop AngularJS Module v<%= pkg.version %>\n'+
                 '* https://github.com/albulescu/caDrag\n'+
                 '*\n'+
                 '* Author Albulescu Cosmin <cosmin@albulescu.ro>\n'+
                 '* Licensed under the MIT license.\n'+
                 '*/\n';

    grunt.initConfig({

        pkg: grunt.file.readJSON('bower.json'),

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            source: [
                './src/**/*.js'
            ],
        },


        // Empties folders to start fresh
        clean: {
            tmp: '.tmp'
        },

        concat: {
            options: {
                separator:'\n\n',
                stripBanners: true,
                banner: banner + '\n\'use strict\';\n\n',
                process: function(src, filepath) {
                    return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                },
            },
            dist: {
                src: ['src/manager.js', 'src/draggable.js', 'src/directives.js', 'src/util.js'],
                dest: 'ca-drag.js',
            },
        },

        // Allow the use of non-minsafe AngularJS files. Automatically makes it
        // minsafe compatible so Uglify does not destroy the ng references
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    src: 'ca-drag.js'
                }]
            }
        },

        uglify: {
            source: {
                files: {
                    'ca-drag.min.js': ['ca-drag.js']
                }
            }
        },

        usebanner: {
            comments: {
                options: {
                    position: 'top',
                    banner: banner,
                },
                files: {
                    src: ['ca-drag.min.js']
                }
            }
        },

        watch: {
            files: ['src/*'],
            tasks: ['build']
        }

    });

    grunt.registerTask('build', [
        'clean:tmp',
        'concat',
        'ngAnnotate',
        'uglify',
        'usebanner',
    ]);

    grunt.registerTask('start', [
        'build',
        'watch',
    ]);

    grunt.registerTask('default', [
        'jshint:source',
        'build',
    ]);
};