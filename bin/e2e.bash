#!/usr/bin/env bash

set -eu

cd "$(dirname "$0")"/..


update_snapshots=false
failed_tests=$((0))

[[ "$@" =~ '--write' ]] && update_snapshots=true

function test_snapshot() {
  snapshot_file=$1
  actual_out=$2

  if [ ! -f $snapshot_file ]; then
    echo "creating snapshot: $snapshot_file"
    echo "$actual_out" > $snapshot_file
    return 0
  fi

  expected_out="$(cat $snapshot_file)"

  if [[ "$actual_out" != "$expected_out" ]]; then
    if $update_snapshots; then
      echo "updating snapshot: $snapshot_file"
      echo "$actual_out" > $snapshot_file
      return 0
    fi

    echo "failed:"
    echo ""
    diff --color -u <(echo "$actual_out") <(echo "$expected_out")
    echo ""
    return 1
  else
    echo "pass"
    return 0
  fi
}

function test_compile() {
  test_file=$1
  snapshot_file="${test_file%.*}.compile.snap"
  actual_out=$(cat $test_file | ./bin/compile.bash) || return 1

  echo "compile snapshot test..."

  test_snapshot $snapshot_file "$actual_out"
}

function test_eval() {
  test_file=$1
  snapshot_file="${test_file%.*}.eval.snap"
  actual_out=$(cat $test_file | ./bin/compile.bash | ./bin/run.bash) || return 1

  echo "eval snapshot test..."

  test_snapshot $snapshot_file "$actual_out"
}

for file in e2e/*; do
  if [[ $file == *.mtl ]]; then
    echo ""
    echo ""
    echo "[$file]"

    test_compile $file || failed_tests=$(($failed_tests + 1))
    test_eval    $file || failed_tests=$(($failed_tests + 1))
  fi
done

if (( $failed_tests > 0 )); then
  echo ""
  echo ""
  echo "$failed_tests tests failed"
  echo "Please check eval results & snapshot diff output"
  echo "If all changes are expected, run the same command with '--write' argument"
  exit 1
fi
