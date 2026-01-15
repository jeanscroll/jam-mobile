import type { Config } from "jest";

    const config: Config = {
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8",

    // Use ts-jest preset for TypeScript
    preset: "ts-jest",

    // Specify the environment (Node.js in this case)
    testEnvironment: "node",

    // Glob pattern for detecting test files
    testMatch: ["**/*.test.ts"],

    // Transform TypeScript files using ts-jest
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    };

    export default config;
