#!/usr/bin/env bash

set -eu

cd "$(dirname "$0")"/..

failed_tests=$((0))

for file in e2e/*; do
  if [[ $file == *.mtl ]]; then
    echo "$file..."

    expected_out_filename="${file%.*}.txt"
    expected="$(cat $expected_out_filename)"

    actual=$(cat $file | ./bin/compile.bash | ./bin/run.bash)

    if [[ $actual != $expected ]]; then
      echo "fail: $actual != $expected"
      failed_tests=$(($failed_tests + 1))
    else
      echo "pass"
    fi

    if (( $failed_tests > 0 )); then
      echo "$failed_tests tests failed"
      exit 1
    fi
  fi
done
