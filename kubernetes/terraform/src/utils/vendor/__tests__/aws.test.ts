import { getAwsRegion } from '../index';
import { Vendor, Region } from '../../common/enums';

describe('getAwsRegion', () => {
  describe('Given non-AWS vendor', () => {
    describe('When calling getAwsRegion', () => {
      it.each([
        { vendor: Vendor.AZURE, region: Region.AUE },
        { vendor: Vendor.GCP, region: Region.USE },
        { vendor: Vendor.OTHERS, region: Region.EUW }
      ])('Then throws an error for $vendor vendor', ({ vendor, region }) => {
        expect(() => getAwsRegion(vendor, region)).toThrow(`Unsupported vendor: ${vendor}. Only AWS is supported.`);
      });
    });
  });
  
  describe('Given AWS vendor', () => {
    describe('When calling getAwsRegion with different regions', () => {
      it.each([
        { region: Region.AUE, expected: 'ap-southeast-2' },
        { region: Region.USE, expected: 'us-east-1' },
        { region: Region.ASIASE, expected: 'ap-southeast-1' },
        { region: Region.EUW, expected: 'eu-west-1' },
        { region: Region.OTHERS, expected: 'ap-southeast-2' }
      ])('Then returns $expected for $region region', ({ region, expected }) => {
        const result = getAwsRegion(Vendor.AWS, region);
        expect(result).toBe(expected);
      });
    });
  });
});
