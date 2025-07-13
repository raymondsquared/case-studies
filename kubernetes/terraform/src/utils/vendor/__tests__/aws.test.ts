import { getAwsRegion } from '../index';
import { Vendor, Region } from '../../common/enums';

describe('getAwsRegion', () => {
  describe('Given non-AWS vendor', () => {
    describe('When calling getAwsRegion', () => {
      it.each([
        { vendor: Vendor.AZURE, region: Region.AUSTRALIA_EAST },
        { vendor: Vendor.GCP, region: Region.US_EAST },
        { vendor: Vendor.OTHERS, region: Region.EUROPE_WEST },
      ])('Then throws an error for $vendor vendor', ({ vendor, region }) => {
        expect(() => getAwsRegion(vendor, region)).toThrow(
          `Unsupported vendor: ${vendor}. Only AWS is supported.`
        );
      });
    });
  });

  describe('Given AWS vendor', () => {
    describe('When calling getAwsRegion with different regions', () => {
      it.each([
        { region: Region.AUSTRALIA_EAST, expected: 'ap-southeast-2' },
        { region: Region.US_EAST, expected: 'us-east-1' },
        { region: Region.ASIA_SOUTHEAST, expected: 'ap-southeast-1' },
        { region: Region.EUROPE_WEST, expected: 'eu-west-1' },
        { region: Region.OTHERS, expected: 'ap-southeast-2' },
      ])('Then returns $expected for $region region', ({ region, expected }) => {
        const result = getAwsRegion(Vendor.AWS, region);
        expect(result).toBe(expected);
      });
    });
  });
});
