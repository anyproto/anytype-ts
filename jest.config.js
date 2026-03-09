module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^Lib$': '<rootDir>/src/ts/lib/index.ts',
    '^Component$': '<rootDir>/src/ts/component/index.ts',
    '^dist/(.*)$': '<rootDir>/dist/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      compilerOptions: {
        esModuleInterop: true,
        jsx: "react"
      }
    }]
  },
};
