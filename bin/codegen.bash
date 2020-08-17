#!/usr/bin/env bash

set -exu

cd "$(dirname "$0")"/..

deno run --allow-write ./src/core/codegen-ast.ts ./src/core/ast.ts
