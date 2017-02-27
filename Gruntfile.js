
module.exports = function (grunt) {

	grunt.initConfig({

		mochaTest: {
			test: {
				options: {
          reporter: 'mocha-unfunk-reporter'
        },
        src: [
        	'test/*.js',
        	'test/*/*.js',
        	'test/*/*/*.js',
        ]
			}
		}

	});

	grunt.loadNpmTasks('grunt-mocha-test');


	grunt.registerTask('default', ['mochaTest']);

};
