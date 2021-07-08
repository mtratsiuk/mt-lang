#!/usr/bin/env bash

set -exu

cd "$(dirname "$0")"/..

deno run --allow-write ./src/core/ast-codegen.ts ./src/core/ast.ts

./bin/fmt.bash
