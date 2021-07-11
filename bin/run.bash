#!/usr/bin/env bash

set -eu

cd "$(dirname "$0")"/..

deno run --no-check $@ -
