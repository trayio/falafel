
module.exports = function (grunt) {

	grunt.initConfig({

		mochaTest: {
			test: {
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
