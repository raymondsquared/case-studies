import { Vendor, Region } from '../common/enums';

export function getAwsRegion(vendor: Vendor, region: Region): string {
  if (vendor !== Vendor.AWS) {
    throw new Error(`Unsupported vendor: ${vendor}. Only AWS is supported.`);
  }

  switch (region) {
    case Region.AUE:
      return 'ap-southeast-2';
    case Region.USE:
      return 'us-east-1';
    case Region.ASIASE:
      return 'ap-southeast-1';
    case Region.EUW:
      return 'eu-west-1';
    case Region.OTHERS:
    default:
      return 'ap-southeast-2';
  }
}
