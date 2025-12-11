export default {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: {
                    esModuleInterop: true,
                    isolatedModules: true,
                },
            },
        ],
    },
    transformIgnorePatterns: ["node_modules/(?!(supertest|@types)/)"],
    testMatch: ["**/__tests__/**/*.test.ts"],
    collectCoverageFrom: ["routes/**/*.ts", "services/**/*.ts", "!**/*.d.ts"],
};
