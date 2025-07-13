#!/bin/sh
if [ "$1" = "AWS" ]; then
  case "$2" in
    "AUSTRALIA_EAST")
      echo "AWS_REGION=ap-southeast-2" >> $GITHUB_ENV
      ;;
    "EUROPE_WEST")
      echo "AWS_REGION=eu-west-1" >> $GITHUB_ENV
      ;;
    "ASIA_SOUTHEAST")
      echo "AWS_REGION=ap-southeast-1" >> $GITHUB_ENV
      ;;
    *)
      echo "AWS_REGION=us-east-1" >> $GITHUB_ENV
      ;;
  esac
else
  echo "Vendor $1 not supported. No region mapped."
  exit 0
fi 