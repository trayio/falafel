module.exports = {
    'env': {
        'es6': true,
        'node': true,
        'mocha': true,
    },
    'parserOptions': {
        'ecmaVersion': 2017
    },
    'extends': 'eslint:recommended',
    'globals': {
        'Threadneedle': true
    },
    'rules': {

        //recommended overrides
        'no-console': 1, //Use `// eslint-disable-next-line no-console` if you need to keep console.log
        'no-unused-vars': 0, //Uncomment later
        'no-case-declarations': 0,
        'no-inner-declarations': 0,

        //global rules
        'indent': [
            'error',
            'tab',
            {
                'ignoredNodes': [
                    'ConditionalExpression'
                ],
                'MemberExpression': 0,
                'SwitchCase': 1
            }
        ],
        'semi': [
            'error',
            'always'
        ],
        'quotes': [
            'error',
            'single',
            {
                'allowTemplateLiterals': true
            }
        ],
        'keyword-spacing': 'error',
        'comma-spacing':  [
            2,
            {
                'before': false,
                'after': true
            }
        ],
        'block-spacing': 'error',
        'space-before-blocks': [
            'error',
            'always'
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'brace-style': [
            'error',
            '1tbs',
            {
                'allowSingleLine': true
            }
        ],

        //function rules
        'space-before-function-paren': [
            'error',
            'always'
        ],
        'function-paren-newline': [
            'error',
            'multiline'
        ],
        'func-call-spacing': [
            'error',
            'never'
        ],
        'wrap-iife': [
            'error',
            'inside'
        ],
        'arrow-parens': [
            'error',
            'always'
        ],
        'arrow-body-style': [
            'error',
            'always'
        ],

        //array rules
        'array-bracket-spacing': [
            'error',
            'always',
            {
                'singleValue': false,
                'objectsInArrays': false
            }
        ],
        'array-element-newline': [
            'error',
            'consistent'
        ],
        'array-bracket-newline': [
            'error',
            {
                'multiline': true
            }
        ],

        //object rules
        'key-spacing': [
            2,
            {
                beforeColon: false,
                afterColon: true
            }
        ],
        'object-curly-spacing': [
            'error',
            'always'
        ],

        //conditions
        'multiline-ternary': [
            'error',
            'always-multiline'
        ]

    },
};
