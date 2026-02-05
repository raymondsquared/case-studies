#!/bin/sh

case "$1" in
  "development")
    echo "TF_VAR_environment=development" >> $GITHUB_ENV
    echo "TF_VAR_environment_short=dev" >> $GITHUB_ENV
    ;;
  "staging")
    echo "TF_VAR_environment=staging" >> $GITHUB_ENV
    echo "TF_VAR_environment_short=stg" >> $GITHUB_ENV
    ;;
  "production")
    echo "TF_VAR_environment=production" >> $GITHUB_ENV
    echo "TF_VAR_environment_short=prd" >> $GITHUB_ENV
    ;;
  *)
    echo "TF_VAR_environment=others" >> $GITHUB_ENV
    echo "TF_VAR_environment_short=oth" >> $GITHUB_ENV
    ;;
esac
