import { Vendor, Region } from '../common/enums';

export function getAwsRegion(vendor: Vendor, region: Region): string {
  if (vendor !== Vendor.AWS) {
    throw new Error(`Unsupported vendor: ${vendor}. Only AWS is supported.`);
  }

  switch (region) {
    case Region.US_EAST:
      return 'us-east-1';
    case Region.ASIA_SOUTHEAST:
      return 'ap-southeast-1';
    case Region.EUROPE_WEST:
      return 'eu-west-1';
    case Region.AUSTRALIA_EAST:
    case Region.OTHERS:
    default:
      return 'ap-southeast-2';
  }
}
