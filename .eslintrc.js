module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
    ],
    overrides: [],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["react", "@typescript-eslint"],
    rules: {
        "member-access": 0,
        "prefer-const": "warn",
        "no-useless-escape": "warn",
        "ordered-imports": 0,
        "no-empty": "off",
        quotemark: 0,
        "no-fallthrough": "off",
        "no-console": 0,
        semicolon: 0,

        // unused vars
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_",
            },
        ],

        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/ban-types": [
            "error",
            {
                extendDefaults: true,
                types: {
                    "{}": false,
                },
            },
        ],

        // react, JSX related
        "react/jsx-key": "off",
        "react/no-find-dom-node": "off",
        "no-case-declarations": "off",
        "react/no-unescaped-entities": "off",
        "react/no-direct-mutation-state": "off",
        "react/display-name": "off",
        "jsx-no-lambda": 0,
        "jsx-no-multiline-js": 0,
    },
    settings: {
        react: {
            version: "detect",
        },
    },
};
