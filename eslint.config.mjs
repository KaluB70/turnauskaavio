import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin'

const scopeToSrcTs = (arr) => arr.map((c) => ({...c, files: ['src/**/*.ts']}));

export default tseslint.config(
    ...scopeToSrcTs(tseslint.configs.recommended),
    ...scopeToSrcTs(tseslint.configs.stylistic),
    {
        plugins: {
            '@stylistic': stylistic
        },
        files: ['src/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'always'],
            'computed-property-spacing': ['error', 'never'],
            'no-trailing-spaces': 'error',
            'eol-last': ['error', 'always'],
            'indent': ['error', 'tab', {SwitchCase: 1}],
            '@stylistic/no-mixed-spaces-and-tabs': ["error", "smart-tabs"],
        },
    },
);
