#!/bin/bash

set -e

rm -rf build/
npm run build
unset AWS_PROFILE # assuming the default profile has rights to deploy
aws s3 sync build/ s3://stac-proto-client --delete
aws cloudfront create-invalidation --distribution-id E11V8LNN9XK23I --paths "/*"

