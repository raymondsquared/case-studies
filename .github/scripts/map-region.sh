#!/bin/sh

# Map region to short name
case "$1" in
  "AUSTRALIA_EAST")
    echo "TF_VAR_region_short=aue" >> $GITHUB_ENV
    ;;
  "EUROPE_WEST")
    echo "TF_VAR_region_short=euw" >> $GITHUB_ENV
    ;;
  "ASIA_SOUTHEAST")
    echo "TF_VAR_region_short=ase" >> $GITHUB_ENV
    ;;
  "US_EAST")
    echo "TF_VAR_region_short=use" >> $GITHUB_ENV
    ;;
  "US_WEST")
    echo "TF_VAR_region_short=usw" >> $GITHUB_ENV
    ;;
  *)
    echo "TF_VAR_region_short=oth" >> $GITHUB_ENV
    ;;
esac
