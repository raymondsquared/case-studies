import { cleanString, cleanEnvironment } from '../string';
import { Environment } from '../enums';

describe('cleanString', () => {
  it('Given undefined or empty string, When cleaning, Then it should return empty string', () => {
    expect(cleanString()).toBe('');
    expect(cleanString('')).toBe('');
  });

  it.each([
    ['hello', 'hello'],
    ['Hello', 'hello'],
    ['hello world', 'helloworld'],
    ['hello@world!', 'helloworld'],
    ['hello123', 'hello123'],
    ['  Foo_Bar-123  ', 'foobar123'],
    ['  hello  ', 'hello'],
    ['\thello\t', 'hello'],
    ['\nhello\n', 'hello'],
  ])('Given "%s", When cleaning, Then it should return "%s"', (input, expected) => {
    expect(cleanString(input)).toBe(expected);
  });
});

describe('cleanEnvironment', () => {
  it.each([
    [Environment.DEVELOPMENT, 'dev'],
    [Environment.STAGING, 'stg'],
    [Environment.PRODUCTION, 'prod'],
  ])('Given %s, When cleaning environment, Then it should return "%s"', (input, expected) => {
    expect(cleanEnvironment(input)).toBe(expected);
  });

  it('Given an unknown environment, When cleaning environment, Then it should default to dev', () => {
    const unknownEnv = 'UNKNOWN' as Environment;
    expect(cleanEnvironment(unknownEnv)).toBe('dev');
  });
});
