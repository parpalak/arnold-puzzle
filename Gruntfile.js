module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            main: {
                src: [
                    'src/utils.js',
                    'src/point.js',
                    'src/line.js',
                    'src/polygon.js',
                    'src/field.js',
                    'src/renderer.js',
                    'src/ongoing-touches.js',
                    'src/controller.js'
                ],
                dest: 'public/bundle.js',
            },
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ['@babel/preset-env'],
                plugins: [
                    ["@babel/plugin-proposal-class-properties", { "loose": true }]
                ]
            },
            main: {
                files: {
                    'public/bundle.es5.js': 'public/bundle.js'
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! © 2020 Roman Parpalak */'
            },
            main: {
                src: 'public/bundle.es5.js',
                dest: 'public/bundle.min.js'
            }
        },
        processhtml: {
            options: {
                data: {hash: + new Date()}
            },
            index: {
                src: 'src/index.html',
                dest: 'public/index.html'
            },
        },
        cssmin: {
            main: {
                src: [
                    'src/style.css',
                ],
                dest: 'public/style.css'
            }
        },
        shell: {
            main: {
                command: [
                    'gzip -cn6 <%= cssmin.main.dest %> > <%= cssmin.main.dest %>.gz',
                    'gzip -cn6 <%= uglify.main.dest %> > <%= uglify.main.dest %>.gz',
                    'gzip -cn6 <%= processhtml.index.dest %> > <%= processhtml.index.dest %>.gz',
                ].join(' && ')
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-babel');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'babel', 'uglify', 'processhtml', 'cssmin', 'shell']);
};
