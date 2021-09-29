#!/bin/bash

set -e

aws s3 sync --delete \
		build/ \
		s3://directory.spatineo.com/tmp/tuulituhohaukka/

aws cloudfront create-invalidation --distribution-id E1G45QS3VPS8SO --paths "/*"
