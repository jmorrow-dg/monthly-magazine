#!/bin/bash
export PATH="/Users/joshmorrowdavidgoliath/David & Goliath OS System/dg-magazine-generator/node_modules/.bin:$PATH"
cd "/Users/joshmorrowdavidgoliath/David & Goliath OS System/dg-magazine-generator" || exit 1
exec next dev -p 3001
