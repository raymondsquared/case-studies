import { getCleanString, getCleanEnvironment, getCleanRegion } from '../string';
import { Environment, Region } from '../enums';

describe('getCleanString', () => {
  it('Given undefined or empty string, When cleaning, Then it should return empty string', () => {
    expect(getCleanString()).toBe('');
    expect(getCleanString('')).toBe('');
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
    expect(getCleanString(input)).toBe(expected);
  });
});

describe('getCleanEnvironment', () => {
  it.each([
    [Environment.OTHERS, 'o'],
    [Environment.DEVELOPMENT, 'dev'],
    [Environment.STAGING, 'stg'],
    [Environment.PRODUCTION, 'prod'],
  ])('Given %s, When cleaning environment, Then it should return "%s"', (input, expected) => {
    expect(getCleanEnvironment(input)).toBe(expected);
  });

  it('Given an unknown environment, When cleaning environment, Then it should default to dev', () => {
    const unknownEnv = 'UNKNOWN' as Environment;
    expect(getCleanEnvironment(unknownEnv)).toBe('dev');
  });
});

describe('getCleanRegion', () => {
  it.each([
    [Region.AUSTRALIA_EAST, 'aue'],
    [Region.US_EAST, 'use'],
    [Region.ASIA_SOUTHEAST, 'ase'],
    [Region.EUROPE_WEST, 'euw'],
    [Region.OTHERS, 'o'],
  ])('Given %s, When cleaning region, Then it should return "%s"', (input, expected) => {
    expect(getCleanRegion(input)).toBe(expected);
  });

  it('Given an unknown region, When cleaning region, Then it should default to o', () => {
    const unknownRegion = 'UNKNOWN' as Region;
    expect(getCleanRegion(unknownRegion)).toBe('o');
  });
});
