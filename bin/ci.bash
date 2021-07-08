#!/usr/bin/env bash

set -exu

cd "$(dirname "$0")"/..

deno fmt --check
deno lint

./bin/test.bash
