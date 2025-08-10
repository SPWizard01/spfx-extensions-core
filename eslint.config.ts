import eslint from "@eslint/js";
import stylistic from '@stylistic/eslint-plugin';
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: ["dist/"]
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    stylistic.configs.recommended,
    {
        rules: {
            "@stylistic/quote": ["error", "double"],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true
                }
            ]
        }
    }
);