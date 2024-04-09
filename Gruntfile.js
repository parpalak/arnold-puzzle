module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            js: {
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
            css: {
                src: [
                    'src/style.css',
                    'src/fonts.css',
                ],
                dest: 'public/style.css',
            },
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ['@babel/preset-env'],
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
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'node_modules/@fontsource/chakra-petch/files/',
                        src: [
                            'chakra-petch-latin-400-normal.woff',
                            'chakra-petch-latin-400-normal.woff2',
                            'chakra-petch-latin-700-normal.woff',
                            'chakra-petch-latin-700-normal.woff2',
                        ],
                        dest: 'public/fonts/',
                        filter: 'isFile'
                    },
                ],
            },
        },
        cssmin: {
            main: {
                src: [
                    'public/style.css',
                ],
                dest: 'public/style.min.css'
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
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-babel');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'babel', 'uglify', 'processhtml', 'copy', 'cssmin', 'shell']);
};
