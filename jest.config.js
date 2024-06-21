/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest/presets/js-with-ts',
	testEnvironment: 'jsdom',
	moduleNameMapper: {
		'^json$': '<rootDir>/src/json/index.ts',
		'json/(.*)$': '<rootDir>/src/json/$1.ts',

		'^Interface$': '<rootDir>/src/ts/interface/index.ts',
		'^Model$': '<rootDir>/src/ts/model/index.ts',

		Lib: '<rootDir>/src/ts/lib/index.ts',

		'dist/lib/(.*)$': '<rootDir>/dist/lib/$1.js',
	} 
};