#!/usr/bin/env bash

set -exu

cd "$(dirname "$0")"/..

deno fmt --check
# deno lint --unstable

./bin/test.bash
