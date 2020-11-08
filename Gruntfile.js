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
        terser: {
            main: {
                src: 'public/bundle.js',
                dest: 'public/bundle.min.js'
            }
        },
        processhtml: {
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
                    'gzip -cn6 <%= terser.main.dest %> > <%= terser.main.dest %>.gz',
                    'gzip -cn6 <%= processhtml.index.dest %> > <%= processhtml.index.dest %>.gz',
                ].join(' && ')
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-terser');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-shell');

    // Default task(s).
    grunt.registerTask('default', ['concat', 'terser', 'processhtml', 'cssmin', 'shell']);
};
