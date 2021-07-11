#!/usr/bin/env bash

set -eu

cd "$(dirname "$0")"/..

deno run ./src/cli/compile-file.ts $@
