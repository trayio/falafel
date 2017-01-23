
module.exports = {

    title: 'Test operation',

    dynamic_accumulation: true,

    input: {

    	test: {
    		type: 'string',
    		default: 'Hello world',
            required: true
    	},

    },

    output: {
        response: {
    		type: 'string',
    		default: 'response Hello world'
    	},
    }


}
