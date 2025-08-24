export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 20000,
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  roots: ['<rootDir>/test']
};
