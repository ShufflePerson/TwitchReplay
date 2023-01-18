import type {Config} from 'jest';

const config: Config = {
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};

export default config;