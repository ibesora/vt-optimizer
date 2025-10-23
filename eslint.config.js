export default [
    {
        ignores: ['**/node_modules/**', '**/dist/**', '.git/**', 'index.js'],
    },
    {
        files: ['src/**/*.js', 'test/**/*.js'],
        languageOptions: {
            ecmaVersion: 2017,
            sourceType: "module",
        },
        linterOptions: {
        },
        rules: {
        },
        plugins: {
        }
    }
]
